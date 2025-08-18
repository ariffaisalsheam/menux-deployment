import React, { createContext, useCallback, useContext, useState } from 'react'

type ToastType = 'success' | 'error' | 'info'

type ToastItem = {
  id: number
  message: string
  type: ToastType
}

type ToastContextValue = {
  notify: (message: string, type?: ToastType) => void
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const notify = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, message, type }])
    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }, [])

  const value: ToastContextValue = {
    notify,
    success: (m: string) => notify(m, 'success'),
    error: (m: string) => notify(m, 'error'),
    info: (m: string) => notify(m, 'info'),
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={
              'px-4 py-2 rounded shadow text-sm ' +
              (t.type === 'success'
                ? 'bg-green-600 text-white'
                : t.type === 'error'
                ? 'bg-red-600 text-white'
                : 'bg-slate-800 text-white')
            }
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
