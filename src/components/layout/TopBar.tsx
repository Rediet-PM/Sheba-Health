import type { DatabaseKey, DatabaseMeta, Notification, User } from '../../types'
import { formatDateTime } from '../../utils/format'

interface TopBarProps {
  databases: DatabaseMeta[]
  currentDatabase: DatabaseKey
  onDatabaseChange: (database: DatabaseKey) => void
  currentUser: User
  notifications: Notification[]
  onOpenNotifications: () => void
}

const avatarInitials = (name: string) =>
  name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

export const TopBar = ({
  databases,
  currentDatabase,
  onDatabaseChange,
  currentUser,
  notifications,
  onOpenNotifications,
}: TopBarProps) => {
  const unreadCount = notifications.filter((notification) => !notification.read).length
  const mostRecent = notifications[0]

  return (
    <header className="flex h-16 flex-none items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="text-sm font-semibold text-slate-600">Database</div>
        <select
          value={currentDatabase}
          onChange={(event) => onDatabaseChange(event.target.value as DatabaseKey)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/40"
        >
          {databases.map((db) => (
            <option key={db.id} value={db.id}>
              {db.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={onOpenNotifications}
          className="relative inline-flex items-center justify-center rounded-full border border-slate-200 bg-white/80 p-2 text-slate-500 transition hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          <span className="sr-only">View notifications</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M14 15h1a3 3 0 0 0 3-3V9a6 6 0 1 0-12 0v3a3 3 0 0 0 3 3h1m4 0v1a3 3 0 1 1-6 0v-1m6 0H9"
            />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3 animate-pulse items-center justify-center rounded-full bg-rose-500">
              <span className="sr-only">{unreadCount} unread</span>
            </span>
          )}
        </button>

        {mostRecent && (
          <div className="hidden text-xs leading-tight text-slate-400 lg:block">
            <div className="font-semibold text-slate-500">{mostRecent.message}</div>
            <div>{formatDateTime(mostRecent.createdAt)}</div>
          </div>
        )}

        <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white/70 px-3 py-1">
          <div
            className={`flex h-9 w-9 flex-none items-center justify-center rounded-full text-sm font-semibold text-white ${currentUser.avatarColor}`}
          >
            {avatarInitials(currentUser.name)}
          </div>
          <div className="hidden text-sm leading-tight text-slate-600 sm:block">
            <div className="font-semibold text-slate-700">{currentUser.name}</div>
            <div className="text-xs text-slate-400">{currentUser.role}</div>
          </div>
        </div>
      </div>
    </header>
  )
}
