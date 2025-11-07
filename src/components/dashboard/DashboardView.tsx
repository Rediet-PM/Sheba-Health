import type { AuditLogEntry, Claim, Notification } from '../../types'
import { formatCurrency, formatDateTime } from '../../utils/format'

interface DashboardViewProps {
  claims: Claim[]
  notifications: Notification[]
  auditLogs: AuditLogEntry[]
}

export const DashboardView = ({ claims, notifications, auditLogs }: DashboardViewProps) => {
  const openClaims = claims.length
  const deniedClaims = claims.filter((claim) => claim.status === 'Denied').length
  const underpaidClaims = claims.filter((claim) => claim.status === 'Underpaid').length
  const totalVariance = claims.reduce((sum, claim) => sum + (claim.expectedAllowed - claim.paidAmount), 0)

  const topNotifications = notifications.slice(0, 4)
  const recentAudit = auditLogs.slice(-5).reverse()

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Open Claims</div>
          <div className="mt-2 text-3xl font-semibold text-slate-800">{openClaims}</div>
          <p className="mt-1 text-xs text-slate-400">Across all statuses in the selected database</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Denials Requiring Action</div>
          <div className="mt-2 text-3xl font-semibold text-rose-600">{deniedClaims}</div>
          <p className="mt-1 text-xs text-slate-400">Denied claims waiting for resubmission or appeal</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Underpayments Flagged</div>
          <div className="mt-2 text-3xl font-semibold text-amber-600">{underpaidClaims}</div>
          <p className="mt-1 text-xs text-slate-400">Auto-routed to AR specialists via rules engine</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Variance at Risk</div>
          <div className="mt-2 text-3xl font-semibold text-slate-800">{formatCurrency(Math.max(totalVariance, 0))}</div>
          <p className="mt-1 text-xs text-slate-400">Difference between expected vs paid this cycle</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700">Latest Notifications</h3>
          <p className="mt-1 text-xs text-slate-400">Auto-generated alerts from denial routing and clearinghouse feeds.</p>
          <ul className="mt-4 space-y-3">
            {topNotifications.length === 0 && (
              <li className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-400">
                No new alerts — check back after the next clearinghouse import.
              </li>
            )}
            {topNotifications.map((notification) => (
              <li key={notification.id} className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                      notification.type === 'Denial' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
                    }`}
                  >
                    {notification.type}
                  </span>
                  <span>{formatDateTime(notification.createdAt)}</span>
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-700">{notification.message}</p>
                <p className="text-xs text-slate-500">{notification.details}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700">Recent Activity</h3>
          <p className="mt-1 text-xs text-slate-400">Audit trail of key actions across claims, denials, and master files.</p>
          <ul className="mt-4 space-y-3 text-xs text-slate-500">
            {recentAudit.map((entry) => (
              <li key={entry.id} className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>{formatDateTime(entry.timestamp)}</span>
                  <span className="font-semibold text-slate-500">{entry.actorName}</span>
                </div>
                <p className="mt-1 text-sm font-semibold text-slate-700">{entry.action}</p>
                <p className="text-[11px] uppercase tracking-wide text-slate-400">
                  {entry.entityType} • {entry.entityId}
                </p>
                <p className="mt-1 text-xs text-slate-500">{entry.details}</p>
              </li>
            ))}
            {recentAudit.length === 0 && (
              <li className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-400">
                No recent activity logged yet.
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}
