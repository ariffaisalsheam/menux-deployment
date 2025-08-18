import React, { useEffect, useMemo, useState } from 'react';
import { Crown, Bell, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useAuth } from '../../contexts/AuthContext';
import { Switch } from '../ui/switch';
import { notificationAPI } from '../../services/api';

export const NotificationCenter: React.FC = () => {
  const { user } = useAuth();
  const isPro = user?.subscriptionPlan === 'PRO';

  if (!isPro) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Bell className="w-8 h-8 text-blue-500" />
              Notification Center
            </h1>
            <p className="text-muted-foreground">
              Real-time alerts and notifications
            </p>
          </div>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Crown className="w-3 h-3" />
            Pro Feature
          </Badge>
        </div>

        <Card className="border-blue-300 bg-gradient-to-r from-blue-50 to-cyan-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Crown className="h-6 w-6 text-yellow-500" />
              Upgrade to Pro for Real-time Notifications
            </CardTitle>
            <CardDescription className="text-base">
              Stay updated with instant alerts and smart notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Card className="border-dashed border-2 border-blue-300">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-orange-500" />
                    <div>
                      <p className="font-medium">New Order Alert</p>
                      <p className="text-sm text-muted-foreground">Order #ORD-123 received</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-dashed border-2 border-blue-300">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="font-medium">Order Completed</p>
                      <p className="text-sm text-muted-foreground">Order #ORD-122 ready for pickup</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-dashed border-2 border-blue-300">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <Info className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="font-medium">Low Stock Alert</p>
                      <p className="text-sm text-muted-foreground">Chicken Biryani ingredients running low</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="text-center pt-4 border-t">
              <Button size="lg" className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white">
                <Crown className="w-4 h-4 mr-2" />
                Upgrade to Pro - ৳1,500/month
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Bell className="w-8 h-8 text-blue-500" />
            Notification Center
          </h1>
          <p className="text-muted-foreground">
            Real-time alerts and notifications
          </p>
        </div>
        <Badge variant="default" className="flex items-center gap-1 bg-yellow-500">
          <Crown className="w-3 h-3" />
          Pro Active
        </Badge>
      </div>

      <NotificationPreferences />
    </div>
  );
};

// Helper to convert base64 VAPID key to Uint8Array
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

const NotificationPreferences: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [inAppEnabled, setInAppEnabled] = useState<boolean>(true)
  const [webPushEnabled, setWebPushEnabled] = useState<boolean>(false)
  const [vapidKeyAvailable, setVapidKeyAvailable] = useState<boolean>(false)

  const supportsPush = useMemo(() => {
    return 'serviceWorker' in navigator && 'PushManager' in window
  }, [])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        const prefs = await notificationAPI.getPreferences()
        if (!mounted) return
        setInAppEnabled(prefs?.inAppEnabled ?? true)
        setWebPushEnabled(prefs?.webPushEnabled ?? false)
      } catch (e: any) {
        if (!mounted) return
        setError(e?.message || 'Failed to load notification preferences')
      } finally {
        setLoading(false)
      }
      try {
        const key = await notificationAPI.getVapidPublicKey()
        if (!mounted) return
        setVapidKeyAvailable(!!key)
      } catch {
        if (!mounted) return
        setVapidKeyAvailable(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  const savePrefs = async (next: { inAppEnabled?: boolean; webPushEnabled?: boolean }) => {
    setSaving(true)
    setError(null)
    try {
      await notificationAPI.updatePreferences({
        inAppEnabled: typeof next.inAppEnabled === 'boolean' ? next.inAppEnabled : inAppEnabled,
        webPushEnabled: typeof next.webPushEnabled === 'boolean' ? next.webPushEnabled : webPushEnabled,
      })
    } catch (e: any) {
      setError(e?.message || 'Failed to update preferences')
      throw e
    } finally {
      setSaving(false)
    }
  }

  const handleInAppToggle = async (checked: boolean) => {
    setInAppEnabled(checked)
    try {
      await savePrefs({ inAppEnabled: checked })
      setInfo('In-app notifications ' + (checked ? 'enabled' : 'disabled'))
    } catch {
      setInAppEnabled(!checked)
    }
  }

  const ensureSubscription = async (): Promise<PushSubscription | null> => {
    const vapidKey = await notificationAPI.getVapidPublicKey()
    if (!vapidKey) {
      throw new Error('Web Push not configured by server (missing VAPID public key)')
    }
    const registration = await navigator.serviceWorker.register('/menux-sw.js')
    let subscription = await registration.pushManager.getSubscription()
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey)
      })
    }
    return subscription
  }

  const handleWebPushToggle = async (checked: boolean) => {
    setError(null)
    setInfo(null)
    if (!supportsPush) {
      setError('This browser does not support Web Push')
      return
    }
    if (checked) {
      try {
        // Request permission first
        const perm = await Notification.requestPermission()
        if (perm !== 'granted') {
          setError('Notification permission not granted')
          return
        }
        const sub = await ensureSubscription()
        if (!sub) throw new Error('Failed to create push subscription')
        const json = sub.toJSON() as any
        await notificationAPI.registerPushSubscription({
          endpoint: json.endpoint,
          p256dh: json.keys?.p256dh,
          auth: json.keys?.auth,
          userAgent: navigator.userAgent,
        })
        await savePrefs({ webPushEnabled: true })
        setWebPushEnabled(true)
        setInfo('Web Push enabled')
      } catch (e: any) {
        setError(e?.message || 'Failed to enable Web Push')
        setWebPushEnabled(false)
      }
    } else {
      // Disable: unsubscribe locally and update prefs
      try {
        const reg = await navigator.serviceWorker.getRegistration()
        const sub = await reg?.pushManager.getSubscription()
        if (sub) {
          await sub.unsubscribe()
        }
        await savePrefs({ webPushEnabled: false })
        setWebPushEnabled(false)
        setInfo('Web Push disabled')
      } catch (e: any) {
        setError(e?.message || 'Failed to disable Web Push')
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>Control how you receive alerts for orders and feedback</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading && (
          <div className="text-sm text-muted-foreground">Loading preferences...</div>
        )}
        {error && (
          <div className="text-sm text-red-600">{error}</div>
        )}
        {info && (
          <div className="text-sm text-green-600">{info}</div>
        )}
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">In-app notifications</div>
            <div className="text-sm text-muted-foreground">Shows alerts inside the app</div>
          </div>
          <Switch disabled={saving} checked={inAppEnabled} onCheckedChange={handleInAppToggle} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">Web Push</div>
            <div className="text-sm text-muted-foreground">
              Receive alerts even when this tab is not focused. {supportsPush ? '' : 'Not supported in this browser.'}
            </div>
            {!vapidKeyAvailable && (
              <div className="text-xs text-amber-600">Server not configured with VAPID key; contact admin.</div>
            )}
          </div>
          <Switch
            disabled={saving || !supportsPush || !vapidKeyAvailable}
            checked={webPushEnabled}
            onCheckedChange={handleWebPushToggle}
          />
        </div>
      </CardContent>
    </Card>
  )
}
