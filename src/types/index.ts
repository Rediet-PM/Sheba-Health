export type DatabaseKey = 'mainHospital' | 'imagingCenter' | 'obgynClinic'

export interface DatabaseMeta {
  id: DatabaseKey
  name: string
}

export type UserRole = 'Executive' | 'Billing Specialist' | 'Denial Specialist' | 'Read-Only'

export interface User {
  id: string
  name: string
  role: UserRole
  title?: string
  databases: DatabaseKey[]
  avatarColor: string
}

export type ClaimStatus = 'Submitted' | 'In Process' | 'Paid' | 'Denied' | 'Underpaid'

export interface ClaimLineItem {
  id: string
  cpt: string
  description: string
  charge: number
  expectedAllowed: number
  paidAmount: number
  denialCode?: string
}

export type AuthorizationStatus = 'Approved' | 'Pending' | 'Missing'

export interface AuthorizationInfo {
  status: AuthorizationStatus
  authNumber?: string
  notes?: string
}

export type EligibilityStatus = 'Eligible' | 'Not Eligible' | 'Needs Review'

export interface EligibilityCheck {
  status: EligibilityStatus
  checkedAt: string
  details: string
}

export interface EobDocument {
  fileName: string
  fileUrl: string
  uploadedAt: string
}

export interface Claim {
  id: string
  databaseId: DatabaseKey
  patient: string
  payerId: string
  totalCharge: number
  expectedAllowed: number
  paidAmount: number
  status: ClaimStatus
  daysInAR: number
  assignedToUserId: string
  hasDenial: boolean
  serviceDate: string
  createdAt: string
  lineItems: ClaimLineItem[]
  authorization: AuthorizationInfo
  eligibility?: EligibilityCheck
  eobDocument?: EobDocument
}

export type DenialStatus = 'New' | 'In Progress' | 'Appealed' | 'Closed'
export type DenialPriority = 'High' | 'Medium' | 'Low'
export type DenialCategory = 'CO' | 'PR' | 'OA'
export type WorkItemType = 'Denial' | 'Underpayment'

export interface Denial {
  id: string
  claimId: string
  databaseId: DatabaseKey
  payerId: string
  code: string
  reason: string
  category: DenialCategory
  amountAtRisk: number
  daysInAR: number
  assignedToUserId: string
  status: DenialStatus
  priority: DenialPriority
  type: WorkItemType
  createdAt: string
  notes?: string
}

export interface ExpectedRate {
  id: string
  databaseId: DatabaseKey
  payerId: string
  cpt: string
  expectedAllowed: number
  effectiveDate: string
}

export interface Payer {
  id: string
  name: string
  clearinghouse: string
}

export interface ReasonCode {
  id: string
  code: string
  description: string
  category: DenialCategory
}

export type NotificationType = 'Denial' | 'Underpayment'

export interface Notification {
  id: string
  databaseId: DatabaseKey
  type: NotificationType
  message: string
  details: string
  createdAt: string
  read: boolean
  assignedToUserId?: string
  amount?: number
}

export type AuditEntityType = 'Claim' | 'Denial' | 'Expected Rate' | 'User' | 'Rule' | 'Notification'
export type AuditActorType = 'User' | 'System'

export interface AuditLogEntry {
  id: string
  timestamp: string
  actorType: AuditActorType
  actorName: string
  action: string
  entityType: AuditEntityType
  entityId: string
  details: string
  databaseId: DatabaseKey
}

export interface DenialRoutingRule {
  id: string
  name: string
  payerIds?: string[]
  denialCodes?: string[]
  minAmount?: number
  assignmentUserId: string
  priority?: DenialPriority
}

export interface DatabaseState {
  claims: Claim[]
  denials: Denial[]
  payers: Payer[]
  expectedRates: ExpectedRate[]
  reasonCodes: ReasonCode[]
}

export interface ClearinghouseConfig {
  active: string
  available: string[]
}

export interface AppBootstrapData {
  databases: Record<DatabaseKey, DatabaseState>
  metadata: DatabaseMeta[]
  users: User[]
  routingRules: DenialRoutingRule[]
  clearinghouse: ClearinghouseConfig
  auditLogs: AuditLogEntry[]
}
