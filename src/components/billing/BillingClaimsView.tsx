import { useMemo, useState } from 'react'
import type { Claim, ClaimStatus, Payer, User } from '../../types'
import { formatCurrency, formatDate } from '../../utils/format'

interface BillingClaimsViewProps {
  claims: Claim[]
  payers: Payer[]
  users: User[]
  selectedClaimId?: string
  onSelectClaim: (claim: Claim) => void
  landingNotesSummary?: string
}

const STATUS_OPTIONS: Array<{ value: ClaimStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All Statuses' },
  { value: 'Submitted', label: 'Submitted' },
  { value: 'In Process', label: 'In Process' },
  { value: 'Paid', label: 'Paid' },
  { value: 'Denied', label: 'Denied' },
  { value: 'Underpaid', label: 'Underpaid' },
]

const varianceTone = (percent: number) => {
  if (Number.isNaN(percent)) return 'text-slate-500 bg-slate-100'
  if (percent < -0.15) return 'text-rose-600 bg-rose-50'
  if (percent < -0.05) return 'text-amber-600 bg-amber-50'
  if (percent <= 0.05 && percent >= -0.05) return 'text-emerald-600 bg-emerald-50'
  return 'text-slate-600 bg-slate-100'
}

const statusTone = (status: ClaimStatus) => {
  switch (status) {
    case 'Paid':
      return 'bg-emerald-50 text-emerald-600'
    case 'Denied':
      return 'bg-rose-50 text-rose-600'
    case 'Underpaid':
      return 'bg-amber-50 text-amber-600'
    case 'In Process':
      return 'bg-sky-50 text-sky-600'
    default:
      return 'bg-slate-100 text-slate-600'
  }
}

const chip = (label: string, tone: string) => (
  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>{label}</span>
)

const summariseNote = (note?: string) => {
  if (!note) return ''
  if (note.length < 140) return note
  return `${note.slice(0, 136)}…`
}

