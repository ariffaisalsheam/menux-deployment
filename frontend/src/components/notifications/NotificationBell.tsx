import React, { useEffect, useMemo, useState } from 'react'
import { Bell, CheckCheck, Inbox, Loader2 } from 'lucide-react'
import { Button } from '../ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { notificationAPI } from '../../services/api'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export const NotificationBell: React.FC = () => {
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const navigate = useNavigate()
  const { user } = useAuth()

  const hasUnread = unreadCount > 0
  const unreadDisplay = useMemo(() => (unreadCount > 99 ? '99+' : String(unreadCount)), [unreadCount])

  const loadData = async () => {
    try {
      setLoading(true)
      const [countRes, listRes] = await Promise.all([
        notificationAPI.getUnreadCount().catch(() => ({ count: 0 })),
        notificationAPI.getNotifications({ page: 0, size: 10, unreadOnly: false }).catch(() => ({ content: [] }))
      ])
      setUnreadCount((countRes as any)?.count || 0)
      const content = (listRes as any)?.content ?? listRes ?? []
      setItems(Array.isArray(content) ? content : [])
    } catch (e) {
      // Non-blocking; errors are handled by interceptor
      console.error('Failed to load notifications', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    const id = setInterval(loadData, 45000) // refresh every 45s (balance UX vs rate limits)
    const onFocus = () => loadData()
    const onVisibility = () => { if (document.visibilityState === 'visible') loadData() }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      clearInterval(id)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  const markAllRead = async () => {
    try {
      await notificationAPI.markAllRead()
      setUnreadCount(0)
      // Optimistically update list
      setItems((prev) => prev.map((n) => ({ ...n, status: 'READ', readAt: n.readAt || new Date().toISOString() })))
      // Notify other components (e.g., sidebars) to refresh counts immediately
      window.dispatchEvent(new CustomEvent('notifications:changed'))
    } catch (e) {
      console.error('Failed to mark all read', e)
    }
  }

  const markRead = async (id: number) => {
    try {
      await notificationAPI.markRead(id)
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, status: 'READ', readAt: n.readAt || new Date().toISOString() } : n)))
      setUnreadCount((c) => (c > 0 ? c - 1 : 0))
      window.dispatchEvent(new CustomEvent('notifications:changed'))
    } catch (e) {
      console.error('Failed to mark read', e)
    }
  }

  const parseData = (d: any): Record<string, any> => {
    if (!d) return {}
    if (typeof d === 'string') {
      try { return JSON.parse(d) } catch { return {} }
    }
    if (typeof d === 'object') return d
    return {}
  }

  const handleItemSelect = async (n: any) => {
    const data = parseData((n as any)?.data)
    // Default route
    let to = user?.role === 'SUPER_ADMIN' ? '/admin/notifications' : '/dashboard/notifications'
    // If this looks like a manual payment related notification, route accordingly
    if (data?.paymentId || data?.manualPaymentId) {
      if (user?.role === 'SUPER_ADMIN') {
        to = '/admin/payments'
      } else {
        to = '/dashboard/upgrade'
      }
    }
    try {
      await markRead(n.id)
    } finally {
      navigate(to)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {hasUnread && (
            // Soft pulsing indicator behind the count badge
            <span className="absolute -top-1.5 -right-1.5 inline-flex h-4 w-4">
              <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping"></span>
            </span>
          )}
          {hasUnread && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 rounded-full bg-red-500 text-[10px] leading-4 text-white text-center">
              {unreadDisplay}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="p-3 flex items-center justify-between">
          <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={loadData} title="Refresh">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refresh'}
            </Button>
            <Button variant="ghost" size="sm" onClick={markAllRead} disabled={!hasUnread} title="Mark all read">
              <CheckCheck className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <DropdownMenuSeparator />
        <div className="max-h-96 overflow-y-auto">
          {items.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
              <Inbox className="h-6 w-6" />
              <span>No notifications</span>
            </div>
          ) : (
            <div className="py-1">
              {items.map((n) => {
                const unread = (n.status || '').toUpperCase?.() !== 'READ'
                return (
                  <DropdownMenuItem
                    key={n.id}
                    className="px-3 py-2 focus:bg-muted/60"
                    onSelect={(e) => { e.preventDefault(); handleItemSelect(n) }}
                  >
                    <div className="flex items-start gap-3 w-full">
                      <div className={`mt-1 h-2 w-2 rounded-full ${unread ? 'bg-blue-500' : 'bg-transparent'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-3">
                          <div className={`text-sm ${unread ? 'font-semibold' : 'font-medium'}`}>{n.title || 'Notification'}</div>
                          <div className="text-xs text-muted-foreground whitespace-nowrap">
                            {n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground truncate">
                          {n.body || ''}
                        </div>
                      </div>
                      {unread && (
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); markRead(n.id) }}>
                          Mark read
                        </Button>
                      )}
                    </div>
                  </DropdownMenuItem>
                )
              })}
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
