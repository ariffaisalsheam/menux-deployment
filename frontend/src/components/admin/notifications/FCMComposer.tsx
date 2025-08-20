import React, { useMemo, useState } from 'react'
import { Card } from '../../ui/card'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Textarea } from '../../ui/textarea'
import { Label } from '../../ui/label'
import { mediaAPI, mediaProxyUrl, adminAPI } from '../../../services/api'

const useNotificationPermission = () => {
  const [perm, setPerm] = useState<NotificationPermission>(typeof Notification !== 'undefined' ? Notification.permission : 'default')
  const request = async () => {
    if (typeof Notification === 'undefined') return 'denied' as NotificationPermission
    const p = await Notification.requestPermission()
    setPerm(p)
    return p
  }
  return { perm, request }
}

const resolveDisplayUrl = (uploadPath?: string, url?: string) => {
  if (uploadPath) return mediaProxyUrl(uploadPath)
  return url?.trim() || ''
}

const parseTokens = (raw: string): string[] => {
  return raw
    .split(/[\n,\s]+/)
    .map(s => s.trim())
    .filter(Boolean)
}

const ComposerPreview: React.FC<{
  title: string
  body: string
  iconUrl?: string
  imageUrl?: string
}> = ({ title, body, iconUrl, imageUrl }) => {
  return (
    <div className="border rounded p-3 space-y-2 w-full max-w-md bg-white">
      <div className="flex items-start gap-3">
        <img src={iconUrl || '/logo/menux-logo-192x192.png'} alt="icon" className="w-10 h-10 rounded" />
        <div>
          <div className="font-semibold text-sm">{title || 'Notification title'}</div>
          <div className="text-sm text-muted-foreground">{body || 'Message body'}</div>
        </div>
      </div>
      {imageUrl && (
        <div className="rounded overflow-hidden border">
          <img src={imageUrl} alt="image" className="w-full max-h-48 object-cover" />
        </div>
      )}
    </div>
  )
}

