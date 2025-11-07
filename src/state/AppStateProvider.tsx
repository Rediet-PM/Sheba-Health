import { createContext, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { getBootstrapData } from '../data/mockData'
import type {
  AppBootstrapData,
  AuditLogEntry,
  Claim,
  ClaimStatus,
  ClearinghouseConfig,
  DatabaseKey,
  DatabaseMeta,
  DatabaseState,
  Denial,
  DenialRoutingRule,
  EligibilityCheck,
  EobDocument,
  ExpectedRate,
  Notification,
  NotificationType,
  Payer,
  ReasonCode,
  User,
} from '../types'
import { formatCurrency } from '../utils/format'

type LandingField = 'doctorNote' | 'referralNote'

export interface LandingNotes {
  doctorNote: string
  referralNote: string
}

export type AppNavKey = 'dashboard' | 'billing' | 'denials' | 'analytics' | 'admin'

export interface SimulationResult {
  updatedClaimIds: string[]
  newDenials: Denial[]
  affectedDatabase: DatabaseKey
  message: string
}

interface AppState extends AppBootstrapData {
  currentDatabase: DatabaseKey
  currentUserId: string
  notifications: Notification[]
}

interface AppStateContextValue {
  currentDatabase: DatabaseKey
  metadata: DatabaseMeta[]
  users: User[]
  routingRules: DenialRoutingRule[]
  clearinghouse: ClearinghouseConfig
  notifications: Notification[]
  auditLogs: AuditLogEntry[]
  databases: Record<DatabaseKey, DatabaseState>
  currentUser: User
  landingNotes: LandingNotes
  setCurrentDatabase: (databaseId: DatabaseKey) => void
  setCurrentUser: (userId: string) => void
  markNotificationsRead: () => void
  dismissNotification: (notificationId: string) => void
  updateLandingNote: (field: LandingField, value: string) => void
  resetLandingNotes: () => void
  performEligibilityCheck: (databaseId: DatabaseKey, claimId: string) => EligibilityCheck
  uploadEobDocument: (databaseId: DatabaseKey, claimId: string, document: EobDocument) => void
  addExpectedRate: (databaseId: DatabaseKey, payload: Omit<ExpectedRate, 'id' | 'databaseId'> & { payerId: string }) => ExpectedRate
  updateExpectedRate: (databaseId: DatabaseKey, rate: ExpectedRate) => void
  copyMasterFiles: (
    fromDatabase: DatabaseKey,
    toDatabase: DatabaseKey,
    options: { payers: boolean; expectedRates: boolean; reasonCodes: boolean },
    actorName: string,
  ) => void
  simulateClearinghouseFeed: () => SimulationResult
  updateDenialStatus: (databaseId: DatabaseKey, denialId: string, status: Denial['status'], actorName: string) => void
  updateClaimAssignment: (databaseId: DatabaseKey, claimId: string, userId: string) => void
}

const AppStateContext = createContext<AppStateContextValue | undefined>(undefined)

const createId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 8)}`

const landingDefaults: LandingNotes = {
  doctorNote: '',
  referralNote: '',
}

const routeDenial = (denial: Denial, routingRules: DenialRoutingRule[]): Denial => {
  const matchedRule = routingRules.find((rule) => {
    const payerMatch = !rule.payerIds || rule.payerIds.includes(denial.payerId)
    const codeMatch = !rule.denialCodes || rule.denialCodes.includes(denial.code)
    const amountMatch = rule.minAmount === undefined || denial.amountAtRisk >= rule.minAmount
    return payerMatch && codeMatch && amountMatch
  })

  if (matchedRule) {
    return {
      ...denial,
      assignedToUserId: matchedRule.assignmentUserId,
      priority: matchedRule.priority ?? denial.priority,
    }
  }

  return denial
}

const getUserById = (users: User[], id: string): User | undefined => users.find((user) => user.id === id)

export const AppStateProvider = ({ children }: { children: ReactNode }) => {
  const bootstrap = useMemo<AppBootstrapData>(() => getBootstrapData(), [])

  const [state, setState] = useState<AppState>({
    ...bootstrap,
    currentDatabase: 'mainHospital',
    currentUserId: bootstrap.users[0]?.id ?? 'executive-monica',
    notifications: [],
  })
  const [landingNotes, setLandingNotes] = useState<LandingNotes>(landingDefaults)

  const setCurrentDatabase = (databaseId: DatabaseKey) => {
    setState((prev) => ({ ...prev, currentDatabase: databaseId }))
  }

  const setCurrentUser = (userId: string) => {
    setState((prev) => ({ ...prev, currentUserId: userId }))
  }

  const markNotificationsRead = () => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((notification) => ({ ...notification, read: true })),
    }))
  }

  const dismissNotification = (notificationId: string) => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.filter((notification) => notification.id !== notificationId),
    }))
  }

  const updateLandingNote = (field: LandingField, value: string) => {
    setLandingNotes((prev) => ({ ...prev, [field]: value }))
  }

  const resetLandingNotes = () => setLandingNotes(landingDefaults)

  const pushAuditLog = (entry: AuditLogEntry) => {
    setState((prev) => ({
      ...prev,
      auditLogs: [...prev.auditLogs, entry],
    }))
  }

  const createNotification = (
    databaseId: DatabaseKey,
    type: NotificationType,
    message: string,
    details: string,
    assignedToUserId?: string,
    amount?: number,
  ): Notification => ({
    id: createId('NT'),
    databaseId,
    type,
    message,
    details,
    createdAt: new Date().toISOString(),
    read: false,
    assignedToUserId,
    amount,
  })

  const updateClaimState = (
    databaseId: DatabaseKey,
    claimId: string,
    updater: (claim: Claim) => Claim,
  ): { updatedClaim: Claim | undefined } => {
    let updatedClaim: Claim | undefined
    setState((prev) => {
      const database = prev.databases[databaseId]
      if (!database) {
        return prev
      }
      const claims = database.claims.map((claim) => {
        if (claim.id === claimId) {
          updatedClaim = updater(claim)
          return updatedClaim
        }
        return claim
      })
      return {
        ...prev,
        databases: {
          ...prev.databases,
          [databaseId]: {
            ...database,
            claims,
          },
        },
      }
    })
    return { updatedClaim }
  }

  const performEligibilityCheck = (databaseId: DatabaseKey, claimId: string): EligibilityCheck => {
    const outcomes: EligibilityCheck[] = [
      {
        status: 'Eligible',
        checkedAt: new Date().toISOString(),
        details: 'Active coverage through 12/31/2025. Copay $50. Auth required for MRI services.',
      },
      {
        status: 'Needs Review',
        checkedAt: new Date().toISOString(),
        details: 'Plan shows coordination of benefits pending. Contact payer to confirm primary coverage.',
      },
      {
        status: 'Not Eligible',
        checkedAt: new Date().toISOString(),
        details: 'Coverage termed as of 09/30/2025. Patient advised to contact employer HR.',
      },
    ]
    const result = outcomes[Math.floor(Math.random() * outcomes.length)]
    const { updatedClaim } = updateClaimState(databaseId, claimId, (claim) => ({
      ...claim,
      eligibility: result,
    }))
    if (updatedClaim) {
      pushAuditLog({
        id: createId('AL'),
        timestamp: result.checkedAt,
        actorType: 'User',
        actorName: getUserById(state.users, state.currentUserId)?.name ?? 'Unknown User',
        action: `Eligibility checked (${result.status})`,
        entityType: 'Claim',
        entityId: claimId,
        details: result.details,
        databaseId,
      })
    }
    return result
  }

  const uploadEobDocument = (databaseId: DatabaseKey, claimId: string, document: EobDocument) => {
    const stampedDocument = { ...document, uploadedAt: new Date().toISOString() }
    const { updatedClaim } = updateClaimState(databaseId, claimId, (claim) => ({
      ...claim,
      eobDocument: stampedDocument,
    }))
    if (updatedClaim) {
      pushAuditLog({
        id: createId('AL'),
        timestamp: stampedDocument.uploadedAt,
        actorType: 'User',
        actorName: getUserById(state.users, state.currentUserId)?.name ?? 'Unknown User',
        action: 'Uploaded digital EOB',
        entityType: 'Claim',
        entityId: claimId,
        details: `Document ${document.fileName} attached`,
        databaseId,
      })
    }
  }

  const addExpectedRate = (
    databaseId: DatabaseKey,
    payload: Omit<ExpectedRate, 'id' | 'databaseId'> & { payerId: string },
  ): ExpectedRate => {
    const rate: ExpectedRate = {
      id: createId('ER'),
      databaseId,
      payerId: payload.payerId,
      cpt: payload.cpt,
      expectedAllowed: payload.expectedAllowed,
      effectiveDate: payload.effectiveDate,
    }
    setState((prev) => {
      const database = prev.databases[databaseId]
      return {
        ...prev,
        databases: {
          ...prev.databases,
          [databaseId]: {
            ...database,
            expectedRates: [...database.expectedRates, rate],
          },
        },
      }
    })
    pushAuditLog({
      id: createId('AL'),
      timestamp: new Date().toISOString(),
      actorType: 'User',
      actorName: getUserById(state.users, state.currentUserId)?.name ?? 'Unknown User',
      action: 'Added expected rate',
      entityType: 'Expected Rate',
      entityId: rate.id,
      details: `${payload.payerId} • CPT ${payload.cpt} → ${formatCurrency(payload.expectedAllowed)}`,
      databaseId,
    })
    return rate
  }

  const updateExpectedRate = (databaseId: DatabaseKey, rate: ExpectedRate) => {
    setState((prev) => {
      const database = prev.databases[databaseId]
      return {
        ...prev,
        databases: {
          ...prev.databases,
          [databaseId]: {
            ...database,
            expectedRates: database.expectedRates.map((item) => (item.id === rate.id ? rate : item)),
          },
        },
      }
    })

    pushAuditLog({
      id: createId('AL'),
      timestamp: new Date().toISOString(),
      actorType: 'User',
      actorName: getUserById(state.users, state.currentUserId)?.name ?? 'Unknown User',
      action: 'Updated expected rate',
      entityType: 'Expected Rate',
      entityId: rate.id,
      details: `${rate.payerId} • CPT ${rate.cpt} now ${formatCurrency(rate.expectedAllowed)}`,
      databaseId,
    })
  }

  const uniqueById = <T extends { id: string }>(items: T[]): T[] => {
    const seen = new Set<string>()
    const output: T[] = []
    items.forEach((item) => {
      if (!seen.has(item.id)) {
        seen.add(item.id)
        output.push(item)
      }
    })
    return output
  }

  const copyMasterFiles = (
    fromDatabase: DatabaseKey,
    toDatabase: DatabaseKey,
    options: { payers: boolean; expectedRates: boolean; reasonCodes: boolean },
    actorName: string,
  ) => {
    if (fromDatabase === toDatabase) return

    setState((prev) => {
      const fromDb = prev.databases[fromDatabase]
      const toDb = prev.databases[toDatabase]
      const updated: DatabaseState = { ...toDb }

      if (options.payers) {
        updated.payers = uniqueById<Payer>([...toDb.payers, ...fromDb.payers])
      }
      if (options.expectedRates) {
        updated.expectedRates = uniqueById<ExpectedRate>([
          ...toDb.expectedRates,
          ...fromDb.expectedRates.map((rate) => ({ ...rate, databaseId: toDatabase })),
        ])
      }
      if (options.reasonCodes) {
        updated.reasonCodes = uniqueById<ReasonCode>([...toDb.reasonCodes, ...fromDb.reasonCodes])
      }

      return {
        ...prev,
        databases: {
          ...prev.databases,
          [toDatabase]: updated,
        },
      }
    })

    pushAuditLog({
      id: createId('AL'),
      timestamp: new Date().toISOString(),
      actorType: 'User',
      actorName,
      action: 'Copied master files',
      entityType: 'Expected Rate',
      entityId: `${fromDatabase}->${toDatabase}`,
      details: `Copied ${[
        options.payers ? 'Payers' : null,
        options.expectedRates ? 'Expected Rates' : null,
        options.reasonCodes ? 'Reason Codes' : null,
      ]
        .filter(Boolean)
        .join(', ')}`,
      databaseId: toDatabase,
    })
  }

  const updateClaimAssignment = (databaseId: DatabaseKey, claimId: string, userId: string) => {
    const assignee = getUserById(state.users, userId)
    if (!assignee) return

    const { updatedClaim } = updateClaimState(databaseId, claimId, (claim) => ({
      ...claim,
      assignedToUserId: userId,
    }))

    if (updatedClaim) {
      pushAuditLog({
        id: createId('AL'),
        timestamp: new Date().toISOString(),
        actorType: 'User',
        actorName: getUserById(state.users, state.currentUserId)?.name ?? 'Unknown User',
        action: `Claim reassigned to ${assignee.name}`,
        entityType: 'Claim',
        entityId: claimId,
        details: `Assignment changed to ${assignee.name}`,
        databaseId,
      })
    }
  }

  const updateDenialStatus = (
    databaseId: DatabaseKey,
    denialId: string,
    status: Denial['status'],
    actorName: string,
  ) => {
    setState((prev) => {
      const database = prev.databases[databaseId]
      const denials = database.denials.map((denial) =>
        denial.id === denialId
          ? {
              ...denial,
              status,
            }
          : denial,
      )
      return {
        ...prev,
        databases: {
          ...prev.databases,
          [databaseId]: {
            ...database,
            denials,
          },
        },
      }
    })

    pushAuditLog({
      id: createId('AL'),
      timestamp: new Date().toISOString(),
      actorType: 'User',
      actorName,
      action: `Updated denial status to ${status}`,
      entityType: 'Denial',
      entityId: denialId,
      details: 'Status change from work queue',
      databaseId,
    })
  }

  const simulateClearinghouseFeed = (): SimulationResult => {
    const databaseId = state.currentDatabase
    const randomSlice = <T,>(items: T[], count: number) =>
      items
        .map((item) => ({ sort: Math.random(), item }))
        .sort((a, b) => a.sort - b.sort)
        .slice(0, count)
        .map((x) => x.item)

    const updatedClaimIds: string[] = []
    const newDenials: Denial[] = []

    setState((prev) => {
      const liveDatabase = prev.databases[databaseId]
      const claimsCopy = [...liveDatabase.claims]
      const denialsCopy = [...liveDatabase.denials]
      const notificationsCopy = [...prev.notifications]
      const auditCopy = [...prev.auditLogs]

        const payableClaims = claimsCopy.filter((claim) => ['Submitted', 'In Process'].includes(claim.status))
        const claimsToPay = randomSlice(payableClaims, Math.min(2, payableClaims.length))

        claimsToPay.forEach((claim) => {
          const paidClaim: Claim = {
            ...claim,
            status: 'Paid' as ClaimStatus,
            paidAmount: claim.expectedAllowed,
            daysInAR: Math.max(0, claim.daysInAR - 5),
            hasDenial: false,
          }
          const index = claimsCopy.findIndex((item) => item.id === claim.id)
          claimsCopy[index] = paidClaim
          updatedClaimIds.push(claim.id)
          auditCopy.push({
            id: createId('AL'),
            timestamp: new Date().toISOString(),
            actorType: 'System',
            actorName: 'TriZetto Feed',
            action: 'Marked claim as Paid',
            entityType: 'Claim',
            entityId: claim.id,
            details: 'Electronic remittance posted via clearinghouse feed',
            databaseId,
          })
        })

        const denialCandidates = claimsCopy.filter((claim) => claim.status !== 'Denied' && claim.status !== 'Paid')
        const newDenialTargets = randomSlice(denialCandidates, Math.min(2, denialCandidates.length))

        newDenialTargets.forEach((claim) => {
        const denialAmount = Math.round(claim.expectedAllowed * 0.85)
        const baseDenial: Denial = {
          id: createId('DN'),
          claimId: claim.id,
          databaseId,
          payerId: claim.payerId,
          code: Math.random() > 0.5 ? 'CO 50' : 'CO 197',
          reason:
            Math.random() > 0.5
              ? 'Clearinghouse received denial - additional documentation required'
              : 'Clearinghouse flagged missing authorization detail',
          category: 'CO',
          amountAtRisk: denialAmount,
          daysInAR: claim.daysInAR + 1,
          assignedToUserId: claim.assignedToUserId,
          status: 'New',
          priority: denialAmount > 1200 ? 'High' : 'Medium',
          type: 'Denial',
          createdAt: new Date().toISOString(),
        }
        const routed = routeDenial(baseDenial, prev.routingRules)
        newDenials.push(routed)
        denialsCopy.push(routed)
        const claimIndex = claimsCopy.findIndex((item) => item.id === claim.id)
        claimsCopy[claimIndex] = {
          ...claimsCopy[claimIndex],
          status: 'Denied' as ClaimStatus,
          hasDenial: true,
          paidAmount: 0,
        }

        const assignedUser = getUserById(prev.users, routed.assignedToUserId ?? '')
        const payerName = liveDatabase.payers.find((payer) => payer.id === routed.payerId)?.name ?? routed.payerId
        const notificationMessage = `New denial assigned to ${assignedUser?.name ?? 'AR Queue'} (${payerName})`
        const notificationDetails = `${payerName} • ${formatCurrency(routed.amountAtRisk)} at risk`
        const notification = createNotification(
          databaseId,
          'Denial',
          notificationMessage,
          notificationDetails,
          routed.assignedToUserId,
          routed.amountAtRisk,
        )
        notificationsCopy.unshift(notification)
        auditCopy.push({
          id: createId('AL'),
          timestamp: routed.createdAt,
          actorType: 'System',
          actorName: 'TriZetto Feed',
          action: `Auto-created denial (${routed.code})`,
          entityType: 'Denial',
          entityId: routed.id,
          details: `${payerName} → ${assignedUser?.name ?? 'AR Queue'}`,
          databaseId,
        })
      })

      return {
        ...prev,
        databases: {
          ...prev.databases,
          [databaseId]: {
            ...liveDatabase,
            claims: claimsCopy,
            denials: denialsCopy,
          },
        },
        notifications: notificationsCopy,
        auditLogs: auditCopy,
      }
    })

    return {
      affectedDatabase: databaseId,
      updatedClaimIds,
      newDenials,
      message:
        updatedClaimIds.length === 0 && newDenials.length === 0
          ? 'No changes returned from TriZetto feed.'
          : `TriZetto feed processed ${updatedClaimIds.length} payments and ${newDenials.length} new denials.`,
    }
  }

  const value: AppStateContextValue = {
    currentDatabase: state.currentDatabase,
    metadata: state.metadata,
    users: state.users,
    routingRules: state.routingRules,
    clearinghouse: state.clearinghouse,
    notifications: state.notifications,
    auditLogs: state.auditLogs,
    databases: state.databases,
    currentUser: getUserById(state.users, state.currentUserId) ?? state.users[0],
    landingNotes,
    setCurrentDatabase,
    setCurrentUser,
    markNotificationsRead,
    dismissNotification,
    updateLandingNote,
    resetLandingNotes,
    performEligibilityCheck,
    uploadEobDocument,
    addExpectedRate,
    updateExpectedRate,
    copyMasterFiles,
    simulateClearinghouseFeed,
    updateDenialStatus,
    updateClaimAssignment,
  }

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}

export const useAppState = () => {
  const context = useContext(AppStateContext)
  if (!context) {
    throw new Error('useAppState must be used within AppStateProvider')
  }
  return context
}
