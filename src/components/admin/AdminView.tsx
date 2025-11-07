import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import type { AuditLogEntry, ClearinghouseConfig, DatabaseKey, DatabaseState, ExpectedRate, User } from '../../types'
import { formatCurrency, formatDate } from '../../utils/format'

interface AdminViewProps {
  databaseId: DatabaseKey
  databases: Record<DatabaseKey, DatabaseState>
  users: User[]
  auditLogs: AuditLogEntry[]
  clearinghouse: ClearinghouseConfig
  onAddExpectedRate: (payload: { payerId: string; cpt: string; expectedAllowed: number; effectiveDate: string }) => void
  onUpdateExpectedRate: (rate: ExpectedRate) => void
  onCopyMasterFiles: (
    fromDatabase: DatabaseKey,
    toDatabase: DatabaseKey,
    options: { payers: boolean; expectedRates: boolean; reasonCodes: boolean },
  ) => void
  onSimulateClearinghouse: () => void
}

type AdminTab = 'users' | 'master' | 'clearinghouse' | 'audit'

export const AdminView = ({
  databaseId,
  databases,
  users,
  auditLogs,
  clearinghouse,
  onAddExpectedRate,
  onUpdateExpectedRate,
  onCopyMasterFiles,
  onSimulateClearinghouse,
}: AdminViewProps) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('users')
  const [editingRate, setEditingRate] = useState<ExpectedRate | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [copyFrom, setCopyFrom] = useState<DatabaseKey>('mainHospital')
  const [copyOptions, setCopyOptions] = useState({
    payers: true,
    expectedRates: true,
    reasonCodes: true,
  })
  const [newRate, setNewRate] = useState({
    payerId: '',
    cpt: '',
    expectedAllowed: '',
    effectiveDate: '',
  })

  const database = databases[databaseId]
  const payers = database.payers
  const expectedRates = database.expectedRates
  const reasonCodes = database.reasonCodes

  const userRows = users.map((user) => ({
    ...user,
    databases: user.databases,
  }))

  const auditForDatabase = useMemo(
    () => auditLogs.filter((entry) => entry.databaseId === databaseId).slice(-20).reverse(),
    [auditLogs, databaseId],
  )

  const handleRateSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (editingRate) {
      onUpdateExpectedRate({
        ...editingRate,
        payerId: newRate.payerId,
        cpt: newRate.cpt,
        expectedAllowed: Number(newRate.expectedAllowed),
        effectiveDate: newRate.effectiveDate,
      })
      setEditingRate(null)
    } else {
      onAddExpectedRate({
        payerId: newRate.payerId,
        cpt: newRate.cpt,
        expectedAllowed: Number(newRate.expectedAllowed),
        effectiveDate: newRate.effectiveDate,
      })
    }
    setNewRate({ payerId: '', cpt: '', expectedAllowed: '', effectiveDate: '' })
  }

  const startEditing = (rate: ExpectedRate) => {
    setEditingRate(rate)
    setNewRate({
      payerId: rate.payerId,
      cpt: rate.cpt,
      expectedAllowed: String(rate.expectedAllowed),
      effectiveDate: rate.effectiveDate,
    })
  }

  const handleCopySubmit = () => {
    if (copyFrom === databaseId) return
    onCopyMasterFiles(copyFrom, databaseId, copyOptions)
    setModalOpen(false)
  }

  const tabButton = (tab: AdminTab, label: string) => (
    <button
      key={tab}
      onClick={() => setActiveTab(tab)}
      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
        activeTab === tab ? 'bg-brand text-white shadow-sm shadow-brand/40' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
      }`}
    >
      {label}
    </button>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {tabButton('users', 'User Access')}
        {tabButton('master', 'Expected Rates & Master Files')}
        {tabButton('clearinghouse', 'Clearinghouse')}
        {tabButton('audit', 'Audit Logs')}
      </div>

      {activeTab === 'users' && (
        <section className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700">User Access Control</h3>
          <p className="mt-1 text-xs text-slate-400">Mock roster illustrating database-level access and roles.</p>
          <div className="mt-4 overflow-hidden rounded-xl border border-slate-100">
            <table className="min-w-full divide-y divide-slate-100 text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Databases</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {userRows.map((user) => (
                  <tr key={user.id}>
                    <td className="px-4 py-3 font-medium text-slate-700">{user.name}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{user.role}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{user.title}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      <div className="flex flex-wrap gap-1">
                        {user.databases.map((db) => (
                          <span key={db} className="rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-semibold text-brand">
                            {db}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === 'master' && (
        <section className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-700">Expected Rates</h3>
                <p className="text-xs text-slate-400">Manage payer + CPT fee schedules per database (mock data).</p>
              </div>
              <button
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-brand hover:text-brand"
              >
                Copy Master Files Between Databases
              </button>
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-[2fr,1fr]">
              <div className="overflow-hidden rounded-xl border border-slate-100">
                <table className="min-w-full divide-y divide-slate-100 text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    <tr>
                      <th className="px-4 py-3">Payer</th>
                      <th className="px-4 py-3">CPT</th>
                      <th className="px-4 py-3">Expected Allowed</th>
                      <th className="px-4 py-3">Effective</th>
                      <th className="px-4 py-3"> </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {expectedRates.map((rate) => (
                      <tr key={rate.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-700">{rate.payerId}</td>
                        <td className="px-4 py-3">{rate.cpt}</td>
                        <td className="px-4 py-3">{formatCurrency(rate.expectedAllowed)}</td>
                        <td className="px-4 py-3">{formatDate(rate.effectiveDate)}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => startEditing(rate)}
                            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-brand hover:text-brand"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                    {expectedRates.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-400">
                          No expected rates configured yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <form onSubmit={handleRateSubmit} className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
                <h4 className="text-sm font-semibold text-slate-700">
                  {editingRate ? 'Update Expected Rate' : 'Add Expected Rate'}
                </h4>
                <div className="space-y-2 text-xs text-slate-500">
                  <label className="flex flex-col gap-1">
                    <span>Payer</span>
                    <select
                      required
                      value={newRate.payerId}
                      onChange={(event) => setNewRate((prev) => ({ ...prev, payerId: event.target.value }))}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                    >
                      <option value="">Select payer</option>
                      {payers.map((payer) => (
                        <option key={payer.id} value={payer.id}>
                          {payer.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1">
                    <span>CPT Code</span>
                    <input
                      required
                      value={newRate.cpt}
                      onChange={(event) => setNewRate((prev) => ({ ...prev, cpt: event.target.value.toUpperCase() }))}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm uppercase text-slate-600 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span>Expected Allowed</span>
                    <input
                      required
                      type="number"
                      min="0"
                      step="10"
                      value={newRate.expectedAllowed}
                      onChange={(event) => setNewRate((prev) => ({ ...prev, expectedAllowed: event.target.value }))}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span>Effective Date</span>
                    <input
                      required
                      type="date"
                      value={newRate.effectiveDate}
                      onChange={(event) => setNewRate((prev) => ({ ...prev, effectiveDate: event.target.value }))}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                    />
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    className="inline-flex flex-1 items-center justify-center rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-dark"
                  >
                    {editingRate ? 'Update Rate' : 'Add Rate'}
                  </button>
                  {editingRate && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingRate(null)
                        setNewRate({ payerId: '', cpt: '', expectedAllowed: '', effectiveDate: '' })
                      }}
                      className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-brand hover:text-brand"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-700">Payer Master List</h3>
              <ul className="mt-3 space-y-2 text-xs text-slate-500">
                {payers.map((payer) => (
                  <li key={payer.id} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-700">{payer.name}</span>
                      <span className="text-[11px] uppercase tracking-wide text-slate-400">{payer.clearinghouse}</span>
                    </div>
                    <div className="text-[11px] text-slate-400">Payer ID: {payer.id}</div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-700">Reason Code Catalog</h3>
              <ul className="mt-3 space-y-2 text-xs text-slate-500">
                {reasonCodes.map((reason) => (
                  <li key={reason.id} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-700">{reason.code}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                        {reason.category}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">{reason.description}</div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'clearinghouse' && (
        <section className="grid gap-4 md:grid-cols-[2fr,1fr]">
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-700">Clearinghouse Feed (Simulated)</h3>
            <p className="mt-1 text-xs text-slate-400">
              Current integration: TriZetto. Clicking simulate will push random payments and denials into this database.
            </p>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                <div className="text-xs uppercase tracking-wide text-slate-400">Active Clearinghouse</div>
                <div className="mt-1 font-semibold text-slate-700">{clearinghouse.active}</div>
                <div className="mt-2 text-xs text-slate-400">
                  Available options:{' '}
                  <span className="font-semibold text-slate-600">{clearinghouse.available.join(' · ')}</span>
                </div>
              </div>
              <button
                onClick={onSimulateClearinghouse}
                className="inline-flex items-center rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-dark"
              >
                Simulate Clearinghouse Feed
              </button>
              <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-500">
                The simulated feed randomly posts payments, generates denials, triggers notifications, and writes audit
                log entries for traceability.
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-700 shadow-inner shadow-emerald-100/40">
              <p className="font-semibold">Statements</p>
              <p className="mt-1 text-xs text-emerald-600">
                Patient statement generation and migration:{' '}
                <span className="font-semibold text-emerald-700">COMPLETE</span>. Not part of this prototype.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-700">Integration Notes</h3>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-xs text-slate-500">
                <li>ERA auto-posting uses expected rate variance rules to flag underpayments instantly.</li>
                <li>Denials push to AR queues with routing rules defined per payer + code combination.</li>
                <li>All clearinghouse actions emit audit log entries for compliance review.</li>
              </ul>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'audit' && (
        <section className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700">Audit Logs</h3>
          <p className="mt-1 text-xs text-slate-400">Latest activity for {databaseId} (most recent first).</p>
          <div className="mt-4 overflow-hidden rounded-xl border border-slate-100">
            <table className="min-w-full divide-y divide-slate-100 text-left text-xs text-slate-600">
              <thead className="bg-slate-50 font-semibold text-slate-500">
                <tr>
                  <th className="px-3 py-2">Timestamp</th>
                  <th className="px-3 py-2">Actor</th>
                  <th className="px-3 py-2">Action</th>
                  <th className="px-3 py-2">Entity</th>
                  <th className="px-3 py-2">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditForDatabase.map((entry) => (
                  <tr key={entry.id}>
                    <td className="px-3 py-2">{formatDate(entry.timestamp)}</td>
                    <td className="px-3 py-2 font-semibold text-slate-700">{entry.actorName}</td>
                    <td className="px-3 py-2 text-slate-500">{entry.action}</td>
                    <td className="px-3 py-2 text-slate-500">
                      {entry.entityType} • {entry.entityId}
                    </td>
                    <td className="px-3 py-2 text-slate-500">{entry.details}</td>
                  </tr>
                ))}
                {auditForDatabase.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-slate-400">
                      No recent audit activity recorded for this database.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white px-6 py-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700">Copy Master Files</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-full border border-slate-200 p-2 text-slate-400 transition hover:text-slate-600"
              >
                <span className="sr-only">Close</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m6 18 12-12M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Copy mock payer, fee schedule, and reason code data from one database into {databaseId}.
            </p>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <label className="flex flex-col gap-1 text-xs">
                <span>Source Database</span>
                <select
                  value={copyFrom}
                  onChange={(event) => setCopyFrom(event.target.value as DatabaseKey)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                >
                  {(Object.keys(databases) as DatabaseKey[]).map((key) => (
                    <option key={key} value={key} disabled={key === databaseId}>
                      {key}
                    </option>
                  ))}
                </select>
              </label>
              <div className="space-y-2 text-xs">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={copyOptions.payers}
                    onChange={(event) => setCopyOptions((prev) => ({ ...prev, payers: event.target.checked }))}
                  />
                  Payers
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={copyOptions.expectedRates}
                    onChange={(event) => setCopyOptions((prev) => ({ ...prev, expectedRates: event.target.checked }))}
                  />
                  Expected Rates
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={copyOptions.reasonCodes}
                    onChange={(event) => setCopyOptions((prev) => ({ ...prev, reasonCodes: event.target.checked }))}
                  />
                  Reason Codes
                </label>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleCopySubmit}
                  className="inline-flex flex-1 items-center justify-center rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-brand/40"
                  disabled={copyFrom === databaseId}
                >
                  Copy to {databaseId}
                </button>
                <button
                  onClick={() => setModalOpen(false)}
                  className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-brand hover:text-brand"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
