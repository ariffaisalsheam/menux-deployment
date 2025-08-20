import React, { useEffect, useMemo, useState } from 'react'
import { Bell, CheckCheck, Inbox, Loader2, ExternalLink, Trash2 } from 'lucide-react'
import { Button } from '../ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { notificationAPI, mediaProxyUrl } from '../../services/api'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../../contexts/ToastContext'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog'

export const NotificationBell: React.FC = () => {
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [confirmOpen, setConfirmOpen] = useState<boolean>(false)
  const [detailOpen, setDetailOpen] = useState<boolean>(false)
  const [selected, setSelected] = useState<any | null>(null)
  const [confirmClearAllOpen, setConfirmClearAllOpen] = useState<boolean>(false)
  const navigate = useNavigate()
  const { success, error: toastError } = useToast()

  const hasUnread = unreadCount > 0
  const unreadDisplay = useMemo(() => (unreadCount > 99 ? '99+' : String(unreadCount)), [unreadCount])

  const loadData = async () => {
    try {
      setLoading(true)
      const [countRes, listRes] = await Promise.all([
        notificationAPI.getUnreadCount().catch(() => ({ count: 0 })),
        notificationAPI.getNotifications({ page: 0, size: 10, unreadOnly: false }).catch(() => ({ content: [] }))
      ])
      // Tolerate different backend response shapes
      const cAny = countRes as any
      const parsedCount =
        (typeof cAny === 'number' ? cAny : undefined) ??
        (typeof cAny?.count === 'number' ? cAny.count : undefined) ??
        (typeof cAny?.unread === 'number' ? cAny.unread : undefined) ??
        (typeof cAny?.unreadCount === 'number' ? cAny.unreadCount : undefined) ??
        0
      setUnreadCount(parsedCount)

      const lAny = listRes as any
      const content =
        (Array.isArray(lAny) ? lAny : undefined) ??
        (Array.isArray(lAny?.content) ? lAny.content : undefined) ??
        (Array.isArray(lAny?.items) ? lAny.items : undefined) ??
        []
      setItems(Array.isArray(content) ? content : [])
    } catch (e) {
      // Non-blocking; errors are handled by interceptor
      console.error('Failed to load notifications', e)
    } finally {
      setLoading(false)
    }
  }

  // Helpers to robustly resolve media from multiple possible shapes
  const safeParse = (v: any) => {
    try {
      return typeof v === 'string' ? JSON.parse(v) : v
    } catch {
      return null
    }
  }
  const resolveMediaUrl = (candidate?: string): string | null => {
    if (!candidate || typeof candidate !== 'string') return null
    candidate = candidate.trim()
    // Already absolute
    if (/^https?:\/\//i.test(candidate)) {
      // Leave absolute URLs untouched to preserve any signed/extra params (e.g., broadcasts)
      return candidate
    }
    // If it's a stream-like URL in various relative forms (with/without leading slash or api prefix)
    if (/(^\/?api\/)?\/?media\/stream/i.test(candidate)) {
      try {
        const u = new URL(candidate, window.location.origin)
        const p = u.searchParams.get('path') || ''
        const decoded = p ? (() => { try { return decodeURIComponent(p) } catch { return p } })() : ''
        return decoded ? mediaProxyUrl(decoded) : null
      } catch {
        return mediaProxyUrl(candidate)
      }
    }
    // Treat any other relative/path string as a storage path and proxy
    return mediaProxyUrl(candidate)
  }

  // Robustly resolve a click URL from various nested shapes and key variants
  const getOpenLink = (n: any): string | null => {
    try {
      const data = safeParse(n?.data) || {}
      const notif = data?.notification || data?.notificationOptions || {}
      const payload = data?.data || {}
      const candidates = [
        // Payload level
        payload?.url,
        payload?.click_action,
        payload?.clickAction,
        payload?.link,
        payload?.deeplink,
        payload?.targetUrl,
        // Data level
        data?.url,
        data?.click_action,
        data?.clickAction,
        data?.link,
        data?.deeplink,
        data?.targetUrl,
        // Notification options
        notif?.click_action,
        notif?.clickAction,
        // Root-level fallbacks
        n?.url,
        n?.click_url,
        n?.clickUrl,
        n?.link,
        n?.deeplink,
        n?.targetUrl,
      ].filter(Boolean) as string[]
      if (candidates.length === 0) return null
      const raw = String(candidates[0]).trim()
      if (!raw) return null
      return raw
    } catch {
      return null
    }
  }
  const getIconSrc = (n: any): string => {
    const data = safeParse(n?.data) || {}
    const notif = data?.notification || data?.notificationOptions || {}
    const payload = data?.data || {}
    const candidates = [
      // Prefer explicit icon fields (payload then data)
      payload?.icon,
      payload?.iconUrl,
      payload?.icon_url,
      payload?.iconURL,
      payload?.logo,
      payload?.logoUrl,
      payload?.logo_url,
      payload?.picture,
      payload?.photoUrl,
      payload?.thumbnail,
      data?.icon,
      data?.iconUrl,
      data?.icon_url,
      data?.iconURL,
      data?.logo,
      data?.logoUrl,
      data?.logo_url,
      data?.picture,
      data?.photoUrl,
      data?.thumbnail,
      // Notification options
      notif?.icon,
      // Root-level explicit fallbacks
      n?.icon,
      n?.iconUrl,
      n?.icon_url,
      n?.iconURL,
      n?.logo,
      n?.logoUrl,
      n?.logo_url,
      n?.picture,
      n?.photoUrl,
      n?.thumbnail,
      // Last resort: generic proxy/path variants
      payload?.proxyUrl,
      payload?.iconPath,
      data?.proxyUrl,
      data?.iconPath,
      n?.proxyUrl,
      n?.iconPath,
    ].filter(Boolean) as string[]
    const resolved = resolveMediaUrl(candidates[0])
    return resolved || '/logo/menux-logo-192x192.png'
  }
  const getImageSrc = (n: any): string | null => {
    const data = safeParse(n?.data) || {}
    const notif = data?.notification || data?.notificationOptions || {}
    const payload = data?.data || {}
    const candidates = [
      // Prefer explicit image fields (payload then data)
      payload?.image,
      payload?.imageUrl,
      payload?.image_url,
      payload?.imagePath,
      payload?.image_path,
      data?.image,
      data?.imageUrl,
      data?.image_url,
      data?.imagePath,
      data?.image_path,
      // Notification options
      notif?.image,
      // Root-level explicit fallbacks
      n?.image,
      n?.imageUrl,
      n?.image_url,
      n?.imagePath,
      n?.image_path,
      // Last resort: generic proxy/path variants
      payload?.proxyUrl,
      data?.proxyUrl,
      n?.proxyUrl,
    ].filter(Boolean) as string[]
    if (candidates.length === 0) return null
    const resolved = resolveMediaUrl(candidates[0])
    return resolved
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

  // React to realtime events from NotificationProvider and other components
  useEffect(() => {
    const onNew = () => loadData()
    const onChanged = () => loadData()
    // Custom events dispatched by NotificationProvider and bell actions
    window.addEventListener('notifications:new', onNew as EventListener)
    window.addEventListener('notifications:changed', onChanged as EventListener)
    return () => {
      window.removeEventListener('notifications:new', onNew as EventListener)
      window.removeEventListener('notifications:changed', onChanged as EventListener)
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
      success('All notifications marked as read')
    } catch (e) {
      console.error('Failed to mark all read', e)
      toastError('Failed to mark all as read')
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

  const clearOne = async (id: number) => {
    // Optimistic remove
    const prevItems = items
    const target = items.find((n) => n.id === id)
    setItems((prev) => prev.filter((n) => n.id !== id))
    if ((target?.status || '').toUpperCase?.() !== 'READ') {
      setUnreadCount((c) => (c > 0 ? c - 1 : 0))
    }
    try {
      await notificationAPI.clear(id)
      window.dispatchEvent(new CustomEvent('notifications:changed'))
      success('Notification cleared')
    } catch (e) {
      console.error('Failed to clear notification', e)
      // revert
      setItems(prevItems)
      toastError('Failed to clear notification')
    }
  }

  const clearAll = async () => {
    const prevItems = items
    // Optimistic clear all
    setItems([])
    setUnreadCount(0)
    try {
      await notificationAPI.clearAll()
      window.dispatchEvent(new CustomEvent('notifications:changed'))
      success('All notifications cleared')
    } catch (e) {
      console.error('Failed to clear all notifications', e)
      setItems(prevItems)
      toastError('Failed to clear all notifications')
    }
  }

  const handleItemSelect = async (n: any) => {
    // Open detail modal and auto-mark as read
    setSelected(n)
    setDetailOpen(true)
    if ((n?.status || '').toUpperCase?.() !== 'READ') {
      try { await markRead(n.id) } catch {}
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
            <Button variant="ghost" size="sm" onClick={() => setConfirmOpen(true)} disabled={!hasUnread} title="Mark all read">
              <CheckCheck className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmClearAllOpen(true)}
              disabled={items.length === 0}
              title="Clear all"
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
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
                      {/* Auto mark on click; remove explicit "Mark read" button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={(e) => { e.stopPropagation(); clearOne(n.id) }}
                        title="Clear"
                      >
                        Clear
                      </Button>
                    </div>
                  </DropdownMenuItem>
                )
              })}
            </div>
          )}
        </div>
      </DropdownMenuContent>

      {/* Confirm mark-all dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark all as read?</DialogTitle>
            <DialogDescription>
              This will mark all notifications as read. You can’t undo this action.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button
              variant="default"
              onClick={async () => { setConfirmOpen(false); await markAllRead() }}
            >
              <CheckCheck className="h-4 w-4 mr-2" /> Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm clear-all dialog */}
      <Dialog open={confirmClearAllOpen} onOpenChange={setConfirmClearAllOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear all notifications?</DialogTitle>
            <DialogDescription>
              This removes all notifications from your list. This can’t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmClearAllOpen(false)}>Cancel</Button>
            <Button
              variant="default"
              className="bg-red-600 hover:bg-red-700"
              onClick={async () => { setConfirmClearAllOpen(false); await clearAll() }}
            >
              <Trash2 className="h-4 w-4 mr-2" /> Clear all
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail modal for a notification */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-[640px] max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <img src={getIconSrc(selected)} alt="icon" className="h-5 w-5 rounded" />
              {selected?.title || 'Notification'}
            </DialogTitle>
            <DialogDescription>
              {selected?.createdAt ? new Date(selected.createdAt).toLocaleString() : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{selected?.body || ''}</p>
            {/* Optional media preview */}
            {(() => {
              const imgSrc = getImageSrc(selected)
              return imgSrc ? (
                <img
                  src={imgSrc}
                  alt="notification"
                  className="rounded border max-h-56 object-cover"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                />
              ) : null
            })()}
          </div>
          <div className="mt-4 flex items-center justify-between gap-2">
            <div className="flex-1" />
            <Button
              variant="ghost"
              className="text-red-600 hover:text-red-700"
              onClick={async () => { if (selected) { await clearOne(selected.id); setDetailOpen(false) } }}
            >
              <Trash2 className="h-4 w-4 mr-2" /> Clear
            </Button>
            {(() => {
              const link = selected ? getOpenLink(selected) : null
              if (!link) return null
              const isAbsolute = /^https?:\/\//i.test(link)
              return (
                <Button
                  variant="default"
                  onClick={async () => {
                    try { await markRead(selected!.id) } catch {}
                    if (isAbsolute) {
                      window.open(link, '_blank', 'noopener,noreferrer')
                    } else {
                      navigate(link)
                    }
                    setDetailOpen(false)
                  }}
                >
                  <ExternalLink className="h-4 w-4 mr-2" /> Open
                </Button>
              )
            })()}
          </div>
        </DialogContent>
      </Dialog>
    </DropdownMenu>
  )
}
