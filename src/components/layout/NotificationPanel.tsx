import type { Notification } from '../../types'
import { formatCurrency, formatDateTime } from '../../utils/format'

interface NotificationPanelProps {
  notifications: Notification[]
  open: boolean
  onClose: () => void
  onDismiss: (id: string) => void
}

export const NotificationPanel = ({ notifications, open, onClose, onDismiss }: NotificationPanelProps) => {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-slate-900/20 backdrop-blur-sm">
      <div className="flex w-full max-w-sm flex-col border-l border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-700">Notifications</h3>
            <p className="text-xs text-slate-400">Clearinghouse feeds & auto-assigned tasks</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-slate-200 p-1.5 text-slate-400 transition hover:text-slate-600"
          >
            <span className="sr-only">Close</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m6 18 12-12M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center px-5 text-center text-sm text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="mb-4 h-10 w-10 text-slate-200" viewBox="0 0 24 24" fill="none">
                <path
                  d="M15 17H9a3 3 0 0 1-3-3v-4a6 6 0 1 1 12 0v4a3 3 0 0 1-3 3Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M13 21h-2a2 2 0 0 1-2-2v-2h6v2a2 2 0 0 1-2 2Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              All clear – you’re caught up.
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {notifications.map((notification) => (
                <li key={notification.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          notification.type === 'Denial'
                            ? 'bg-rose-50 text-rose-600'
                            : 'bg-amber-50 text-amber-600'
                        }`}
                      >
                        {notification.type === 'Denial' ? 'Denial' : 'Underpayment'}
                      </span>
                      <p className="mt-2 text-sm font-semibold text-slate-700">{notification.message}</p>
                      {notification.amount && (
                        <p className="mt-1 text-sm text-slate-500">{formatCurrency(notification.amount)}</p>
                      )}
                      <p className="mt-1 text-xs text-slate-400">{notification.details}</p>
                    </div>
                    <button
                      onClick={() => onDismiss(notification.id)}
                      className="rounded-full border border-transparent p-1 text-slate-300 transition hover:border-slate-200 hover:text-slate-500"
                    >
                      <span className="sr-only">Dismiss</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m6 18 12-12M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="mt-2 text-xs text-slate-400">{formatDateTime(notification.createdAt)}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
