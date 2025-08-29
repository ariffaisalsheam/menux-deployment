import React, { useMemo, useEffect, useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { Label } from '../ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { LoadingSpinner } from '../common/LoadingSpinner'
import { ErrorDisplay } from '../common/ErrorDisplay'
import { profileAPI, mediaProxyUrl, subscriptionAPI, paymentsAPI, type OwnerProfile as OwnerProfileDto, type UpdateOwnerProfileRequest, type UsernameAvailabilityResponse } from '../../services/api'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs'
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '../ui/dialog'
import { useApi, useApiMutation } from '../../hooks/useApi'
import { Badge } from '../ui/badge'
import { useToast } from '../../contexts/ToastContext'
import { Crown, Clock, AlertTriangle, Trash2 } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { ManualPaymentForm } from '../common/ManualPaymentForm'
import { SubmissionsDisplay } from '../common/SubmissionsDisplay'

const phoneRegex = /^[0-9+\-()\s]{6,20}$/
const usernameRegex = /^[a-zA-Z0-9._-]{3,50}$/

const schema = z.object({
  fullName: z.string().min(1, 'Full name is required').max(120, 'Too long'),
  email: z.string().email('Invalid email'),
  username: z.string()
    .min(3, 'Username must be 3-50 characters')
    .max(50, 'Username must be 3-50 characters')
    .regex(/^[a-zA-Z0-9._-]+$/, 'Only letters, numbers, dot (.), underscore (_), and hyphen (-) allowed'),
  phoneNumber: z.string().regex(phoneRegex, 'Invalid phone number').optional().or(z.literal('')),
})

type FormValues = z.infer<typeof schema>

export const OwnerProfileView: React.FC = () => {
  const { data, loading, error, refetch } = useApi<OwnerProfileDto>(
    () => profileAPI.getOwnerProfile(),
  )

  const { success, error: toastError } = useToast()
  const { refreshUser } = useAuth()

  // Avatar upload constraints and state
  const AVATAR_MAX_MB = 2
  const AVATAR_ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'] as const
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const defaultValues: FormValues | undefined = useMemo(() => {
    if (!data) return undefined
    return {
      fullName: data.fullName || '',
      email: data.email || '',
      username: data.username || '',
      phoneNumber: data.phoneNumber || '',
    }
  }, [data])

  const { register, handleSubmit, formState: { errors, isSubmitting, isDirty }, reset, watch, setValue, setError } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: defaultValues,
  })

  const updateMutation = useApiMutation(
    (payload: UpdateOwnerProfileRequest) => profileAPI.updateOwnerProfile(payload),
    {
      onSuccess: () => {
        refetch()
        success('Profile updated')
        // Ensure global auth user reflects latest name/email/photo
        refreshUser()
      }
    }
  )

  // Username availability check (debounced)
  const [unameStatus, setUnameStatus] = useState<{ checking: boolean; resp?: UsernameAvailabilityResponse }>({ checking: false })
  const watchedUsername = watch('username')
  useEffect(() => {
    const raw = (watchedUsername || '').trim()
    // If invalid locally or empty, clear status
    if (!raw || !usernameRegex.test(raw)) {
      setUnameStatus({ checking: false, resp: undefined })
      return
    }
    let active = true
    setUnameStatus({ checking: true })
    const t = setTimeout(async () => {
      try {
        const resp = await profileAPI.checkOwnerUsernameAvailability(raw)
        if (active) setUnameStatus({ checking: false, resp })
      } catch (_) {
        if (active) setUnameStatus({ checking: false, resp: undefined })
      }
    }, 450)
    return () => { active = false; clearTimeout(t) }
  }, [watchedUsername])

  const onSubmit = async (values: FormValues) => {
    const payload: UpdateOwnerProfileRequest = {
      fullName: values.fullName.trim(),
      email: values.email.trim(),
      username: values.username.trim(),
      phoneNumber: values.phoneNumber?.trim() || undefined,
    }
    try {
      await updateMutation.mutate(payload)
      reset(undefined, { keepValues: false })
    } catch (e: any) {
      const status = e?.response?.status
      const msg = (e?.response?.data?.message as string) || (typeof e?.message === 'string' ? e.message : '')
      if (status === 409 && (msg || '').toLowerCase().includes('email')) {
        setError('email', { type: 'conflict', message: 'Email already taken' })
        toastError('Email already taken')
        return
      }
      toastError(msg || 'Failed to update profile')
    }
  }

  const doUploadPhoto = async (file: File) => {
    // Client-side validation: 2MB max, JPG/PNG/WebP
    if (!AVATAR_ACCEPTED.includes(file.type as any)) {
      toastError('Please select a JPG, PNG, or WebP image.')
      return
    }
    if (file.size > AVATAR_MAX_MB * 1024 * 1024) {
      toastError(`Image must be <= ${AVATAR_MAX_MB}MB`)
      return
    }
    setUploadingPhoto(true)
    try {
      await profileAPI.uploadOwnerProfilePhoto(file)
      await refetch()
      // Update global auth user so header avatar updates immediately
      await refreshUser()
      success('Profile photo updated')
    } catch (e: any) {
      const msg = (e?.response?.data?.message as string) || (typeof e?.message === 'string' ? e.message : '') || 'Failed to upload photo'
      toastError(msg)
    } finally {
      setUploadingPhoto(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="w-48 h-8 bg-gray-200 animate-pulse rounded" />
          <div className="w-24 h-8 bg-gray-200 animate-pulse rounded" />
        </div>
        <div className="h-48 bg-gray-200 animate-pulse rounded" />
      </div>
    )
  }
  if (error) {
    return <ErrorDisplay error={error} onRetry={refetch} />
  }
  if (!data || !defaultValues) {
    return <ErrorDisplay error="Profile not found" onRetry={refetch} />
  }

  const photoUrl = data.photoPath ? mediaProxyUrl(data.photoPath) : undefined

  const hasErrors = Object.keys(errors).length > 0
  const usernameChanged = ((watchedUsername || '').trim() !== (data.username || ''))
  const disableSave = (isSubmitting || updateMutation.loading || uploadingPhoto) || !!errors.username || (usernameChanged && (unameStatus.checking || (unameStatus.resp && !unameStatus.resp.available)))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
          <p className="text-muted-foreground">Manage your personal information</p>
        </div>
      </div>

      {/* Error summary */}
      {hasErrors && (
        <Card className="border-destructive/30">
          <CardContent className="pt-4 text-destructive text-sm">
            Please fix the highlighted fields below.
          </CardContent>
        </Card>
      )}

      {/* Photo + Basic */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Used for account and contact</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              {photoUrl ? (
                <AvatarImage src={photoUrl} alt={data.fullName} />
              ) : (
                <AvatarFallback>{(data.fullName || 'U').slice(0,2).toUpperCase()}</AvatarFallback>
              )}
            </Avatar>
            <div>
              <input
                ref={fileInputRef}
                id="profile-photo"
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  await doUploadPhoto(file)
                  // Allow re-selecting the same file later
                  e.currentTarget.value = ''
                }}
              />
              <Button
                type="button"
                variant="outline"
                disabled={uploadingPhoto}
                onClick={() => !uploadingPhoto && fileInputRef.current?.click()}
              >
                {uploadingPhoto ? (<div className="flex items-center gap-2"><LoadingSpinner size="sm" /> Uploading…</div>) : 'Upload Photo'}
              </Button>
              <p className="text-xs text-muted-foreground mt-1">JPG, PNG, or WebP. Max {AVATAR_MAX_MB}MB.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" placeholder="Your full name" {...register('fullName')} />
                {errors.fullName && (
                  <p className="text-sm text-destructive mt-1">{errors.fullName.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" {...register('email')} />
                {errors.email && (
                  <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="username">Username</Label>
                <Input id="username" placeholder="e.g., yourname" {...register('username')} />
                {errors.username && (
                  <p className="text-sm text-destructive mt-1">{errors.username.message as string}</p>
                )}
                {!errors.username && watchedUsername && (
                  <div className="mt-1 text-xs">
                    {unameStatus.checking ? (
                      <div className="flex items-center gap-2 text-muted-foreground"><LoadingSpinner size="sm" /> Checking availability…</div>
                    ) : unameStatus.resp ? (
                      unameStatus.resp.available ? (
                        <div className="text-green-600">Username is available</div>
                      ) : (
                        <div className="text-destructive">
                          <div>Username is taken</div>
                          {unameStatus.resp.suggestions && unameStatus.resp.suggestions.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-2">
                              {unameStatus.resp.suggestions.slice(0, 5).map((s) => (
                                <Button
                                  key={s}
                                  type="button"
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => setValue('username', s, { shouldValidate: true, shouldDirty: true })}
                                >
                                  {s}
                                </Button>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    ) : null}
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="phoneNumber">Phone</Label>
                <Input id="phoneNumber" placeholder="e.g., +8801XXXXXXXXX" {...register('phoneNumber')} />
                {errors.phoneNumber && (
                  <p className="text-sm text-destructive mt-1">{errors.phoneNumber.message as string}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button type="submit" disabled={disableSave}>
                {isSubmitting || updateMutation.loading ? (<LoadingSpinner size="sm" />) : 'Save Changes'}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting || updateMutation.loading || !isDirty}
                onClick={() => reset()}
              >
                Reset
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Subscription & Billing */}
      <SubscriptionManagement />

      {/* Security - Change Password */}
      <SecuritySection />

      {/* Danger Zone */}
      <DangerZoneSection />
    </div>
  )
}

export default OwnerProfileView

// --- Security: Change Password ---
const passwordSchema = z.object({
  currentPassword: z.string().min(6, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Please confirm new password'),
}).refine((vals) => vals.newPassword === vals.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
})

type PasswordFormValues = z.infer<typeof passwordSchema>

const SecuritySection: React.FC = () => {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' }
  })
  const { success, error: toastError } = useToast()

  const changePassword = useApiMutation(
    (payload: { currentPassword: string; newPassword: string }) => profileAPI.updateOwnerPassword(payload),
    {
      onSuccess: () => {
        success('Password updated successfully')
        reset()
      }
    }
  )

  const onSubmit = async (values: PasswordFormValues) => {
    try {
      await changePassword.mutate({ currentPassword: values.currentPassword, newPassword: values.newPassword })
    } catch (e: any) {
      toastError(e?.message || 'Failed to update password')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Security</CardTitle>
        <CardDescription>Change your account password</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-xl">
          <div>
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input id="currentPassword" type="password" {...register('currentPassword')} />
            {errors.currentPassword && <p className="text-sm text-destructive mt-1">{errors.currentPassword.message}</p>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <Input id="newPassword" type="password" {...register('newPassword')} />
              {errors.newPassword && <p className="text-sm text-destructive mt-1">{errors.newPassword.message}</p>}
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input id="confirmPassword" type="password" {...register('confirmPassword')} />
              {errors.confirmPassword && <p className="text-sm text-destructive mt-1">{errors.confirmPassword.message}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button type="submit" disabled={isSubmitting || changePassword.loading}>
              {isSubmitting || changePassword.loading ? <LoadingSpinner size="sm" /> : 'Update Password'}
            </Button>
            <Button type="button" variant="outline" onClick={() => reset()} disabled={isSubmitting || changePassword.loading}>Reset</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

// --- Danger Zone: Delete Account ---
const DangerZoneSection: React.FC = () => {
  const { success, error: toastError } = useToast()
  const [open, setOpen] = useState(false)
  const deleteAccount = useApiMutation(async () => {
    await profileAPI.deleteOwnerAccount()
  }, {
    onSuccess: () => {
      success('Account deleted. You have been logged out.')
      try {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        localStorage.removeItem('originalAdminUser')
      } catch (_) {}
      window.location.href = '/login'
    }
  })

  const onConfirm = async () => {
    try {
      await deleteAccount.mutate(undefined as any)
    } catch (e: any) {
      toastError(e?.message || 'Failed to delete account')
    }
  }

  return (
    <Card className="border-destructive/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive"><AlertTriangle className="w-5 h-5" /> Danger Zone</CardTitle>
        <CardDescription>This action is irreversible. Deleting your account will permanently remove your restaurant, data, and access.</CardDescription>
      </CardHeader>
      <CardContent>
        <Dialog open={open} onOpenChange={setOpen}>
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Once deleted, there is no way to recover this account.</div>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm" onClick={() => setOpen(true)}>
                <Trash2 className="w-4 h-4 mr-2" /> Delete Account
              </Button>
            </DialogTrigger>
          </div>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete account?</DialogTitle>
              <DialogDescription>
                This will permanently delete your account and restaurant data. This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={deleteAccount.loading}>Cancel</Button>
              </DialogClose>
              <Button type="button" variant="destructive" onClick={onConfirm} disabled={deleteAccount.loading}>
                {deleteAccount.loading ? <LoadingSpinner size="sm" /> : 'Yes, delete my account'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}

// --- Subscription Management ---
const SubscriptionManagement: React.FC = () => {
  const { data: status, loading, error, refetch } = useApi(() => subscriptionAPI.getStatus())
  const { data: events = [], refetch: refetchEvents } = useApi(() => subscriptionAPI.getEvents())
  const { data: myPayments = [], refetch: refetchPayments } = useApi(() => paymentsAPI.listMyPayments())
  const { success, error: toastError } = useToast()
  const [cancelBusy, setCancelBusy] = useState(false)

  const startTrialMut = useApiMutation(() => subscriptionAPI.startTrial(), {
    onSuccess: () => {
      success('Trial started')
      refetch();
      refetchEvents();
    }
  })

  const onCancelSubscription = async () => {
    setCancelBusy(true)
    try {
      await subscriptionAPI.cancelSubscription()
      success('Subscription canceled successfully. It will remain active until the end of your current period.')
      refetch()
      refetchEvents()
    } catch (err: any) {
      toastError(err?.message || 'Failed to cancel subscription')
    } finally {
      setCancelBusy(false)
    }
  }







  // Bounded list sizes with progressive disclosure
  const [paymentsLimit, setPaymentsLimit] = useState(5)
  const [eventsLimit, setEventsLimit] = useState(8)

  // Parse various possible date formats to a valid Date or null
  const parseDateSafe = (v: string | number | Date | null | undefined): Date | null => {
    if (!v) return null
    if (v instanceof Date) return isFinite(v.getTime()) ? v : null
    if (typeof v === 'number') {
      const d = new Date(v)
      return isFinite(d.getTime()) ? d : null
    }
    if (typeof v === 'string') {
      const d = new Date(v)
      if (isFinite(d.getTime())) return d
      // Try dd/MM/yyyy
      const m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
      if (m) {
        const day = parseInt(m[1], 10)
        const month = parseInt(m[2], 10) - 1
        const year = parseInt(m[3], 10)
        const d2 = new Date(year, month, day, 23, 59, 59)
        return isFinite(d2.getTime()) ? d2 : null
      }
    }
    return null
  }

  // Countdown timer target selection with precedence: GRACE > PAID PERIOD > TRIAL
  const targetEndAt = useMemo(() => {
    if (!status) return null
    const now = Date.now()
    const trialEnd = parseDateSafe(status.trialEndAt as any)
    const graceEnd = parseDateSafe((status as any)?.graceEndAt)
    const periodEnd = parseDateSafe(status.currentPeriodEndAt as any)

    // 1) GRACE wins
    if (graceEnd && isFinite(graceEnd.getTime()) && graceEnd.getTime() > now) return graceEnd

    // 2) PAID period next
    const paidDays = (status as any)?.paidDaysRemaining as number | undefined
    if (typeof paidDays === 'number' && paidDays > 0) {
      if (periodEnd && isFinite(periodEnd.getTime()) && periodEnd.getTime() > now) return periodEnd
      const synthetic = new Date(Date.now() + paidDays * 24 * 60 * 60 * 1000)
      return synthetic
    }

    // 2.5) GRACE period if no paid period
    const graceDays = (status as any)?.graceDaysRemaining as number | undefined
    if (typeof graceDays === 'number' && graceDays > 0) {
      if (graceEnd && isFinite(graceEnd.getTime()) && graceEnd.getTime() > now) return graceEnd
      const synthetic = new Date(Date.now() + graceDays * 24 * 60 * 60 * 1000)
      return synthetic
    }

    // 3) TRIAL last
    const statusStr = (status.status || '').toString().toUpperCase()
    const isTrialLabel = statusStr === 'TRIALING' || statusStr === 'TRAILING' || statusStr === 'TRIAL'
    const isTrialingNow = (status.trialDaysRemaining ?? 0) > 0 || isTrialLabel || (
      !!trialEnd && isFinite(trialEnd.getTime()) && trialEnd.getTime() > now
    )
    if (isTrialingNow && trialEnd && isFinite(trialEnd.getTime()) && trialEnd.getTime() > now) return trialEnd
    return null
  }, [status])

  const [countdown, setCountdown] = useState<string | null>(null)
  useEffect(() => {
    // Stop countdown when suspended (by status or latest events)
    const suspendedByEventsNow = (() => {
      if (!events || events.length === 0) return false
      const byTime = [...events].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      for (const ev of byTime) {
        const t = (ev.eventType || '').toUpperCase()
        if (t.includes('UNSUSPEND') || t.includes('ACTIVATE')) return false
        if (t.includes('SUSPEND')) return true
      }
      return false
    })()
    const isSuspendedNow = (status?.status === 'SUSPENDED') || suspendedByEventsNow
    if (isSuspendedNow) {
      setCountdown(null)
      return
    }
    if (!targetEndAt) {
      setCountdown(null)
      return
    }
    const fmt = (ms: number) => {
      if (ms <= 0) return 'Expired'
      const totalSec = Math.floor(ms / 1000)
      const days = Math.floor(totalSec / 86400)
      const hours = Math.floor((totalSec % 86400) / 3600)
      const minutes = Math.floor((totalSec % 3600) / 60)
      const seconds = totalSec % 60
      const hh = days > 0 ? String(hours).padStart(2, '0') : String(hours)
      const mm = String(minutes).padStart(2, '0')
      const ss = String(seconds).padStart(2, '0')
      return days > 0 ? `${days}d ${hh}:${mm}:${ss}` : `${hh}:${mm}:${ss}`
    }
    const tick = () => {
      const remaining = targetEndAt.getTime() - Date.now()
      if (remaining <= 0) {
        const hardExpired = ['EXPIRED', 'CANCELED'].includes((status?.status || '').toUpperCase())
        setCountdown(hardExpired ? 'Expired' : null)
      } else {
        setCountdown(fmt(remaining))
      }
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [targetEndAt, status?.status, events])

  // Mirror UpgradeToPro suspended/trial gating logic
  const suspendedByEvents = useMemo(() => {
    if (!events || events.length === 0) return false
    const byTime = [...events].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    for (const ev of byTime) {
      const t = (ev.eventType || '').toUpperCase()
      if (t.includes('UNSUSPEND') || t.includes('ACTIVATE')) return false
      if (t.includes('SUSPEND')) return true
    }
    return false
  }, [events])
  const isSuspended = (status?.status === 'SUSPENDED') || suspendedByEvents
  const hasUsedTrial = !!status?.trialStartAt
  const isCurrentlyIneligibleStatus = status?.status === 'TRIALING' || status?.status === 'ACTIVE'

  // Enhanced trial eligibility logic
  const canStartTrial = useMemo(() => {
    if (!status) return false
    if (isSuspended) return false
    if (hasUsedTrial) return false
    if (isCurrentlyIneligibleStatus) return false
    if (status.cancelAtPeriodEnd) return false

    // Only allow trial for new subscriptions or expired/canceled ones
    const eligibleStatuses = ['EXPIRED', 'CANCELED', null, undefined]
    return eligibleStatuses.includes(status.status)
  }, [status, isSuspended, hasUsedTrial, isCurrentlyIneligibleStatus])

  const suspendReason = useMemo(() => {
    if (!isSuspended || !events || events.length === 0) return ''
    const byTime = [...events].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    for (const ev of byTime) {
      const t = (ev.eventType || '').toUpperCase()
      if (t.includes('UNSUSPEND') || t.includes('ACTIVATE')) return ''
      if (t.includes('SUSPEND')) {
        const md = ev.metadata
        if (!md) return ''
        try {
          const parsed = JSON.parse(md as string)
          if (parsed && typeof parsed.reason === 'string') return parsed.reason as string
        } catch (_) {
          // metadata may be a plain string
        }
        return typeof md === 'string' ? md : ''
      }
    }
    return ''
  }, [events, isSuspended])

  const displayStatus = useMemo(() => {
    if (isSuspended) return 'SUSPENDED'
    // Respect backend-reported label when it is GRACE to stay consistent with Admin view
    const statusStr = (status?.status || '').toString().toUpperCase()
    if (statusStr === 'GRACE') return 'GRACE'
    const now = Date.now()
    const trialEnd = parseDateSafe(status?.trialEndAt as any)
    const graceEnd = parseDateSafe((status as any)?.graceEndAt)
    const graceActive = !!graceEnd && isFinite(graceEnd.getTime()) && graceEnd.getTime() > now
    if (graceActive) return 'GRACE'
    const paidDays = (status as any)?.paidDaysRemaining as number | undefined
    if (typeof paidDays === 'number' && paidDays > 0) return 'ACTIVE'
    const isTrialLabel = statusStr === 'TRIALING' || statusStr === 'TRAILING' || statusStr === 'TRIAL'
    const inTrial = (status?.trialDaysRemaining ?? 0) > 0 || isTrialLabel || (
      !!trialEnd && isFinite(trialEnd.getTime()) && trialEnd.getTime() > now
    )
    if (inTrial) return 'TRIALING'
    return status?.status ?? 'N/A'
  }, [isSuspended, status])
  const badgeClass = useMemo(() => {
    switch (displayStatus) {
      case 'SUSPENDED':
        return 'bg-red-100 text-red-700'
      case 'ACTIVE':
        return 'bg-green-100 text-green-700'
      case 'TRIALING':
        return 'bg-blue-100 text-blue-700'
      case 'GRACE':
        return 'bg-yellow-100 text-yellow-800'
      case 'EXPIRED':
      case 'CANCELED':
        return 'bg-slate-200 text-slate-700'
      default:
        return 'bg-slate-100 text-slate-700'
    }
  }, [displayStatus])

  const hardExpired = useMemo(() => ['EXPIRED','CANCELED'].includes(displayStatus), [displayStatus])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2"><Crown className="w-5 h-5 text-yellow-500" /> Subscription</CardTitle>
            <CardDescription>Manage plan, trial, and manual renewals</CardDescription>
          </div>
          {countdown && (
            <Badge variant={hardExpired ? 'destructive' : 'default'} className="flex items-center gap-1">
              <Clock className="w-4 h-4" /> {countdown}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="h-20 bg-gray-100 animate-pulse rounded" />
        ) : error ? (
          <ErrorDisplay error={error} onRetry={refetch} />
        ) : status ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Overview */}
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Current Plan</div>
              <div className="text-lg font-semibold">{status.plan || '—'}</div>
              <div className="flex items-center gap-2">
                <div className="text-sm text-muted-foreground">Status:</div>
                <span className={`text-xs px-2 py-0.5 rounded ${badgeClass}`}>{displayStatus}</span>
              </div>
              {isSuspended && (
                <div className="mt-1 p-2 rounded border border-red-200 bg-red-50 text-red-700 text-xs">
                  <div>Your account is suspended; please contact support.</div>
                  {suspendReason && (
                    <div className="mt-1"><span className="font-medium">Reason:</span> {suspendReason}</div>
                  )}
                </div>
              )}
              {typeof status.trialDaysRemaining === 'number' && status.trialDaysRemaining >= 0 && (
                <div>
                  <span className="text-sm text-muted-foreground">Trial days remaining:</span>{' '}
                  <span className="font-medium">{status.trialDaysRemaining}</span>
                </div>
              )}
              {typeof status.paidDaysRemaining === 'number' && status.paidDaysRemaining >= 0 && (
                <div>
                  <span className="text-sm text-muted-foreground">Paid days remaining:</span>{' '}
                  <span className="font-medium">{status.paidDaysRemaining}</span>
                </div>
              )}
              {typeof (status as any).graceDaysRemaining === 'number' && (status as any).graceDaysRemaining >= 0 && (
                <div>
                  <span className="text-sm text-muted-foreground">Grace days remaining:</span>{' '}
                  <span className="font-medium text-yellow-600">{(status as any).graceDaysRemaining}</span>
                </div>
              )}
              {status.currentPeriodEndAt && (
                <div className="text-sm text-muted-foreground">Current Period Ends: {new Date(status.currentPeriodEndAt).toLocaleDateString()}</div>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-3">
              {status.status === 'TRIALING' ? (
                <div className="text-sm text-muted-foreground">You are on a trial. Enjoy PRO features during the trial period.</div>
              ) : (
                <div className="text-sm text-muted-foreground">Renew your subscription by submitting a manual bKash payment below.</div>
              )}
              {canStartTrial && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={startTrialMut.loading}
                    onClick={() => startTrialMut.mutate(undefined as any)}
                    title={'Start trial'}
                  >
                    {startTrialMut.loading ? <LoadingSpinner size="sm" /> : 'Start Trial'}
                  </Button>
                </div>
              )}
              <p className="text-xs text-muted-foreground">Manual payments are reviewed by admin. Once approved, your paid days will increase automatically.</p>
            </div>

            {/* Manual bKash Renewal Form - Using reusable component */}
            <div className="lg:col-span-2 border-t pt-6">
              <ManualPaymentForm
                title="Manual Subscription Renewal"
                subtitle="Extend your subscription with a manual bKash payment"
                onPaymentSubmitted={() => {
                  refetch() // Refresh subscription status
                  refetchPayments() // Refresh payments list
                }}
              />
            </div>



            {/* Payments & Events Tabs */}
            <div className="lg:col-span-2">
              <Tabs defaultValue="payments">
                <TabsList>
                  <TabsTrigger value="payments">Recent Payments</TabsTrigger>
                  <TabsTrigger value="events">Subscription Events</TabsTrigger>
                </TabsList>
                <TabsContent value="payments" className="mt-3">
                  <div className="max-h-64 overflow-auto pr-1">
                    <SubmissionsDisplay
                      submissions={(myPayments || []).slice(0, paymentsLimit)}
                      loading={false}
                      title=""
                      className="bg-transparent shadow-none p-0"
                    />
                  </div>
                  {(myPayments || []).length > paymentsLimit && (
                    <div className="mt-2 flex gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => setPaymentsLimit((v) => v + 10)}>Show more</Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setPaymentsLimit((myPayments || []).length)}>Show all</Button>
                    </div>
                  )}
                  {paymentsLimit > 5 && (
                    <div className="mt-2">
                      <Button type="button" variant="ghost" size="sm" onClick={() => setPaymentsLimit(5)}>Show less</Button>
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="events" className="mt-3">
                  <div className="space-y-2 max-h-64 overflow-auto pr-1">
                    {(events || []).length === 0 ? (
                      <div className="text-sm text-muted-foreground">No events yet.</div>
                    ) : (
                      (events || []).slice(0, eventsLimit).map(ev => (
                        <div key={ev.id} className="text-sm border rounded p-3">
                          <div className="font-medium">{ev.eventType}</div>
                          <div className="text-muted-foreground">{new Date(ev.createdAt).toLocaleString()}</div>
                        </div>
                      ))
                    )}
                  </div>
                  {(events || []).length > eventsLimit && (
                    <div className="mt-2 flex gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => setEventsLimit((v) => v + 10)}>Show more</Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setEventsLimit((events || []).length)}>Show all</Button>
                    </div>
                  )}
                  {eventsLimit > 8 && (
                    <div className="mt-2">
                      <Button type="button" variant="ghost" size="sm" onClick={() => setEventsLimit(8)}>Show less</Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        ) : null}

        {/* Cancel Subscription Section */}
        {status && ['ACTIVE', 'TRIALING', 'GRACE'].includes(status.status || '') && !status.cancelAtPeriodEnd && (
          <div className="border-t pt-6 mt-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-red-800 mb-2">Cancel Subscription</h3>
              <p className="text-sm text-red-700 mb-4">
                Canceling your subscription will set it to expire at the end of your current billing period.
                You'll continue to have access until then.
              </p>
              <Button
                variant="destructive"
                onClick={onCancelSubscription}
                disabled={cancelBusy}
                className="w-full sm:w-auto"
              >
                {cancelBusy ? 'Canceling...' : 'Cancel Subscription'}
              </Button>
            </div>
          </div>
        )}

        {/* Already Canceled Notice */}
        {status?.cancelAtPeriodEnd && (
          <div className="border-t pt-6 mt-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">Subscription Canceled</h3>
              <p className="text-sm text-yellow-700">
                Your subscription is set to cancel at the end of the current period.
                You'll continue to have access until {status.currentPeriodEndAt ? new Date(status.currentPeriodEndAt).toLocaleDateString() : 'the period ends'}.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
