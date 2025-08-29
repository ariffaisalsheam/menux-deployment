import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { IMessage } from '@stomp/stompjs'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { useAuth } from './AuthContext'
import { useToast } from './ToastContext'
import { notificationAPI } from '../services/api'

// Minimal shape expected from backend realtime payload
export interface RealtimeNotification {
  id: number
  title?: string
  body?: string
  data?: any
  status?: string
  createdAt?: string
}

export interface NotificationContextType {
  connected: boolean
  lastEventId?: string | null
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export const useNotifications = () => {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider')
  return ctx
}

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isAuthenticated } = useAuth()
  const { notify } = useToast()
  const [connected, setConnected] = useState(false)
  const [lastEventId, setLastEventId] = useState<string | null>(null)
  const [inAppEnabled, setInAppEnabled] = useState<boolean>(true)

  const esRef = useRef<EventSource | null>(null)
  const retryRef = useRef<number>(0)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // STOMP/WS client and backoff
  const stompRef = useRef<Client | null>(null)
  const wsRetryRef = useRef<number>(0)
  const wsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wsConnectedRef = useRef<boolean>(false)
  const wsLastAttemptRef = useRef<number>(0)
  const wsMaxRetries = 5 // Maximum retry attempts before giving up

  const API_BASE_URL = useMemo(() => (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:8080/api', [])
  const WS_ENABLED = useMemo(() => {
    const v = (import.meta.env.VITE_WS_ENABLED as string | undefined)
    return v === undefined ? true : v !== 'false'
  }, [])

  // Load preferences once; mute toasts when disabled
  useEffect(() => {
    if (!isAuthenticated) return
    let mounted = true
    ;(async () => {
      try {
        const prefs = await notificationAPI.getPreferences().catch(() => null)
        if (mounted && prefs && typeof prefs.inAppEnabled === 'boolean') {
          setInAppEnabled(!!prefs.inAppEnabled)
        }
      } catch {}
    })()
    return () => { mounted = false }
  }, [isAuthenticated])

  // Clean up helper
  const closeEventSource = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (esRef.current) {
      try { esRef.current.close() } catch {}
      esRef.current = null
    }
    setConnected(false)
  }

  const closeWs = () => {
    if (wsTimeoutRef.current) {
      clearTimeout(wsTimeoutRef.current)
      wsTimeoutRef.current = null
    }
    if (stompRef.current) {
      try { stompRef.current.deactivate() } catch {}
      stompRef.current = null
    }
    wsConnectedRef.current = false
    setConnected(false)
  }

  const openSse = () => {
    // Append JWT as access_token for backend SSE auth
    const base = (API_BASE_URL || '').replace(/\/$/, '')
    const url = `${base}/notifications/stream?access_token=${encodeURIComponent(token!)}`
    // Ensure previous is closed
    closeEventSource()

    try {
      const es = new EventSource(url)
      esRef.current = es

      es.onopen = () => {
        setConnected(true)
        retryRef.current = 0
      }

      es.onmessage = (ev) => {
        setLastEventId(ev.lastEventId || null)
        try {
          const payload: RealtimeNotification = ev.data ? JSON.parse(ev.data) : ({} as any)
          if (payload && typeof payload === 'object' && payload.id != null) {
            window.dispatchEvent(new CustomEvent('notifications:new', { detail: payload }))
            if (inAppEnabled) {
              const title = payload.title || 'Notification'
              const body = payload.body || ''
              notify(`${title}${body ? ': ' + body : ''}`, 'info')
            }
          }
        } catch {
          // ignore parse errors
        }
      }

      es.onerror = () => {
        setConnected(false)
        try { es.close() } catch {}
        esRef.current = null
        const nextDelay = Math.min(30000, 1000 * Math.pow(2, Math.min(retryRef.current, 5))) // 1s -> 32s
        retryRef.current += 1
        timeoutRef.current = setTimeout(() => {
          openSse()
        }, nextDelay)
      }
    } catch {
      const nextDelay = Math.min(30000, 1000 * Math.pow(2, Math.min(retryRef.current, 5)))
      retryRef.current += 1
      timeoutRef.current = setTimeout(() => openSse(), nextDelay)
    }
  }

  // Open SSE connection and manage backoff
  useEffect(() => {
    // Only connect when authenticated and token present
    if (!isAuthenticated || !token) {
      closeEventSource()
      closeWs()
      return
    }

    const openWs = () => {
      // Check if we've exceeded max retries
      if (wsRetryRef.current >= wsMaxRetries) {
        console.warn('[WS] Max retry attempts reached, giving up')
        return
      }

      // Prevent too frequent connection attempts (minimum 2 seconds between attempts)
      const now = Date.now()
      if (now - wsLastAttemptRef.current < 2000) {
        console.warn('[WS] Connection attempt too soon, skipping')
        return
      }
      wsLastAttemptRef.current = now

      // Derive host base from API_BASE_URL by removing trailing /api
      const restBase = (API_BASE_URL || '').replace(/\/$/, '')
      const hostBase = restBase.replace(/\/(api)$/, '')

      closeWs()
      // Build STOMP client over SockJS
      const wsUrl = `${hostBase}/ws${token ? `?access_token=${encodeURIComponent(token)}` : ''}`
      const client = new Client({
        webSocketFactory: () => new SockJS(wsUrl, undefined, { transports: ['websocket','xhr-streaming','eventsource','xhr-polling'] }),
        connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
        reconnectDelay: 0, // we handle backoff manually
        debug: () => {},
      })

      client.onConnect = () => {
        console.log('[WS] Connected successfully')
        setConnected(true)
        wsRetryRef.current = 0 // reset retry count on success
        wsLastAttemptRef.current = 0 // reset attempt timer
        wsConnectedRef.current = true
        // If SSE fallback is open, close it to avoid duplicate events
        if (esRef.current) {
          closeEventSource()
        }
        // Subscribe to per-user queue delivered by backend
        client.subscribe('/user/queue/notifications', (msg: IMessage) => {
          try {
            const payload: RealtimeNotification = msg.body ? JSON.parse(msg.body) : ({} as any)
            if (payload && typeof payload === 'object' && payload.id != null) {
              window.dispatchEvent(new CustomEvent('notifications:new', { detail: payload }))
              if (inAppEnabled) {
                const title = payload.title || 'Notification'
                const body = payload.body || ''
                notify(`${title}${body ? ': ' + body : ''}`, 'info')
              }
            }
          } catch {}
        })
      }

      client.onWebSocketClose = () => {
        console.log('[WS] Connection closed')
        setConnected(false)
        wsConnectedRef.current = false

        // Only retry if we haven't exceeded max retries
        if (wsRetryRef.current < wsMaxRetries) {
          // schedule reconnect with exponential backoff
          const nextDelay = Math.min(30000, 1000 * Math.pow(2, Math.min(wsRetryRef.current, 5)))
          wsRetryRef.current += 1
          console.log(`[WS] Scheduling reconnect attempt ${wsRetryRef.current}/${wsMaxRetries} in ${nextDelay}ms`)
          wsTimeoutRef.current = setTimeout(() => {
            if (WS_ENABLED) openWs()
          }, nextDelay)
        } else {
          console.warn('[WS] Max retries reached, falling back to SSE')
          // Fallback to SSE if available
          if (esRef.current === null) {
            openSse()
          }
        }
      }

      client.onStompError = () => {
        setConnected(false)
        wsConnectedRef.current = false
      }

      stompRef.current = client
      client.activate()
    }

    if (WS_ENABLED) {
      openWs()
      // Also open SSE as a backup only if not connected after some delay
      const sseFallbackTimer = setTimeout(() => {
        if (!wsConnectedRef.current) openSse()
      }, 2000)
      return () => {
        clearTimeout(sseFallbackTimer)
        closeEventSource()
        closeWs()
      }
    } else {
      if (!wsConnectedRef.current) openSse()
      return () => {
        closeEventSource()
      }
    }

    // Reopen when token changes
  }, [isAuthenticated, token, API_BASE_URL, inAppEnabled, WS_ENABLED])

  const value = useMemo<NotificationContextType>(() => ({ connected, lastEventId }), [connected, lastEventId])

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}
