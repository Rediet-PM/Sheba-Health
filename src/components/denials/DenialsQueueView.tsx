import { useMemo, useState } from 'react'
import type {
  DatabaseKey,
  Denial,
  DenialPriority,
  DenialRoutingRule,
  DenialStatus,
  Payer,
  ReasonCode,
  User,
} from '../../types'
import { formatCurrency } from '../../utils/format'

interface DenialsQueueViewProps {
  databaseId: DatabaseKey
  denials: Denial[]
  users: User[]
  payers: Payer[]
  reasonCodes: ReasonCode[]
  routingRules: DenialRoutingRule[]
  onStatusChange: (denialId: string, status: DenialStatus) => void
}

const STATUS_OPTIONS: Array<{ value: DenialStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All Statuses' },
  { value: 'New', label: 'New' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Appealed', label: 'Appealed' },
  { value: 'Closed', label: 'Closed' },
]

const PRIORITY_ORDER: DenialPriority[] = ['High', 'Medium', 'Low']

const priorityTone = (priority: DenialPriority) => {
  switch (priority) {
    case 'High':
      return 'bg-rose-50 text-rose-600'
    case 'Medium':
      return 'bg-amber-50 text-amber-600'
    default:
      return 'bg-emerald-50 text-emerald-600'
  }
}

const statusTone = (status: DenialStatus) => {
  switch (status) {
    case 'New':
      return 'bg-rose-50 text-rose-600'
    case 'In Progress':
      return 'bg-sky-50 text-sky-600'
    case 'Appealed':
      return 'bg-amber-50 text-amber-600'
    case 'Closed':
      return 'bg-emerald-50 text-emerald-600'
  }
}

const agingBucketLabel = (days: number) => {
  if (days <= 30) return '0-30'
  if (days <= 60) return '31-60'
  if (days <= 90) return '61-90'
  return '90+'
}

export const DenialsQueueView = ({
  databaseId,
  denials,
  users,
  payers,
  reasonCodes,
  routingRules,
  onStatusChange,
}: DenialsQueueViewProps) => {
  const [statusFilter, setStatusFilter] = useState<DenialStatus | 'all'>('all')
  const [payerFilter, setPayerFilter] = useState<string>('all')
  const [codeFilter, setCodeFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [agingFilter, setAgingFilter] = useState<string>('all')
  const [assignedFilter, setAssignedFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<DenialPriority | 'all'>('all')

  const filteredDenials = useMemo(() => {
    return denials
      .slice()
      .sort((a, b) => PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority))
      .filter((denial) => {
        if (statusFilter !== 'all' && denial.status !== statusFilter) return false
        if (payerFilter !== 'all' && denial.payerId !== payerFilter) return false
        if (codeFilter !== 'all' && denial.code !== codeFilter) return false
        if (categoryFilter !== 'all' && denial.category !== categoryFilter) return false
        if (assignedFilter !== 'all' && denial.assignedToUserId !== assignedFilter) return false
        if (priorityFilter !== 'all' && denial.priority !== priorityFilter) return false
        if (agingFilter !== 'all') {
          const bucket = agingBucketLabel(denial.daysInAR)
          if (bucket !== agingFilter) return false
        }
        return true
      })
  }, [denials, statusFilter, payerFilter, codeFilter, categoryFilter, assignedFilter, priorityFilter, agingFilter])

  const payerName = (payerId: string) => payers.find((payer) => payer.id === payerId)?.name ?? payerId
  const assignedUser = (userId: string) => users.find((user) => user.id === userId)
  const reasonDescription = (code: string) => reasonCodes.find((reason) => reason.code === code)?.description ?? '—'

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
          <div className="grid grid-cols-2 gap-3 text-xs font-semibold text-slate-500 sm:grid-cols-4">
            <div>
              <div className="text-[11px] uppercase tracking-wide text-slate-400">Total Open</div>
              <div className="text-lg font-semibold text-slate-800">{denials.length}</div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wide text-slate-400">Average Days in AR</div>
              <div className="text-lg font-semibold text-slate-800">
                {denials.length === 0
                  ? '—'
                  : Math.round(denials.reduce((sum, denial) => sum + denial.daysInAR, 0) / denials.length)}
              </div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wide text-slate-400">High Priority</div>
              <div className="text-lg font-semibold text-rose-600">
                {denials.filter((denial) => denial.priority === 'High' && denial.status !== 'Closed').length}
              </div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wide text-slate-400">Amount at Risk</div>
              <div className="text-lg font-semibold text-slate-800">
                {formatCurrency(denials.reduce((sum, denial) => sum + denial.amountAtRisk, 0))}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-4 text-sm text-amber-700 shadow-inner shadow-amber-100/60">
          <p className="font-semibold">Routing Rules Active</p>
          <p className="mt-1 text-xs text-amber-600">
            Denials are automatically assigned based on payer, reason codes, and dollar thresholds. Adjust rules in Admin
            as needed.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={payerFilter}
              onChange={(event) => setPayerFilter(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
            >
              <option value="all">All Payers</option>
              {payers.map((payer) => (
                <option key={payer.id} value={payer.id}>
                  {payer.name}
                </option>
              ))}
            </select>
            <select
              value={codeFilter}
              onChange={(event) => setCodeFilter(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
            >
              <option value="all">All Denial Codes</option>
              {Array.from(new Set(denials.map((denial) => denial.code))).map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
            >
              <option value="all">All Categories</option>
              <option value="CO">CO</option>
              <option value="PR">PR</option>
              <option value="OA">OA</option>
            </select>
            <select
              value={agingFilter}
              onChange={(event) => setAgingFilter(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
            >
              <option value="all">All Aging</option>
              <option value="0-30">0-30</option>
              <option value="31-60">31-60</option>
              <option value="61-90">61-90</option>
              <option value="90+">90+</option>
            </select>
            <select
              value={assignedFilter}
              onChange={(event) => setAssignedFilter(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
            >
              <option value="all">All Owners</option>
              {users
                .filter((user) => user.databases.includes(databaseId))
                .map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
            </select>
            <select
              value={priorityFilter}
              onChange={(event) => setPriorityFilter(event.target.value as DenialPriority | 'all')}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
            >
              <option value="all">All Priority</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as DenialStatus | 'all')}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-100 text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3">Denial ID</th>
                  <th className="px-4 py-3">Claim</th>
                  <th className="px-4 py-3">Payer</th>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Days in AR</th>
                  <th className="px-4 py-3">Owner</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDenials.map((denial) => {
                  const owner = assignedUser(denial.assignedToUserId)
                  return (
                    <tr key={denial.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800">{denial.id}</div>
                        <div className="text-xs text-slate-400">{denial.type === 'Underpayment' ? 'Underpayment' : 'Denial'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-700">{denial.claimId}</div>
                        <div className="text-xs text-slate-400">Aging bucket {agingBucketLabel(denial.daysInAR)} days</div>
                      </td>
                      <td className="px-4 py-3">{payerName(denial.payerId)}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-rose-500">{denial.code}</div>
                        <div className="text-xs text-slate-400">{reasonDescription(denial.code)}</div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-700">{formatCurrency(denial.amountAtRisk)}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${priorityTone(denial.priority)}`}>
                          {denial.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{denial.daysInAR}</td>
                      <td className="px-4 py-3">
                        {owner ? (
                          <div className="flex items-center gap-2">
                            <span className={`h-2 w-2 rounded-full ${owner.avatarColor}`} />
                            <div>
                              <div className="font-medium text-slate-700">{owner.name}</div>
                              <div className="text-xs text-slate-400">{owner.title ?? owner.role}</div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={denial.status}
                          onChange={(event) => onStatusChange(denial.id, event.target.value as DenialStatus)}
                          className={`rounded-full border border-transparent px-3 py-1 text-xs font-semibold ${statusTone(denial.status)} focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30`}
                        >
                          {['New', 'In Progress', 'Appealed', 'Closed'].map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  )
                })}
                {filteredDenials.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-sm text-slate-400">
                      No denials match the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-700">Routing Rules</h3>
            <p className="mt-1 text-xs text-slate-400">Rules determine assignment based on payer, denial code, or amount.</p>
            <ul className="mt-3 space-y-3">
              {routingRules.map((rule) => (
                <li key={rule.id} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3 text-xs text-slate-600">
                  <div className="font-semibold text-slate-700">{rule.name}</div>
                  <div className="mt-1 text-[11px] text-slate-500">
                    {rule.payerIds ? `Payer(s): ${rule.payerIds.join(', ')} · ` : ''}
                    {rule.denialCodes ? `Codes: ${rule.denialCodes.join(', ')} · ` : ''}
                    {rule.minAmount ? `Min ${formatCurrency(rule.minAmount)}` : 'Any amount'}
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-[11px] uppercase tracking-wide text-slate-400">Assigned To</span>
                    <span className="text-xs font-semibold text-slate-600">
                      {users.find((user) => user.id === rule.assignmentUserId)?.name ?? 'Queue'}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}
