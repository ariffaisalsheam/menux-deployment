import { initializeApp, getApps } from 'firebase/app'
import { getMessaging, getToken as fcmGetToken, deleteToken as fcmDeleteToken, isSupported } from 'firebase/messaging'
import type { Messaging } from 'firebase/messaging'
import { notificationAPI } from './api'

// Firebase config from Vite env (must be provided by deployment)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
}

const vapidKey = (import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined) || undefined
const FCM_TOKEN_KEY = 'fcm_web_token'

export function getStoredFcmToken(): string | null {
  try {
    return localStorage.getItem(FCM_TOKEN_KEY)
  } catch {
    return null
  }
}

function hasConfig(): boolean {
  return !!(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.messagingSenderId && firebaseConfig.appId)
}

async function ensureServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | undefined> {
  if (!('serviceWorker' in navigator)) return undefined
  try {
    // Reuse any existing registration first to avoid multiple SWs for root scope
    const existing = await navigator.serviceWorker.getRegistration()
    if (existing) return existing
    // Register the minimal FCM SW served from public/
    return await navigator.serviceWorker.register('/firebase-messaging-sw.js')
  } catch (e) {
    console.warn('[FCM] SW registration failed', e)
    return undefined
  }
}

function ensureFirebaseInitialized(): void {
  if (!hasConfig()) {
    console.info('[FCM] Firebase config missing; skipping init')
    return
  }
  if (getApps().length === 0) {
    initializeApp(firebaseConfig as any)
  }
}

async function getMessagingIfSupported(): Promise<Messaging | null> {
  try {
    const supported = await isSupported()
    if (!supported) return null
    ensureFirebaseInitialized()
    if (getApps().length === 0) return null
    return getMessaging()
  } catch (e) {
    console.warn('[FCM] isSupported check failed', e)
    return null
  }
}

export async function getWebFcmToken(registerWithBackend: boolean = true): Promise<string | null> {
  const messaging = await getMessagingIfSupported()
  if (!messaging) return null
  const swReg = await ensureServiceWorkerRegistration()
  try {
    // Ensure user has granted notification permission before requesting FCM token
    if (typeof Notification !== 'undefined' && Notification.permission !== 'granted') {
      try {
        const res = await Notification.requestPermission()
        if (res !== 'granted') return null
      } catch {}
    }
    const token = await fcmGetToken(messaging, { vapidKey, serviceWorkerRegistration: swReg })
    if (token && registerWithBackend) {
      try {
        await notificationAPI.registerFcmToken({
          token,
          platform: 'web',
          deviceId: undefined,
          deviceModel: navigator.userAgent,
        })
      } catch (e) {
        // Non-blocking for token fetch
        console.warn('[FCM] Backend token register failed', e)
      }
    }
    if (token) {
      try { localStorage.setItem(FCM_TOKEN_KEY, token) } catch {}
    }
    return token || null
  } catch (e) {
    console.warn('[FCM] Failed to get FCM token', e)
    return null
  }
}

export async function removeWebFcmToken(currentToken?: string, alsoUnregisterBackend: boolean = true): Promise<boolean> {
  const messaging = await getMessagingIfSupported()
  if (!messaging) return false
  try {
    const tokenForBackend = currentToken || getStoredFcmToken() || undefined
    if (alsoUnregisterBackend && tokenForBackend) {
      try {
        await notificationAPI.removeFcmToken(tokenForBackend)
      } catch (e) {
        console.warn('[FCM] Backend token removal failed', e)
      }
    }
    const ok = await fcmDeleteToken(messaging)
    try { localStorage.removeItem(FCM_TOKEN_KEY) } catch {}
    return ok
  } catch (e) {
    console.warn('[FCM] Failed to delete FCM token', e)
    return false
  }
}

export async function ensureFcmReadyAndRegister(): Promise<string | null> {
  return await getWebFcmToken(true)
}
