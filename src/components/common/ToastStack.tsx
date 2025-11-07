import { useEffect } from 'react'

export interface ToastMessage {
  id: string
  title: string
  description?: string
}

interface ToastStackProps {
  toasts: ToastMessage[]
  onDismiss: (id: string) => void
  duration?: number
}

export const ToastStack = ({ toasts, onDismiss, duration = 4500 }: ToastStackProps) => {
  useEffect(() => {
    if (toasts.length === 0) return
    const timers = toasts.map((toast) => setTimeout(() => onDismiss(toast.id), duration))
    return () => {
      timers.forEach((timer) => clearTimeout(timer))
    }
  }, [toasts, duration, onDismiss])

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex w-full max-w-sm flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto rounded-2xl border border-rose-100 bg-white px-4 py-3 shadow-lg shadow-rose-100/40"
        >
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-2.5 w-2.5 flex-none animate-ping rounded-full bg-rose-500" />
            <div className="flex-1 text-sm text-slate-700">
              <div className="font-semibold text-rose-600">{toast.title}</div>
              {toast.description && <div className="mt-1 text-xs text-slate-500">{toast.description}</div>}
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="flex-none rounded-full border border-transparent p-1 text-slate-300 transition hover:border-slate-200 hover:text-slate-500"
            >
              <span className="sr-only">Dismiss</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m6 18 12-12M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
