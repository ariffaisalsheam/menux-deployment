import React, { useEffect, useMemo, useState } from 'react';
import { Crown, Bell, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useAuth } from '../../contexts/AuthContext';
import { Switch } from '../ui/switch';
import { notificationAPI } from '../../services/api';
import { ensureFcmReadyAndRegister, getStoredFcmToken, removeWebFcmToken } from '../../services/fcm';

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

// Web Push removed: we rely on FCM for web notifications

const NotificationPreferences: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [inAppEnabled, setInAppEnabled] = useState<boolean>(true)
  const [fcmEnabled, setFcmEnabled] = useState<boolean>(false)
  const [fcmBusy, setFcmBusy] = useState<boolean>(false)
  const notifPermission = useMemo(() => {
    try {
      return (typeof Notification !== 'undefined' ? Notification.permission : 'default') as 'default' | 'granted' | 'denied'
    } catch {
      return 'default' as const
    }
  }, [])

  const firebaseConfigured = useMemo(() => {
    try {
      return !!(
        import.meta.env.VITE_FIREBASE_API_KEY &&
        import.meta.env.VITE_FIREBASE_PROJECT_ID &&
        import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID &&
        import.meta.env.VITE_FIREBASE_APP_ID &&
        import.meta.env.VITE_FIREBASE_VAPID_KEY
      )
    } catch {
      return false
    }
  }, [])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        const prefs = await notificationAPI.getPreferences()
        if (!mounted) return
        setInAppEnabled(prefs?.inAppEnabled ?? true)
      } catch (e: any) {
        if (!mounted) return
        setError(e?.message || 'Failed to load notification preferences')
      } finally {
        setLoading(false)
      }
      // Initialize FCM toggle from local storage
      try {
        const hasToken = !!getStoredFcmToken()
        if (mounted) setFcmEnabled(hasToken)
      } catch {}
    })()
    return () => { mounted = false }
  }, [])

  const savePrefs = async (next: { inAppEnabled?: boolean }) => {
    setSaving(true)
    setError(null)
    try {
      await notificationAPI.updatePreferences({
        inAppEnabled: typeof next.inAppEnabled === 'boolean' ? next.inAppEnabled : inAppEnabled,
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

  const handleFcmToggle = async (checked: boolean) => {
    setError(null)
    setInfo(null)
    setFcmBusy(true)
    if (checked) {
      try {
        if (typeof Notification !== 'undefined' && Notification.permission !== 'granted') {
          const perm = await Notification.requestPermission()
          if (perm !== 'granted') {
            setError('Notification permission not granted')
            setFcmEnabled(false)
            return
          }
        }
        const token = await ensureFcmReadyAndRegister()
        if (!token) throw new Error('Failed to obtain FCM token')
        setFcmEnabled(true)
        setInfo('FCM enabled')
      } catch (e: any) {
        setError(e?.message || 'Failed to enable FCM')
        setFcmEnabled(false)
      } finally {
        setFcmBusy(false)
      }
    } else {
      try {
        await removeWebFcmToken(undefined, true)
        setFcmEnabled(false)
        setInfo('FCM disabled')
      } catch (e: any) {
        setError(e?.message || 'Failed to disable FCM')
      } finally {
        setFcmBusy(false)
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
            <div className="font-medium">Firebase Cloud Messaging (Web)</div>
            <div className="text-sm text-muted-foreground">
              Use Firebase FCM for web notifications. {firebaseConfigured ? '' : 'Not configured.'}
            </div>
          </div>
          <Switch
            disabled={saving || fcmBusy || !firebaseConfigured || notifPermission === 'denied'}
            checked={fcmEnabled}
            onCheckedChange={handleFcmToggle}
          />
        </div>
        {notifPermission === 'denied' && (
          <div className="text-xs text-amber-600">
            Browser notifications are blocked. Enable notifications for this site in your browser settings to use FCM.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
