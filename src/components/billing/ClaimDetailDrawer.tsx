import { useMemo, useState } from 'react'
import type { ChangeEvent } from 'react'
import type { Claim, DatabaseKey, EligibilityCheck, EligibilityStatus, ExpectedRate, Payer, ReasonCode, User } from '../../types'
import { formatCurrency, formatDate, formatPercent } from '../../utils/format'

interface ClaimDetailDrawerProps {
  claim: Claim | null
  databaseId: DatabaseKey
  onClose: () => void
  payers: Payer[]
  users: User[]
  expectedRates: ExpectedRate[]
  reasonCodes: ReasonCode[]
  onUploadEob: (file: { fileName: string; fileUrl: string }) => void
  onCheckEligibility: () => EligibilityCheck
  onReassign: (userId: string) => void
}

const findMatchingRate = (rates: ExpectedRate[], payerId: string, cpt: string) =>
  rates.find((rate) => rate.payerId === payerId && rate.cpt === cpt)

const labelForEligibility = (status: EligibilityStatus) => {
  switch (status) {
    case 'Eligible':
      return 'bg-emerald-50 text-emerald-600'
    case 'Not Eligible':
      return 'bg-rose-50 text-rose-600'
    default:
      return 'bg-amber-50 text-amber-600'
  }
}

const formatAssignment = (user: User | undefined) =>
  user ? (
    <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
      <span className={`h-2 w-2 rounded-full ${user.avatarColor}`} />
      {user.name}
    </div>
  ) : (
    <span className="text-xs text-slate-400">Unassigned</span>
  )

