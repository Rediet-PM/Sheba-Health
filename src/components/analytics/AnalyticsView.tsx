import { useMemo } from 'react'
import type { Claim, Denial, Payer, User } from '../../types'
import { formatCurrency, formatPercent } from '../../utils/format'

interface AnalyticsViewProps {
  claims: Claim[]
  denials: Denial[]
  payers: Payer[]
  users: User[]
}

const getLatestMonthKey = (claims: Claim[]) => {
  if (claims.length === 0) return ''
  const keys = claims.map((claim) => claim.serviceDate.slice(0, 7))
  return keys.sort().at(-1) ?? ''
}

const sparklinePath = (values: number[], width = 180, height = 60) => {
  if (values.length === 0) return ''
  const max = Math.max(...values)
  const min = Math.min(...values)
  const normalize = (value: number) => {
    if (max === min) return height / 2
    return height - ((value - min) / (max - min)) * height
  }
  return values
    .map((value, index) => {
      const x = (index / (values.length - 1 || 1)) * width
      const y = normalize(value)
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')
}

export const AnalyticsView = ({ claims, denials, payers, users }: AnalyticsViewProps) => {
  const latestMonthKey = getLatestMonthKey(claims)
  const claimsThisMonth = claims.filter((claim) => claim.serviceDate.startsWith(latestMonthKey))

  const totalCharges = claimsThisMonth.reduce((sum, claim) => sum + claim.totalCharge, 0)
  const totalPayments = claimsThisMonth.reduce((sum, claim) => sum + claim.paidAmount, 0)
  const denialRate = claims.length === 0 ? 0 : claims.filter((claim) => claim.status === 'Denied').length / claims.length
  const averageDaysInAR =
    claims.length === 0 ? 0 : claims.reduce((sum, claim) => sum + claim.daysInAR, 0) / claims.length

  const denialsByPayer = useMemo(() => {
    const map = new Map<string, number>()
    denials.forEach((denial) => {
      map.set(denial.payerId, (map.get(denial.payerId) ?? 0) + 1)
    })
    return Array.from(map.entries())
      .map(([payerId, count]) => ({
        payerId,
        payerName: payers.find((payer) => payer.id === payerId)?.name ?? payerId,
        count,
      }))
      .sort((a, b) => b.count - a.count)
  }, [denials, payers])

  const cashCollectionsByWeek = useMemo(() => {
    const weekMap = new Map<string, number>()
    claims
      .filter((claim) => claim.paidAmount > 0)
      .forEach((claim) => {
        const service = new Date(claim.serviceDate)
        const weekStart = new Date(service)
        weekStart.setDate(service.getDate() - service.getDay()) // Sunday as week start
        const key = weekStart.toISOString().slice(0, 10)
        weekMap.set(key, (weekMap.get(key) ?? 0) + claim.paidAmount)
      })
    return Array.from(weekMap.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([key, amount]) => ({ week: key, amount }))
  }, [claims])

  const denialCategoryDistribution = useMemo(() => {
    const map = new Map<string, number>()
    denials.forEach((denial) => {
      map.set(denial.category, (map.get(denial.category) ?? 0) + 1)
    })
    const total = Array.from(map.values()).reduce((sum, value) => sum + value, 0)
    return Array.from(map.entries()).map(([category, value]) => ({
      category,
      value,
      percent: total === 0 ? 0 : value / total,
    }))
  }, [denials])

  const staffProductivity = useMemo(() => {
    return users
      .filter((user) => user.role !== 'Executive')
      .map((user) => {
        const claimsAssigned = claims.filter((claim) => claim.assignedToUserId === user.id)
        const denialsOwned = denials.filter((denial) => denial.assignedToUserId === user.id)
        const closedDenials = denialsOwned.filter((denial) => denial.status === 'Closed')
        const openDenials = denialsOwned.filter((denial) => denial.status !== 'Closed')
        return {
          user,
          claimsTouched: claimsAssigned.length,
          denialsClosed: closedDenials.length,
          workload: openDenials.length,
          resolutionTime:
            closedDenials.length === 0
              ? '—'
              : `${Math.max(
                  2,
                  Math.round(closedDenials.reduce((sum, denial) => sum + denial.daysInAR, 0) / closedDenials.length),
                )} days`,
        }
      })
  }, [users, claims, denials])

  const cashValues = cashCollectionsByWeek.map((entry) => entry.amount)
  const sparkline = sparklinePath(cashValues)

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Total Charges (this month)</div>
          <div className="mt-2 text-2xl font-semibold text-slate-800">{formatCurrency(totalCharges)}</div>
          <div className="mt-1 text-xs text-slate-400">Month {latestMonthKey || 'n/a'}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Total Payments (this month)</div>
          <div className="mt-2 text-2xl font-semibold text-emerald-600">{formatCurrency(totalPayments)}</div>
          <div className="mt-1 text-xs text-slate-400">Electronic + paper payments applied</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Denial Rate</div>
          <div className="mt-2 text-2xl font-semibold text-rose-600">{formatPercent(denialRate, 1)}</div>
          <div className="mt-1 text-xs text-slate-400">Claims in denied status vs total claims</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Average Days in AR</div>
          <div className="mt-2 text-2xl font-semibold text-slate-800">{Math.round(averageDaysInAR)}</div>
          <div className="mt-1 text-xs text-slate-400">All open claims across databases</div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">Denials by Payer</h3>
            <span className="text-xs text-slate-400">{denials.length} open tasks</span>
          </div>
          <ul className="mt-4 space-y-3">
            {denialsByPayer.map((entry) => {
              const max = denialsByPayer[0]?.count ?? 1
              return (
                <li key={entry.payerId}>
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span className="font-medium text-slate-700">{entry.payerName}</span>
                    <span>{entry.count}</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-slate-100">
                    <div
                      style={{ width: `${(entry.count / max) * 100}%` }}
                      className="h-2 rounded-full bg-brand"
                      aria-hidden
                    />
                  </div>
                </li>
              )
            })}
            {denialsByPayer.length === 0 && (
              <li className="text-sm text-slate-400">No denials recorded for this database.</li>
            )}
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">Cash Collections by Week</h3>
            <span className="text-xs text-slate-400">ERA + paper payments posted</span>
          </div>
          <div className="mt-4 h-32 w-full">
            <svg width="100%" height="100%" viewBox="0 0 200 80">
              <defs>
                <linearGradient id="cashGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#1D9A94" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#1D9A94" stopOpacity="0.05" />
                </linearGradient>
              </defs>
              <path d={`${sparkline}`} fill="none" stroke="#1D9A94" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-400">
            {cashCollectionsByWeek.map((entry) => (
              <div key={entry.week} className="flex items-center justify-between rounded-lg bg-slate-50 px-2 py-1">
                <span>{entry.week}</span>
                <span className="font-semibold text-slate-600">{formatCurrency(entry.amount)}</span>
              </div>
            ))}
            {cashCollectionsByWeek.length === 0 && <div className="text-sm text-slate-400">No payments posted yet.</div>}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700">Denial Categories</h3>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            {denialCategoryDistribution.map((item) => (
              <div key={item.category}>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-700">{item.category}</span>
                  <span>{formatPercent(item.percent, 0)}</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-slate-100">
                  <div
                    style={{ width: `${item.percent * 100}%` }}
                    className="h-2 rounded-full bg-slate-400"
                    aria-hidden
                  />
                </div>
              </div>
            ))}
            {denialCategoryDistribution.length === 0 && (
              <p className="text-sm text-slate-400">No denial categories to display.</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700">Staff Productivity</h3>
          <div className="mt-4 overflow-hidden rounded-xl border border-slate-100">
            <table className="min-w-full divide-y divide-slate-100 text-left text-xs text-slate-600">
              <thead className="bg-slate-50 font-semibold text-slate-500">
                <tr>
                  <th className="px-3 py-2">Staff</th>
                  <th className="px-3 py-2">Claims Touched</th>
                  <th className="px-3 py-2">Denials Closed</th>
                  <th className="px-3 py-2">Avg Resolution</th>
                  <th className="px-3 py-2">Workload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staffProductivity.map((entry) => (
                  <tr key={entry.user.id}>
                    <td className="px-3 py-2">
                      <div className="font-medium text-slate-700">{entry.user.name}</div>
                      <div className="text-[11px] text-slate-400">{entry.user.role}</div>
                    </td>
                    <td className="px-3 py-2 text-center">{entry.claimsTouched}</td>
                    <td className="px-3 py-2 text-center">{entry.denialsClosed}</td>
                    <td className="px-3 py-2 text-center">{entry.resolutionTime}</td>
                    <td className="px-3 py-2 text-center">
                      <span className="rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-600">{entry.workload}</span>
                    </td>
                  </tr>
                ))}
                {staffProductivity.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-slate-400">
                      No staff data available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