const FCMComposer: React.FC = () => {
  // Core content
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [clickUrl, setClickUrl] = useState('')

  // Icon and image by upload or URL
  const [iconUploadPath, setIconUploadPath] = useState<string | undefined>()
  const [iconUrl, setIconUrl] = useState('')
  const [imageUploadPath, setImageUploadPath] = useState<string | undefined>()
  const [imageUrl, setImageUrl] = useState('')

  const iconDisplay = useMemo(() => resolveDisplayUrl(iconUploadPath, iconUrl), [iconUploadPath, iconUrl])
  const imageDisplay = useMemo(() => resolveDisplayUrl(imageUploadPath, imageUrl), [imageUploadPath, imageUrl])

  // Advanced (coming soon): device tokens
  const [tokensRaw, setTokensRaw] = useState('')

  // Broadcast targeting
  const [broadcastTarget, setBroadcastTarget] = useState<'ALL_ACTIVE' | 'RESTAURANT_OWNERS' | 'CUSTOM'>('ALL_ACTIVE')
  const [broadcastCustom, setBroadcastCustom] = useState('')

  // UI state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const { perm, request } = useNotificationPermission()

  const onUpload = async (file: File, setter: (p: string) => void) => {
    try {
      setError(null)
      setLoading(true)
      const res = await mediaAPI.uploadImage(file)
      setter(res.path)
      setInfo('Image uploaded')
    } catch (e: any) {
      setError(e?.message || 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  const onBroadcast = async () => {
    setError(null); setInfo(null)
    if (!title.trim()) { setError('Title is required'); return }
    if (!body.trim()) { setError('Body is required'); return }
    let target: string
    if (broadcastTarget === 'CUSTOM') {
      if (!broadcastCustom.trim()) { setError('Custom broadcast target is required'); return }
      target = broadcastCustom.trim()
    } else {
      target = broadcastTarget
    }
    try {
      setLoading(true)
      const res = await adminAPI.broadcast({
        title: title.trim(),
        body: body.trim(),
        target,
        data: {
          url: clickUrl.trim() || '/',
          icon: iconDisplay || undefined,
          image: imageDisplay || undefined,
          // Supply raw storage paths so in-app Notification Bell/modal can render via mediaProxyUrl(path)
          iconPath: iconUploadPath || undefined,
          imagePath: imageUploadPath || undefined,
        }
      })
      if (res.success) {
        const extra = res.recipients ? ` to ${res.recipients} recipients` : ''
        setInfo(`Broadcast queued${extra}`)
      } else {
        setError(res.error || 'Broadcast failed')
      }
    } catch (e: any) {
      setError(e?.message || 'Broadcast failed')
    } finally {
      setLoading(false)
    }
  }

  const onPreviewOS = async () => {
    if (typeof Notification === 'undefined') { setError('Notifications not supported in this browser'); return }
    if (perm !== 'granted') {
      const p = await request()
      if (p !== 'granted') { setError('Permission not granted'); return }
    }
    try {
      const n = new Notification(title || 'Notification', {
        body: body || '',
        icon: iconDisplay || '/logo/menux-logo-192x192.png',
        data: { url: clickUrl || '/' }
      })
      setInfo('OS preview shown')
      setTimeout(() => n.close(), 5000)
    } catch (e: any) {
      setError(e?.message || 'Preview failed')
    }
  }

  const onSendTest = async () => {
    setError(null); setInfo(null)
    if (!title.trim()) { setError('Title is required'); return }
    if (!body.trim()) { setError('Body is required'); return }

    try {
      setLoading(true)
      const res = await adminAPI.sendTestPush({
        title: title.trim(),
        body: body.trim(),
        data: {
          url: clickUrl.trim() || '/',
          icon: iconDisplay || undefined,
          image: imageDisplay || undefined,
          // Include storage paths for in-app rendering
          iconPath: iconUploadPath || undefined,
          imagePath: imageUploadPath || undefined,
        }
      })
      if (res.success) setInfo('Test sent to your account (self)')
      else setError(res.error || 'Test send failed')
    } catch (e: any) {
      setError(e?.message || 'Failed to send test')
    } finally {
      setLoading(false)
    }
  }

  const onClear = () => {
    setTitle(''); setBody(''); setClickUrl('')
    setIconUploadPath(undefined); setIconUrl('')
    setImageUploadPath(undefined); setImageUrl('')
    setTokensRaw('')
    setBroadcastTarget('ALL_ACTIVE'); setBroadcastCustom('')
    setError(null); setInfo(null)
  }

  return (
    <div className="space-y-4">
      <Card className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Compose</h3>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onPreviewOS} disabled={loading}>OS Preview</Button>
            <Button onClick={onSendTest} disabled={loading || !title.trim() || !body.trim()}>Send Test</Button>
            <div className="hidden md:flex items-center gap-2">
              <select className="border rounded px-2 py-1 text-sm" value={broadcastTarget} onChange={e => setBroadcastTarget(e.target.value as any)}>
                <option value="ALL_ACTIVE">Broadcast: All Active</option>
                <option value="RESTAURANT_OWNERS">Broadcast: Restaurant Owners</option>
                <option value="CUSTOM">Broadcast: Custom</option>
              </select>
              {broadcastTarget === 'CUSTOM' && (
                <Input className="h-8" placeholder="Custom target key" value={broadcastCustom} onChange={e => setBroadcastCustom(e.target.value)} />
              )}
              <Button onClick={onBroadcast} disabled={loading || !title.trim() || !body.trim() || (broadcastTarget === 'CUSTOM' && !broadcastCustom.trim())}>Broadcast</Button>
            </div>
            <Button variant="outline" onClick={onClear} disabled={loading}>Clear</Button>
          </div>
        </div>
        {error && <div className="text-sm text-red-600">{error}</div>}
        {info && <div className="text-sm text-green-700">{info}</div>}

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Promo alert" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="body">Body</Label>
              <Textarea id="body" value={body} onChange={e => setBody(e.target.value)} placeholder="Message body" rows={4} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="clickUrl">Click URL</Label>
              <Input id="clickUrl" value={clickUrl} onChange={e => setClickUrl(e.target.value)} placeholder="https://yourdomain/path" />
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Icon</Label>
                <Input type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(f, setIconUploadPath) }} />
                <Input placeholder="Icon URL (optional)" value={iconUrl} onChange={e => setIconUrl(e.target.value)} />
                {iconDisplay && <div className="text-xs text-muted-foreground">Previewing: {iconDisplay}</div>}
              </div>
              <div className="space-y-1">
                <Label>Image (large)</Label>
                <Input type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(f, setImageUploadPath) }} />
                <Input placeholder="Image URL (optional)" value={imageUrl} onChange={e => setImageUrl(e.target.value)} />
                {imageDisplay && <div className="text-xs text-muted-foreground">Previewing: {imageDisplay}</div>}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">Test sends only to you. Use Broadcast for everyone.</div>
            <div className="pt-2">
              <Label className="block mb-2">Live Preview</Label>
              <ComposerPreview title={title} body={body} iconUrl={iconDisplay} imageUrl={imageDisplay} />
            </div>
          </div>
        </div>
      </Card>

      {/* Broadcast controls for small screens */}
      <Card className="p-4 space-y-3 md:hidden">
        <div className="space-y-2">
          <Label>Broadcast Target</Label>
          <div className="flex flex-col gap-2">
            <select className="border rounded px-2 py-1 text-sm" value={broadcastTarget} onChange={e => setBroadcastTarget(e.target.value as any)}>
              <option value="ALL_ACTIVE">All Active</option>
              <option value="RESTAURANT_OWNERS">Restaurant Owners</option>
              <option value="CUSTOM">Custom</option>
            </select>
            {broadcastTarget === 'CUSTOM' && (
              <Input placeholder="Custom target key" value={broadcastCustom} onChange={e => setBroadcastCustom(e.target.value)} />
            )}
            <Button onClick={onBroadcast} disabled={loading || !title.trim() || !body.trim() || (broadcastTarget === 'CUSTOM' && !broadcastCustom.trim())}>Broadcast</Button>
          </div>
        </div>
      </Card>

      <Card className="p-4 space-y-2">
        <details>
          <summary className="cursor-pointer font-medium">Advanced (coming soon)</summary>
          <div className="mt-3 space-y-2">
            <div className="space-y-1">
              <Label>Device Tokens</Label>
              <Textarea value={tokensRaw} onChange={e => setTokensRaw(e.target.value)} rows={6} placeholder="Paste tokens (comma/newline separated)" />
              <div className="text-xs text-muted-foreground">Parsed: {parseTokens(tokensRaw).length} tokens. Sending to tokens requires backend compose endpoints; will be enabled soon.</div>
            </div>
            <div className="text-xs text-muted-foreground">Additional options (actions, TTL, urgency, data payload, scheduling, analytics) will be added next.</div>
          </div>
        </details>
      </Card>
    </div>
  )
}

export default FCMComposer
