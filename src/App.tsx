import { useMemo, useState } from 'react'
import { AnalyticsView } from './components/analytics/AnalyticsView'
import { BillingClaimsView } from './components/billing/BillingClaimsView'
import { ClaimDetailDrawer } from './components/billing/ClaimDetailDrawer'
import { AdminView } from './components/admin/AdminView'
import { DashboardView } from './components/dashboard/DashboardView'
import { ToastStack } from './components/common/ToastStack'
import { DenialsQueueView } from './components/denials/DenialsQueueView'
import { LandingScreen } from './components/landing/LandingScreen'
import { NotificationPanel } from './components/layout/NotificationPanel'
import { Sidebar } from './components/layout/Sidebar'
import { TopBar } from './components/layout/TopBar'
import { useAppState } from './state/AppStateProvider'
import type { ToastMessage } from './components/common/ToastStack'
import type { AppNavKey } from './state/AppStateProvider'

const App = () => {
  const {
    currentDatabase,
    metadata,
    setCurrentDatabase,
    databases,
    users,
    notifications,
    markNotificationsRead,
    dismissNotification,
    landingNotes,
    updateLandingNote,
    currentUser,
    routingRules,
    auditLogs,
    clearinghouse,
    performEligibilityCheck,
    uploadEobDocument,
    updateDenialStatus,
    updateClaimAssignment,
    addExpectedRate,
    updateExpectedRate,
    copyMasterFiles,
    simulateClearinghouseFeed,
  } = useAppState()

  const [mode, setMode] = useState<'landing' | 'app'>('landing')
  const [activeNav, setActiveNav] = useState<AppNavKey>('billing')
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null)
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false)
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const database = databases[currentDatabase]

  const selectedClaim = useMemo(
    () => database.claims.find((claim) => claim.id === selectedClaimId) ?? null,
    [database.claims, selectedClaimId],
  )

  const intakeSummary =
    landingNotes.doctorNote.trim() || landingNotes.referralNote.trim()
      ? `${landingNotes.doctorNote || landingNotes.referralNote}`
      : undefined

  const addToast = (title: string, description?: string) => {
    setToasts((prev) => [...prev, { id: crypto.randomUUID(), title, description }])
  }

  const handleGenerate = () => {
    setMode('app')
    setActiveNav('billing')
  }

  const handleViewTasks = () => {
    setMode('app')
    setActiveNav('denials')
  }

  const handleNotificationToggle = () => {
    const next = !notificationPanelOpen
    setNotificationPanelOpen(next)
    if (next) {
      markNotificationsRead()
    }
  }

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  const handleSimulate = () => {
    const result = simulateClearinghouseFeed()
    result.newDenials.forEach((denial) => {
      addToast('New Denial Routed', `${denial.code} • ${denial.amountAtRisk.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`)
    })
    if (result.updatedClaimIds.length > 0) {
      addToast('Payments Posted', `${result.updatedClaimIds.length} claims moved to Paid`)
    }
    if (result.newDenials.length === 0 && result.updatedClaimIds.length === 0) {
      addToast('Clearinghouse Sync', 'No changes returned from TriZetto feed.')
    }
  }

  const handleCopyMasterFiles = (
    from: typeof currentDatabase,
    to: typeof currentDatabase,
    options: { payers: boolean; expectedRates: boolean; reasonCodes: boolean },
  ) => {
    copyMasterFiles(from, to, options, currentUser.name)
    addToast('Master Files Copied', `${from} → ${to}`)
  }

  const layout = (
    <div className="flex h-screen overflow-hidden">
      <Sidebar activeNav={activeNav} onNavigate={(nav) => setActiveNav(nav)} />
      <div className="flex flex-1 flex-col">
        <TopBar
          databases={metadata}
          currentDatabase={currentDatabase}
          onDatabaseChange={(next) => {
            setCurrentDatabase(next)
            setSelectedClaimId(null)
          }}
          currentUser={currentUser}
          notifications={notifications}
          onOpenNotifications={handleNotificationToggle}
        />
        <main className="relative flex-1 overflow-y-auto bg-slate-100/80 px-6 py-6">
            {activeNav === 'dashboard' && (
              <DashboardView claims={database.claims} notifications={notifications} auditLogs={auditLogs} />
            )}
          {activeNav === 'billing' && (
            <BillingClaimsView
              claims={database.claims}
              payers={database.payers}
              users={users}
              selectedClaimId={selectedClaimId ?? undefined}
              onSelectClaim={(claim) => setSelectedClaimId(claim.id)}
              landingNotesSummary={intakeSummary}
            />
          )}
          {activeNav === 'denials' && (
            <DenialsQueueView
              databaseId={currentDatabase}
              denials={database.denials}
              users={users}
              payers={database.payers}
              reasonCodes={database.reasonCodes}
              routingRules={routingRules}
              onStatusChange={(denialId, status) => {
                updateDenialStatus(currentDatabase, denialId, status, currentUser.name)
                addToast('Denial Updated', `${denialId} → ${status}`)
              }}
            />
          )}
          {activeNav === 'analytics' && (
            <AnalyticsView claims={database.claims} denials={database.denials} payers={database.payers} users={users} />
          )}
          {activeNav === 'admin' && (
            <AdminView
              databaseId={currentDatabase}
              databases={databases}
              users={users}
              auditLogs={auditLogs}
              clearinghouse={clearinghouse}
              onAddExpectedRate={(payload) => {
                addExpectedRate(currentDatabase, payload)
                addToast('Expected Rate Added', `${payload.payerId} • CPT ${payload.cpt}`)
              }}
              onUpdateExpectedRate={(rate) => {
                updateExpectedRate(currentDatabase, rate)
                addToast('Expected Rate Updated', `${rate.payerId} • CPT ${rate.cpt}`)
              }}
              onCopyMasterFiles={(from, to, options) => handleCopyMasterFiles(from, to, options)}
              onSimulateClearinghouse={handleSimulate}
            />
          )}
        </main>
      </div>
      <NotificationPanel
        notifications={notifications}
        open={notificationPanelOpen}
        onClose={() => setNotificationPanelOpen(false)}
        onDismiss={dismissNotification}
      />
      {selectedClaim && (
        <ClaimDetailDrawer
          claim={selectedClaim}
          databaseId={currentDatabase}
          onClose={() => setSelectedClaimId(null)}
          payers={database.payers}
          users={users}
          expectedRates={database.expectedRates}
          reasonCodes={database.reasonCodes}
          onUploadEob={(file) => uploadEobDocument(currentDatabase, selectedClaim.id, { ...file, uploadedAt: new Date().toISOString() })}
          onCheckEligibility={() => performEligibilityCheck(currentDatabase, selectedClaim.id)}
          onReassign={(userId) => updateClaimAssignment(currentDatabase, selectedClaim.id, userId)}
        />
      )}
      <ToastStack toasts={toasts} onDismiss={handleDismissToast} />
    </div>
  )

  if (mode === 'landing') {
    return (
      <>
        <LandingScreen
          notes={landingNotes}
          onNoteChange={(field, value) => updateLandingNote(field, value)}
          onGenerate={handleGenerate}
          onViewTasks={handleViewTasks}
        />
        <ToastStack toasts={toasts} onDismiss={handleDismissToast} />
      </>
    )
  }

  return layout
}

export default App