export const BillingClaimsView = ({
  claims,
  payers,
  users,
  selectedClaimId,
  onSelectClaim,
  landingNotesSummary,
}: BillingClaimsViewProps) => {
  const [statusFilter, setStatusFilter] = useState<ClaimStatus | 'all'>('all')
  const [payerFilter, setPayerFilter] = useState<string>('all')
  const [hasDenialOnly, setHasDenialOnly] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [dateRange, setDateRange] = useState('30')

  const filteredClaims = useMemo(() => {
    return claims.filter((claim) => {
      if (statusFilter !== 'all' && claim.status !== statusFilter) return false
      if (payerFilter !== 'all' && claim.payerId !== payerFilter) return false
      if (hasDenialOnly && !claim.hasDenial) return false
      if (searchTerm) {
        const normalized = searchTerm.toLowerCase()
        const matchPatient = claim.patient.toLowerCase().includes(normalized)
        const matchId = claim.id.toLowerCase().includes(normalized)
        if (!matchPatient && !matchId) return false
      }
      return true
    })
  }, [claims, statusFilter, payerFilter, hasDenialOnly, searchTerm])

  const formatVariance = (claim: Claim) => {
    const varianceAmount = claim.paidAmount - claim.expectedAllowed
    const variancePercent =
      claim.expectedAllowed === 0 ? 0 : (claim.paidAmount - claim.expectedAllowed) / claim.expectedAllowed
    const label = `${varianceAmount >= 0 ? '+' : ''}${formatCurrency(varianceAmount)} (${(variancePercent * 100).toFixed(
      1,
    )}%)`
    return { label, percent: variancePercent }
  }

  const findUser = (userId: string) => users.find((user) => user.id === userId)

  const payerName = (payerId: string) => payers.find((payer) => payer.id === payerId)?.name ?? payerId

  const intakeSummary = summariseNote(landingNotesSummary)

  return (
    <div className="space-y-6">
      {intakeSummary && (
        <div className="rounded-2xl border border-brand/20 bg-brand/5 px-5 py-4 text-sm text-slate-600 shadow-inner shadow-brand/10">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-brand">Captured Intake</div>
          <p className="leading-relaxed">{intakeSummary}</p>
        </div>
      )}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={dateRange}
            onChange={(event) => setDateRange(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
          >
            <option value="30">Last 30 days</option>
            <option value="60">Last 60 days</option>
            <option value="90">Last 90 days</option>
            <option value="all">All time</option>
          </select>
          <select
            value={payerFilter}
            onChange={(event) => setPayerFilter(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
          >
            <option value="all">All Payers</option>
            {payers.map((payer) => (
              <option key={payer.id} value={payer.id}>
                {payer.name}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as ClaimStatus | 'all')}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => setHasDenialOnly((prev) => !prev)}
            className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition ${
              hasDenialOnly
                ? 'border-rose-200 bg-rose-50 text-rose-600'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
            }`}
          >
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
            Has Denial
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search claim or patient..."
              className="w-56 rounded-xl border border-slate-200 bg-white px-4 py-2 pl-10 text-sm text-slate-600 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button className="inline-flex items-center rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-dark">
          New Claim
        </button>
        <button className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-brand hover:text-brand">
          Generate Electronic Batch (837)
        </button>
        <button className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-brand hover:text-brand">
          Print Paper Claims
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-100 text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-4">Claim ID</th>
              <th className="px-5 py-4">Patient</th>
              <th className="px-5 py-4">Payer</th>
              <th className="px-5 py-4">Total Charge</th>
              <th className="px-5 py-4">Expected Allowed</th>
              <th className="px-5 py-4">Paid Amount</th>
              <th className="px-5 py-4">Variance</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">Days in AR</th>
              <th className="px-5 py-4">Assigned To</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredClaims.map((claim) => {
              const variance = formatVariance(claim)
              const user = findUser(claim.assignedToUserId)
              const isSelected = selectedClaimId === claim.id
              return (
                <tr
                  key={claim.id}
                  onClick={() => onSelectClaim(claim)}
                  className={`cursor-pointer bg-white transition hover:bg-slate-50 ${
                    isSelected ? 'ring-1 ring-brand/40' : ''
                  }`}
                >
                  <td className="px-5 py-4">
                    <div className="font-semibold text-slate-800">{claim.id}</div>
                    <div className="text-xs text-slate-400">DOS {formatDate(claim.serviceDate)}</div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-medium text-slate-700">{claim.patient}</div>
                    {claim.hasDenial && <div className="mt-1 text-xs font-semibold text-rose-500">Denial / Task open</div>}
                  </td>
                  <td className="px-5 py-4">{payerName(claim.payerId)}</td>
                  <td className="px-5 py-4 font-semibold text-slate-700">{formatCurrency(claim.totalCharge)}</td>
                  <td className="px-5 py-4 text-slate-500">{formatCurrency(claim.expectedAllowed)}</td>
                  <td className="px-5 py-4 text-slate-500">{formatCurrency(claim.paidAmount)}</td>
                  <td className="px-5 py-4">
                    {chip(variance.label, `${varianceTone(variance.percent)} font-semibold`)}
                  </td>
                  <td className="px-5 py-4">{chip(claim.status, statusTone(claim.status))}</td>
                  <td className="px-5 py-4 text-slate-500">{claim.daysInAR}</td>
                  <td className="px-5 py-4">
                    {user ? (
                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${user.avatarColor}`} />
                        <div>
                          <div className="font-medium text-slate-700">{user.name}</div>
                          <div className="text-xs text-slate-400">{user.role}</div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">Unassigned</span>
                    )}
                  </td>
                </tr>
              )
            })}
            {filteredClaims.length === 0 && (
              <tr>
                <td colSpan={10} className="px-5 py-12 text-center text-sm text-slate-400">
                  No claims match the selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