export const ClaimDetailDrawer = ({
  claim,
  databaseId,
  onClose,
  payers,
  users,
  expectedRates,
  reasonCodes,
  onUploadEob,
  onCheckEligibility,
  onReassign,
}: ClaimDetailDrawerProps) => {
  const [eligibility, setEligibility] = useState<EligibilityCheck | undefined>(claim?.eligibility)

  const payerName = useMemo(
    () => (claim ? payers.find((payer) => payer.id === claim.payerId)?.name ?? claim.payerId : ''),
    [claim, payers],
  )

  const assignedTo = useMemo(() => users.find((user) => user.id === claim?.assignedToUserId), [claim, users])
  const eligibleStyles = eligibility ? labelForEligibility(eligibility.status) : ''

  if (!claim) return null

  const varianceAmount = claim.paidAmount - claim.expectedAllowed
  const variancePercent = claim.expectedAllowed === 0 ? 0 : varianceAmount / claim.expectedAllowed

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const fileUrl = URL.createObjectURL(file)
    onUploadEob({ fileName: file.name, fileUrl })
  }

  const handleEligibility = () => {
    const result = onCheckEligibility()
    setEligibility(result)
  }

  const handleReassign = (event: ChangeEvent<HTMLSelectElement>) => {
    onReassign(event.target.value)
  }

  const stackedItems = claim.lineItems.map((item) => ({
    ...item,
    expectedRate: findMatchingRate(expectedRates, claim.payerId, item.cpt),
    denialDescription: item.denialCode
      ? reasonCodes.find((reason) => reason.code === item.denialCode)?.description ?? ''
      : undefined,
  }))

  const eraSummary = [
    {
      postingDate: claim.createdAt,
      amount: claim.paidAmount,
      balance: Math.max(claim.expectedAllowed - claim.paidAmount, 0),
    },
  ]

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col border-l border-slate-200 bg-white shadow-xl">
      <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Claim {claim.id}</h2>
          <p className="text-sm text-slate-500">
            {payerName} • {claim.patient}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Database: <span className="font-medium text-slate-500">{databaseId}</span> • DOS {formatDate(claim.serviceDate)}
          </p>
        </div>
        <button
          onClick={onClose}
          className="rounded-full border border-slate-200 p-2 text-slate-400 transition hover:text-slate-600"
        >
          <span className="sr-only">Close</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m6 18 12-12M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 px-6 py-6">
        <section>
          <h3 className="text-sm font-semibold text-slate-700">Financial Snapshot</h3>
          <div className="mt-3 grid grid-cols-2 gap-4 rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-3 text-sm text-slate-600">
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-400">Total Charge</div>
              <div className="text-base font-semibold text-slate-800">{formatCurrency(claim.totalCharge)}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-400">Expected Allowed</div>
              <div className="text-base font-semibold text-slate-800">{formatCurrency(claim.expectedAllowed)}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-400">Paid Amount</div>
              <div className="text-base font-semibold text-slate-800">{formatCurrency(claim.paidAmount)}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-400">Variance</div>
              <div
                className={`text-base font-semibold ${
                  variancePercent < -0.15
                    ? 'text-rose-600'
                    : variancePercent < -0.05
                      ? 'text-amber-600'
                      : 'text-emerald-600'
                }`}
              >
                {formatCurrency(varianceAmount)} ({formatPercent(variancePercent)})
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">Line Items</h3>
            <div className="text-xs text-slate-400">Expected rate logic driven by payer + CPT rules</div>
          </div>
          <div className="mt-3 overflow-hidden rounded-2xl border border-slate-100">
            <table className="min-w-full divide-y divide-slate-100 text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3">CPT</th>
                  <th className="px-4 py-3">Charge</th>
                  <th className="px-4 py-3">Expected</th>
                  <th className="px-4 py-3">Paid</th>
                  <th className="px-4 py-3">Denial Code</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stackedItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-700">{item.cpt}</div>
                      <div className="text-xs text-slate-400">{item.description}</div>
                    </td>
                    <td className="px-4 py-3">{formatCurrency(item.charge)}</td>
                    <td className="px-4 py-3">{formatCurrency(item.expectedAllowed)}</td>
                    <td className="px-4 py-3">{formatCurrency(item.paidAmount)}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {item.denialCode ? (
                        <div>
                          <div className="font-semibold text-rose-500">{item.denialCode}</div>
                          <div>{item.denialDescription}</div>
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h3 className="text-sm font-semibold text-slate-700">Expected Rate Rules</h3>
          <div className="mt-3 space-y-3">
            {stackedItems.map((item) => {
              const expected = findMatchingRate(expectedRates, claim.payerId, item.cpt)
              return (
                <div key={`${claim.id}-${item.cpt}`} className="rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Rule</div>
                  <div className="mt-1 text-sm text-slate-600">
                    {expected ? (
                      <>
                        Payer <span className="font-semibold">{payerName}</span> • CPT{' '}
                        <span className="font-semibold">{item.cpt}</span> → {formatCurrency(expected.expectedAllowed)}{' '}
                        <span className="text-xs text-slate-400">(effective {formatDate(expected.effectiveDate)})</span>
                      </>
                    ) : (
                      'No rule matched – defaulted to historical allowed amount.'
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">Payment &amp; EOB</h3>
            {claim.eobDocument && (
              <a
                href={claim.eobDocument.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-brand hover:text-brand"
              >
                View EOB
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                </svg>
              </a>
            )}
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-100">
            <table className="min-w-full divide-y divide-slate-100 text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3">Posting Date</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Balance</th>
                </tr>
              </thead>
              <tbody>
                {eraSummary.map((entry) => (
                  <tr key={entry.postingDate} className="divide-x divide-slate-100">
                    <td className="px-4 py-3">{formatDate(entry.postingDate)}</td>
                    <td className="px-4 py-3">{formatCurrency(entry.amount)}</td>
                    <td className="px-4 py-3">{formatCurrency(entry.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <label className="flex w-full cursor-pointer items-center justify-between rounded-2xl border border-dashed border-slate-200 px-4 py-3 text-sm text-slate-500 hover:border-brand hover:text-brand">
            <div>
              <span className="font-semibold text-slate-600">Attach Digital EOB</span>
              <div className="text-xs text-slate-400">PDF or image – stored in memory for this session</div>
            </div>
            <input type="file" accept=".pdf,.png,.jpg,.jpeg,.gif" className="hidden" onChange={handleFileUpload} />
            <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">Upload</span>
          </label>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">Authorization &amp; Eligibility</h3>
            <div className="text-xs text-slate-500">Connected to AR dashboards</div>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-400">Authorization</div>
                <div className="mt-1 text-sm text-slate-600">
                  {claim.authorization.status === 'Approved' && (
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                      Auth #{claim.authorization.authNumber} – Approved
                    </span>
                  )}
                  {claim.authorization.status === 'Pending' && (
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-600">
                      Pending Authorization
                    </span>
                  )}
                  {claim.authorization.status === 'Missing' && (
                    <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600">
                      Missing Authorization
                    </span>
                  )}
                </div>
                {claim.authorization.notes && <p className="mt-2 text-xs text-slate-400">{claim.authorization.notes}</p>}
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-400">Eligibility</div>
                {eligibility ? (
                  <div className={`mt-1 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${eligibleStyles}`}>
                    {eligibility.status}
                  </div>
                ) : (
                  <p className="mt-1 text-xs text-slate-400">No eligibility check recorded.</p>
                )}
                {eligibility && <p className="mt-2 text-xs text-slate-500">{eligibility.details}</p>}
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                onClick={handleEligibility}
                className="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-dark"
              >
                Check Eligibility
              </button>
              <select
                value={claim.assignedToUserId}
                onChange={handleReassign}
                className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              >
                {users
                  .filter((user) => user.databases.includes(databaseId))
                  .map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} – {user.role}
                    </option>
                  ))}
              </select>
              {formatAssignment(assignedTo)}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
