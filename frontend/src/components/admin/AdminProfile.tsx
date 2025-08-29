import React, { useMemo, useRef, useState } from 'react'
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
import { profileAPI, mediaAPI, mediaProxyUrl, type AdminProfile as AdminProfileDto } from '../../services/api'
import { useApi, useApiMutation } from '../../hooks/useApi'
import { useToast } from '../../contexts/ToastContext'
import { useAuth } from '../../contexts/AuthContext'

const phoneRegex = /^[0-9+\-()\s]{6,20}$/

const schema = z.object({
  fullName: z.string().min(1, 'Full name is required').max(120, 'Too long'),
  email: z.string().email('Invalid email'),
  phoneNumber: z.string().regex(phoneRegex, 'Invalid phone number').optional().or(z.literal('')),
})

type FormValues = z.infer<typeof schema>

export const AdminProfile: React.FC = () => {
  const { data, loading, error, refetch } = useApi<AdminProfileDto>(() => profileAPI.getAdminProfile())
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
      phoneNumber: data.phoneNumber || '',
    }
  }, [data])

  const { register, handleSubmit, formState: { errors, isSubmitting, isDirty }, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: defaultValues,
  })

  const updateMutation = useApiMutation(
    (payload: Partial<AdminProfileDto>) => profileAPI.updateAdminProfile(payload),
    {
      onSuccess: async () => {
        await refetch()
        success('Profile updated')
        await refreshUser()
      }
    }
  )

  const onSubmit = async (values: FormValues) => {
    const payload: Partial<AdminProfileDto> = {
      fullName: values.fullName.trim(),
      email: values.email.trim(),
      phoneNumber: values.phoneNumber?.trim() || undefined,
    }
    try {
      await updateMutation.mutate(payload)
      reset(undefined, { keepValues: false })
    } catch (e: any) {
      const status = e?.response?.status
      const msg = (e?.response?.data?.message as string) || (typeof e?.message === 'string' ? e.message : '')
      if (status === 409 && (msg || '').toLowerCase().includes('email')) {
        // surface inline + toast
        toastError('Email already taken')
        return
      }
      toastError(msg || 'Failed to update profile')
    }
  }

  const doUploadPhoto = async (file: File) => {
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
      const uploaded = await mediaAPI.uploadImage(file)
      await profileAPI.setAdminProfilePhoto(uploaded.path)
      await refetch()
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
  const disableSave = (isSubmitting || updateMutation.loading || uploadingPhoto)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Profile</h1>
          <p className="text-muted-foreground">Manage your admin account details</p>
        </div>
      </div>

      {hasErrors && (
        <Card className="border-destructive/30">
          <CardContent className="pt-4 text-destructive text-sm">
            Please fix the highlighted fields below.
          </CardContent>
        </Card>
      )}

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
                <AvatarFallback>{(data.fullName || 'A').slice(0,2).toUpperCase()}</AvatarFallback>
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
              <Button type="button" variant="outline" disabled={isSubmitting || updateMutation.loading || !isDirty} onClick={() => reset()}>
                Reset
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <SecuritySection />
    </div>
  )
}

export default AdminProfile

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
    (payload: { currentPassword: string; newPassword: string }) => profileAPI.updateAdminPassword(payload),
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
