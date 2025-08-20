import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

type ToastType = 'success' | 'error' | 'info' | 'warning'
type ToastPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'

type ToastItem = {
  id: number
  message: string
  type: ToastType
  duration: number
  position: ToastPosition
  actionLabel?: string
  onAction?: () => void
}

type ShowOptions = {
  message: string
  type?: ToastType
  duration?: number
  position?: ToastPosition
  actionLabel?: string
  onAction?: () => void
}

type ToastContextValue = {
  notify: (message: string, type?: ToastType) => void
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
  warning: (message: string) => void
  show: (opts: ShowOptions) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const MAX_VISIBLE = 3

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [visible, setVisible] = useState<ToastItem[]>([])
  const [queue, setQueue] = useState<ToastItem[]>([])

  const dequeueIfNeeded = useCallback(() => {
    setVisible((vis) => {
      if (vis.length < MAX_VISIBLE && queue.length > 0) {
        const [next, ...rest] = queue
        setQueue(rest)
        return [...vis, next]
      }
      return vis
    })
  }, [queue])

  useEffect(() => {
    if (visible.length < MAX_VISIBLE && queue.length > 0) {
      const t = setTimeout(dequeueIfNeeded, 50)
      return () => clearTimeout(t)
    }
  }, [visible, queue, dequeueIfNeeded])

  const remove = useCallback((id: number) => {
    setVisible((vis) => vis.filter((t) => t.id !== id))
  }, [])

  const show = useCallback((opts: ShowOptions) => {
    const id = Date.now() + Math.random()
    const item: ToastItem = {
      id,
      message: opts.message,
      type: opts.type || 'info',
      duration: Math.max(1500, Math.min(opts.duration ?? 4000, 15000)),
      position: opts.position || 'bottom-right',
      actionLabel: opts.actionLabel,
      onAction: opts.onAction,
    }
    setQueue((q) => [...q, item])
  }, [])

  const notify = useCallback((message: string, type: ToastType = 'info') => {
    show({ message, type })
  }, [show])

  const containers = useMemo(() => {
    const groups: Record<ToastPosition, ToastItem[]> = {
      'top-right': [], 'top-left': [], 'bottom-right': [], 'bottom-left': []
    }
    for (const t of visible) groups[t.position].push(t)
    return groups
  }, [visible])

  const value: ToastContextValue = {
    notify,
    success: (m: string) => notify(m, 'success'),
    error: (m: string) => notify(m, 'error'),
    info: (m: string) => notify(m, 'info'),
    warning: (m: string) => notify(m, 'warning'),
    show,
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Containers per-position for better placement control */}
      {(['top-right','top-left','bottom-right','bottom-left'] as ToastPosition[]).map((pos) => (
        <ToastContainer
          key={pos}
          position={pos}
          items={containers[pos]}
          onClose={remove}
          onExited={dequeueIfNeeded}
        />
      ))}
    </ToastContext.Provider>
  )
}

function ToastContainer({ position, items, onClose, onExited }: {
  position: ToastPosition
  items: ToastItem[]
  onClose: (id: number) => void
  onExited: () => void
}) {
  const base = 'fixed z-[9999] space-y-2'
  const posClass = position === 'top-right'
    ? 'top-4 right-4'
    : position === 'top-left'
    ? 'top-4 left-4'
    : position === 'bottom-right'
    ? 'bottom-4 right-4'
    : 'bottom-4 left-4'
  return (
    <div className={`${base} ${posClass}`} aria-live="polite" role="status">
      {items.map((t) => (
        <ToastView key={t.id} item={t} onClose={onClose} onExited={onExited} />
      ))}
    </div>
  )
}

function ToastView({ item, onClose, onExited }: { item: ToastItem; onClose: (id: number) => void; onExited: () => void }) {
  const [mounted, setMounted] = useState(false)
  const [closing, setClosing] = useState(false)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    setMounted(true)
    // auto-dismiss timer
    timerRef.current = window.setTimeout(() => handleClose(), item.duration)
    return () => { if (timerRef.current) window.clearTimeout(timerRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleClose = useCallback(() => {
    if (closing) return
    setClosing(true)
    // allow CSS transition to play before removal
    window.setTimeout(() => { onClose(item.id); onExited() }, 150)
  }, [closing, item.id, onClose, onExited])

  const colorClass = item.type === 'success'
    ? 'bg-green-600 text-white'
    : item.type === 'error'
    ? 'bg-red-600 text-white'
    : item.type === 'warning'
    ? 'bg-yellow-600 text-white'
    : 'bg-slate-800 text-white'

  const ariaRole = item.type === 'error' || item.type === 'warning' ? 'alert' : 'status'

  return (
    <div
      role={ariaRole}
      className={`rounded shadow text-sm overflow-hidden transform transition-all ${mounted && !closing ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'} ${colorClass}`}
      onKeyDown={(e) => { if (e.key === 'Escape') handleClose() }}
      tabIndex={0}
    >
      <div className="px-4 py-2 flex items-center gap-3">
        <span className="flex-1">{item.message}</span>
        {item.actionLabel && (
          <button
            className="px-2 py-1 rounded bg-black/20 hover:bg-black/30 text-white text-xs"
            onClick={() => { item.onAction?.(); handleClose() }}
          >
            {item.actionLabel}
          </button>
        )}
        <button aria-label="Close" className="ml-2 text-white/80 hover:text-white" onClick={handleClose}>×</button>
      </div>
      {/* Progress bar */}
      <Progress duration={item.duration} />
    </div>
  )
}

function Progress({ duration }: { duration: number }) {
  const [start, setStart] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setStart(true), 30)
    return () => clearTimeout(t)
  }, [])
  return (
    <div className="h-1 w-full bg-black/20">
      <div
        className={`h-full bg-white/70 transition-[width] ease-linear ${start ? 'w-0' : 'w-full'}`}
        style={{ transitionDuration: `${duration}ms` }}
      />
    </div>
  )
}

export const useToast = () => {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
