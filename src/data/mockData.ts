import type {
  AppBootstrapData,
  AuditLogEntry,
  Claim,
  ClaimStatus,
  DatabaseKey,
  DatabaseMeta,
  DatabaseState,
  Denial,
  DenialRoutingRule,
  ExpectedRate,
  Payer,
  ReasonCode,
  User,
} from '../types'

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value))

const databaseMetadata: DatabaseMeta[] = [
  { id: 'mainHospital', name: 'Main Hospital' },
  { id: 'imagingCenter', name: 'Imaging Center' },
  { id: 'obgynClinic', name: 'OB/GYN Clinic' },
]

const users: User[] = [
  {
    id: 'executive-monica',
    name: 'Monica Patel',
    role: 'Executive',
    title: 'VP, Revenue Cycle',
    databases: ['mainHospital', 'imagingCenter', 'obgynClinic'],
    avatarColor: 'bg-sky-500',
  },
  {
    id: 'billing-amy',
    name: 'Amy Walters',
    role: 'Billing Specialist',
    title: 'Senior Billing Lead',
    databases: ['mainHospital', 'imagingCenter'],
    avatarColor: 'bg-emerald-500',
  },
  {
    id: 'billing-sanjay',
    name: 'Sanjay Iyer',
    role: 'Billing Specialist',
    title: 'Charge Entry Supervisor',
    databases: ['imagingCenter', 'obgynClinic'],
    avatarColor: 'bg-indigo-500',
  },
  {
    id: 'denial-lisa',
    name: 'Lisa Chen',
    role: 'Denial Specialist',
    title: 'Aetna Denials Lead',
    databases: ['mainHospital', 'imagingCenter'],
    avatarColor: 'bg-rose-500',
  },
  {
    id: 'denial-tom',
    name: 'Tom Greene',
    role: 'Denial Specialist',
    title: 'BCBS AR',
    databases: ['mainHospital', 'obgynClinic'],
    avatarColor: 'bg-amber-500',
  },
  {
    id: 'auditor-danielle',
    name: 'Danielle Ortiz',
    role: 'Read-Only',
    title: 'Compliance Auditor',
    databases: ['mainHospital', 'obgynClinic'],
    avatarColor: 'bg-slate-500',
  },
]

const reasonCodesByDb: Record<DatabaseKey, ReasonCode[]> = {
  mainHospital: [
    { id: 'rc-co50', code: 'CO 50', description: 'Non-covered services / not deemed medically necessary', category: 'CO' },
    { id: 'rc-co197', code: 'CO 197', description: 'Precertification/authorization/notification absent', category: 'CO' },
    { id: 'rc-pr1', code: 'PR 1', description: 'Deductible amount', category: 'PR' },
    { id: 'rc-oa23', code: 'OA 23', description: 'Impact of prior payer adjudication', category: 'OA' },
    { id: 'rc-co45', code: 'CO 45', description: 'Charge exceeds contract/maximum allowable', category: 'CO' },
  ],
  imagingCenter: [
    { id: 'rc-co50', code: 'CO 50', description: 'Non-covered services / not deemed medically necessary', category: 'CO' },
    { id: 'rc-co197', code: 'CO 197', description: 'Precertification/authorization/notification absent', category: 'CO' },
    { id: 'rc-pr1', code: 'PR 1', description: 'Deductible amount', category: 'PR' },
    { id: 'rc-oa23', code: 'OA 23', description: 'Impact of prior payer adjudication', category: 'OA' },
    { id: 'rc-co45', code: 'CO 45', description: 'Charge exceeds contract/maximum allowable', category: 'CO' },
  ],
  obgynClinic: [
    { id: 'rc-co50', code: 'CO 50', description: 'Non-covered services / not deemed medically necessary', category: 'CO' },
    { id: 'rc-co197', code: 'CO 197', description: 'Precertification/authorization/notification absent', category: 'CO' },
    { id: 'rc-pr1', code: 'PR 1', description: 'Deductible amount', category: 'PR' },
    { id: 'rc-oa23', code: 'OA 23', description: 'Impact of prior payer adjudication', category: 'OA' },
    { id: 'rc-co45', code: 'CO 45', description: 'Charge exceeds contract/maximum allowable', category: 'CO' },
  ],
}

const payersByDb: Record<DatabaseKey, Payer[]> = {
  mainHospital: [
    { id: 'aetna', name: 'Aetna', clearinghouse: 'TriZetto' },
    { id: 'bcbs', name: 'Blue Cross Blue Shield', clearinghouse: 'TriZetto' },
    { id: 'uhc', name: 'United Healthcare', clearinghouse: 'Change Healthcare' },
    { id: 'medicare', name: 'Medicare', clearinghouse: 'Availity' },
  ],
  imagingCenter: [
    { id: 'aetna', name: 'Aetna', clearinghouse: 'TriZetto' },
    { id: 'bcbs', name: 'Blue Cross Blue Shield', clearinghouse: 'TriZetto' },
    { id: 'cigna', name: 'Cigna', clearinghouse: 'Change Healthcare' },
    { id: 'kaiser', name: 'Kaiser Permanente', clearinghouse: 'Availity' },
  ],
  obgynClinic: [
    { id: 'aetna', name: 'Aetna', clearinghouse: 'TriZetto' },
    { id: 'bcbs', name: 'Blue Cross Blue Shield', clearinghouse: 'TriZetto' },
    { id: 'medicare', name: 'Medicare', clearinghouse: 'Availity' },
    { id: 'uhc', name: 'United Healthcare', clearinghouse: 'Change Healthcare' },
  ],
}

const expectedRatesByDb: Record<DatabaseKey, ExpectedRate[]> = {
  mainHospital: [
    { id: 'er-mh-72148', databaseId: 'mainHospital', payerId: 'aetna', cpt: '72148', expectedAllowed: 5500, effectiveDate: '2025-01-01' },
    { id: 'er-mh-99214', databaseId: 'mainHospital', payerId: 'aetna', cpt: '99214', expectedAllowed: 1300, effectiveDate: '2025-01-01' },
    { id: 'er-mh-27447', databaseId: 'mainHospital', payerId: 'bcbs', cpt: '27447', expectedAllowed: 4100, effectiveDate: '2024-07-01' },
    { id: 'er-mh-29881', databaseId: 'mainHospital', payerId: 'uhc', cpt: '29881', expectedAllowed: 1800, effectiveDate: '2024-09-01' },
    { id: 'er-mh-93000', databaseId: 'mainHospital', payerId: 'medicare', cpt: '93000', expectedAllowed: 120, effectiveDate: '2025-02-01' },
  ],
  imagingCenter: [
    { id: 'er-im-70553', databaseId: 'imagingCenter', payerId: 'aetna', cpt: '70553', expectedAllowed: 2200, effectiveDate: '2024-08-01' },
    { id: 'er-im-77067', databaseId: 'imagingCenter', payerId: 'cigna', cpt: '77067', expectedAllowed: 320, effectiveDate: '2025-01-15' },
    { id: 'er-im-70496', databaseId: 'imagingCenter', payerId: 'bcbs', cpt: '70496', expectedAllowed: 1500, effectiveDate: '2024-10-01' },
    { id: 'er-im-71275', databaseId: 'imagingCenter', payerId: 'kaiser', cpt: '71275', expectedAllowed: 2400, effectiveDate: '2024-12-01' },
  ],
  obgynClinic: [
    { id: 'er-ob-76805', databaseId: 'obgynClinic', payerId: 'aetna', cpt: '76805', expectedAllowed: 650, effectiveDate: '2025-02-01' },
    { id: 'er-ob-59400', databaseId: 'obgynClinic', payerId: 'medicare', cpt: '59400', expectedAllowed: 900, effectiveDate: '2024-06-01' },
    { id: 'er-ob-58661', databaseId: 'obgynClinic', payerId: 'bcbs', cpt: '58661', expectedAllowed: 1400, effectiveDate: '2025-01-10' },
    { id: 'er-ob-58150', databaseId: 'obgynClinic', payerId: 'uhc', cpt: '58150', expectedAllowed: 1600, effectiveDate: '2024-09-01' },
  ],
}

const claimSeeds: Record<DatabaseKey, Claim[]> = {
  mainHospital: [
    {
      id: 'MH-1001',
      databaseId: 'mainHospital',
      patient: 'Elena Morris',
      payerId: 'aetna',
      totalCharge: 7300,
      expectedAllowed: 6800,
      paidAmount: 6700,
      status: 'Paid',
      daysInAR: 18,
      assignedToUserId: 'billing-amy',
      hasDenial: false,
      serviceDate: '2025-10-12',
      createdAt: '2025-10-13T09:12:00Z',
      lineItems: [
        {
          id: 'MH-1001-1',
          cpt: '72148',
          description: 'MRI Lumbar Spine',
          charge: 5800,
          expectedAllowed: 5500,
          paidAmount: 5400,
        },
        {
          id: 'MH-1001-2',
          cpt: '99214',
          description: 'Established Office Visit',
          charge: 1500,
          expectedAllowed: 1300,
          paidAmount: 1300,
        },
      ],
      authorization: { status: 'Approved', authNumber: 'AUTH-A1234' },
    },
    {
      id: 'MH-1002',
      databaseId: 'mainHospital',
      patient: 'Jordan Michaels',
      payerId: 'bcbs',
      totalCharge: 5100,
      expectedAllowed: 4500,
      paidAmount: 3600,
      status: 'Underpaid',
      daysInAR: 42,
      assignedToUserId: 'denial-tom',
      hasDenial: true,
      serviceDate: '2025-09-19',
      createdAt: '2025-09-20T14:04:00Z',
      lineItems: [
        {
          id: 'MH-1002-1',
          cpt: '27447',
          description: 'Total Knee Arthroplasty',
          charge: 3600,
          expectedAllowed: 3200,
          paidAmount: 2600,
        },
        {
          id: 'MH-1002-2',
          cpt: '97110',
          description: 'Physical Therapy',
          charge: 1500,
          expectedAllowed: 1300,
          paidAmount: 1000,
        },
      ],
      authorization: { status: 'Pending', authNumber: 'AUTH-P7788', notes: 'Payer requested additional notes' },
    },
    {
      id: 'MH-1003',
      databaseId: 'mainHospital',
      patient: 'Connor James',
      payerId: 'aetna',
      totalCharge: 5200,
      expectedAllowed: 5200,
      paidAmount: 0,
      status: 'Denied',
      daysInAR: 27,
      assignedToUserId: 'denial-lisa',
      hasDenial: true,
      serviceDate: '2025-10-05',
      createdAt: '2025-10-06T11:35:00Z',
      lineItems: [
        {
          id: 'MH-1003-1',
          cpt: '63650',
          description: 'Percutaneous Implantation, Neurostimulator',
          charge: 5200,
          expectedAllowed: 5200,
          paidAmount: 0,
          denialCode: 'CO 197',
        },
      ],
      authorization: { status: 'Missing', notes: 'Authorization not located in chart' },
    },
    {
      id: 'MH-1004',
      databaseId: 'mainHospital',
      patient: 'Alicia Navarro',
      payerId: 'medicare',
      totalCharge: 2600,
      expectedAllowed: 2500,
      paidAmount: 2500,
      status: 'Paid',
      daysInAR: 15,
      assignedToUserId: 'billing-amy',
      hasDenial: false,
      serviceDate: '2025-10-22',
      createdAt: '2025-10-23T10:15:00Z',
      lineItems: [
        {
          id: 'MH-1004-1',
          cpt: '27447',
          description: 'Total Knee Arthroplasty',
          charge: 2600,
          expectedAllowed: 2500,
          paidAmount: 2500,
        },
      ],
      authorization: { status: 'Approved', authNumber: 'AUTH-MED-8891' },
    },
    {
      id: 'MH-1005',
      databaseId: 'mainHospital',
      patient: 'Zoe Matthias',
      payerId: 'bcbs',
      totalCharge: 3200,
      expectedAllowed: 3100,
      paidAmount: 2900,
      status: 'In Process',
      daysInAR: 33,
      assignedToUserId: 'billing-amy',
      hasDenial: false,
      serviceDate: '2025-09-27',
      createdAt: '2025-09-28T08:21:00Z',
      lineItems: [
        {
          id: 'MH-1005-1',
          cpt: '29881',
          description: 'Knee Arthroscopy',
          charge: 2200,
          expectedAllowed: 2000,
          paidAmount: 1900,
        },
        {
          id: 'MH-1005-2',
          cpt: '97140',
          description: 'Manual Therapy',
          charge: 1000,
          expectedAllowed: 1100,
          paidAmount: 1000,
        },
      ],
      authorization: { status: 'Approved', authNumber: 'AUTH-BCBS-5512' },
    },
    {
      id: 'MH-1006',
      databaseId: 'mainHospital',
      patient: 'Miguel Santos',
      payerId: 'uhc',
      totalCharge: 4300,
      expectedAllowed: 4100,
      paidAmount: 3800,
      status: 'In Process',
      daysInAR: 24,
      assignedToUserId: 'billing-amy',
      hasDenial: false,
      serviceDate: '2025-10-18',
      createdAt: '2025-10-19T13:44:00Z',
      lineItems: [
        {
          id: 'MH-1006-1',
          cpt: '29881',
          description: 'Arthroscopy, Knee, Meniscectomy',
          charge: 2300,
          expectedAllowed: 2100,
          paidAmount: 1900,
        },
        {
          id: 'MH-1006-2',
          cpt: '97110',
          description: 'Therapeutic Exercises',
          charge: 2000,
          expectedAllowed: 2000,
          paidAmount: 1900,
        },
      ],
      authorization: { status: 'Approved', authNumber: 'AUTH-UHC-4511' },
    },
  ],
  imagingCenter: [
    {
      id: 'IM-2001',
      databaseId: 'imagingCenter',
      patient: 'Janice Rowe',
      payerId: 'aetna',
      totalCharge: 2400,
      expectedAllowed: 2200,
      paidAmount: 2200,
      status: 'Paid',
      daysInAR: 11,
      assignedToUserId: 'billing-amy',
      hasDenial: false,
      serviceDate: '2025-10-10',
      createdAt: '2025-10-11T09:05:00Z',
      lineItems: [
        {
          id: 'IM-2001-1',
          cpt: '70553',
          description: 'MRI Brain with Contrast',
          charge: 2400,
          expectedAllowed: 2200,
          paidAmount: 2200,
        },
      ],
      authorization: { status: 'Approved', authNumber: 'AUTH-IM-AE-7782' },
    },
    {
      id: 'IM-2002',
      databaseId: 'imagingCenter',
      patient: 'Carlos Mendes',
      payerId: 'cigna',
      totalCharge: 1900,
      expectedAllowed: 1800,
      paidAmount: 0,
      status: 'Denied',
      daysInAR: 39,
      assignedToUserId: 'billing-sanjay',
      hasDenial: true,
      serviceDate: '2025-09-15',
      createdAt: '2025-09-16T12:17:00Z',
      lineItems: [
        {
          id: 'IM-2002-1',
          cpt: '77067',
          description: 'Screening Mammography',
          charge: 450,
          expectedAllowed: 320,
          paidAmount: 0,
          denialCode: 'CO 50',
        },
        {
          id: 'IM-2002-2',
          cpt: '77063',
          description: 'Add-on 3D Tomosynthesis',
          charge: 550,
          expectedAllowed: 450,
          paidAmount: 0,
          denialCode: 'CO 50',
        },
      ],
      authorization: { status: 'Pending', notes: 'Medical necessity review in progress' },
    },
    {
      id: 'IM-2003',
      databaseId: 'imagingCenter',
      patient: 'Layla Ahmed',
      payerId: 'bcbs',
      totalCharge: 1650,
      expectedAllowed: 1500,
      paidAmount: 1350,
      status: 'Underpaid',
      daysInAR: 28,
      assignedToUserId: 'denial-tom',
      hasDenial: true,
      serviceDate: '2025-10-03',
      createdAt: '2025-10-04T08:33:00Z',
      lineItems: [
        {
          id: 'IM-2003-1',
          cpt: '70496',
          description: 'CTA Neck with Contrast',
          charge: 1650,
          expectedAllowed: 1500,
          paidAmount: 1350,
        },
      ],
      authorization: { status: 'Approved', authNumber: 'AUTH-BCBS-NECK-441' },
    },
    {
      id: 'IM-2004',
      databaseId: 'imagingCenter',
      patient: 'Pranav Kulkarni',
      payerId: 'kaiser',
      totalCharge: 2600,
      expectedAllowed: 2400,
      paidAmount: 2550,
      status: 'Paid',
      daysInAR: 9,
      assignedToUserId: 'billing-sanjay',
      hasDenial: false,
      serviceDate: '2025-10-19',
      createdAt: '2025-10-20T10:28:00Z',
      lineItems: [
        {
          id: 'IM-2004-1',
          cpt: '71275',
          description: 'CTA Chest with Contrast',
          charge: 2600,
          expectedAllowed: 2400,
          paidAmount: 2550,
        },
      ],
      authorization: { status: 'Approved', authNumber: 'AUTH-KAI-7755' },
    },
    {
      id: 'IM-2005',
      databaseId: 'imagingCenter',
      patient: 'Beatrice Sloan',
      payerId: 'aetna',
      totalCharge: 2100,
      expectedAllowed: 1950,
      paidAmount: 1600,
      status: 'Underpaid',
      daysInAR: 31,
      assignedToUserId: 'denial-lisa',
      hasDenial: true,
      serviceDate: '2025-09-30',
      createdAt: '2025-10-01T15:12:00Z',
      lineItems: [
        {
          id: 'IM-2005-1',
          cpt: '70553',
          description: 'MRI Brain with Contrast',
          charge: 2100,
          expectedAllowed: 1950,
          paidAmount: 1600,
        },
      ],
      authorization: { status: 'Approved', authNumber: 'AUTH-AE-5561' },
    },
  ],
  obgynClinic: [
    {
      id: 'OB-3001',
      databaseId: 'obgynClinic',
      patient: 'Hannah Lee',
      payerId: 'aetna',
      totalCharge: 1450,
      expectedAllowed: 1300,
      paidAmount: 1300,
      status: 'Paid',
      daysInAR: 12,
      assignedToUserId: 'billing-sanjay',
      hasDenial: false,
      serviceDate: '2025-10-08',
      createdAt: '2025-10-09T09:40:00Z',
      lineItems: [
        {
          id: 'OB-3001-1',
          cpt: '76805',
          description: 'Obstetric Ultrasound, Greater than 14 weeks',
          charge: 1450,
          expectedAllowed: 1300,
          paidAmount: 1300,
        },
      ],
      authorization: { status: 'Approved', authNumber: 'AUTH-OB-AE-1911' },
    },
    {
      id: 'OB-3002',
      databaseId: 'obgynClinic',
      patient: 'Sierra Collins',
      payerId: 'medicare',
      totalCharge: 1000,
      expectedAllowed: 900,
      paidAmount: 810,
      status: 'Underpaid',
      daysInAR: 37,
      assignedToUserId: 'denial-tom',
      hasDenial: true,
      serviceDate: '2025-09-10',
      createdAt: '2025-09-11T11:11:00Z',
      lineItems: [
        {
          id: 'OB-3002-1',
          cpt: '59400',
          description: 'Routine Obstetric Care',
          charge: 1000,
          expectedAllowed: 900,
          paidAmount: 810,
        },
      ],
      authorization: { status: 'Pending', notes: 'Awaiting retro authorization update' },
    },
    {
      id: 'OB-3003',
      databaseId: 'obgynClinic',
      patient: 'Maria Alvarez',
      payerId: 'bcbs',
      totalCharge: 1500,
      expectedAllowed: 1400,
      paidAmount: 0,
      status: 'Denied',
      daysInAR: 22,
      assignedToUserId: 'denial-tom',
      hasDenial: true,
      serviceDate: '2025-10-14',
      createdAt: '2025-10-15T07:59:00Z',
      lineItems: [
        {
          id: 'OB-3003-1',
          cpt: '58661',
          description: 'Laparoscopy, Excision of Lesion',
          charge: 1500,
          expectedAllowed: 1400,
          paidAmount: 0,
          denialCode: 'CO 197',
        },
      ],
      authorization: { status: 'Missing', notes: 'Referral expired before DOS' },
    },
    {
      id: 'OB-3004',
      databaseId: 'obgynClinic',
      patient: 'Diana Brooks',
      payerId: 'uhc',
      totalCharge: 1700,
      expectedAllowed: 1600,
      paidAmount: 1500,
      status: 'In Process',
      daysInAR: 19,
      assignedToUserId: 'billing-sanjay',
      hasDenial: false,
      serviceDate: '2025-10-18',
      createdAt: '2025-10-19T10:51:00Z',
      lineItems: [
        {
          id: 'OB-3004-1',
          cpt: '58150',
          description: 'Total Abdominal Hysterectomy',
          charge: 1700,
          expectedAllowed: 1600,
          paidAmount: 1500,
        },
      ],
      authorization: { status: 'Approved', authNumber: 'AUTH-UHC-OB-811' },
    },
  ],
}

const denialSeeds: Record<DatabaseKey, Denial[]> = {
  mainHospital: [
    {
      id: 'DN-MH-2101',
      claimId: 'MH-1003',
      databaseId: 'mainHospital',
      payerId: 'aetna',
      code: 'CO 197',
      reason: 'Authorization missing – documentation not received',
      category: 'CO',
      amountAtRisk: 5200,
      daysInAR: 27,
      assignedToUserId: 'denial-lisa',
      status: 'New',
      priority: 'High',
      type: 'Denial',
      createdAt: '2025-10-06T12:00:00Z',
      notes: 'Need to request retro-authorization',
    },
  ],
  imagingCenter: [
    {
      id: 'DN-IM-3101',
      claimId: 'IM-2002',
      databaseId: 'imagingCenter',
      payerId: 'cigna',
      code: 'CO 50',
      reason: 'Medical necessity not met per payer policy',
      category: 'CO',
      amountAtRisk: 1800,
      daysInAR: 39,
      assignedToUserId: 'billing-sanjay',
      status: 'In Progress',
      priority: 'Medium',
      type: 'Denial',
      createdAt: '2025-09-20T10:00:00Z',
      notes: 'Appeal drafted, awaiting clinical letter',
    },
  ],
  obgynClinic: [
    {
      id: 'DN-OB-4101',
      claimId: 'OB-3003',
      databaseId: 'obgynClinic',
      payerId: 'bcbs',
      code: 'CO 197',
      reason: 'Referral expired prior to date of service',
      category: 'CO',
      amountAtRisk: 1400,
      daysInAR: 22,
      assignedToUserId: 'denial-tom',
      status: 'New',
      priority: 'High',
      type: 'Denial',
      createdAt: '2025-10-16T09:30:00Z',
      notes: 'Need to request backdated referral exception',
    },
  ],
}

const routingRules: DenialRoutingRule[] = [
  {
    id: 'rule-aetna-auth',
    name: 'Aetna Authorization Denials',
    payerIds: ['aetna'],
    denialCodes: ['CO 197'],
    assignmentUserId: 'denial-lisa',
    priority: 'High',
  },
  {
    id: 'rule-aetna-high-value',
    name: 'High Value Aetna Variances',
    payerIds: ['aetna'],
    minAmount: 1000,
    assignmentUserId: 'denial-lisa',
    priority: 'High',
  },
  {
    id: 'rule-bcbs',
    name: 'BCBS Routing',
    payerIds: ['bcbs'],
    assignmentUserId: 'denial-tom',
    priority: 'Medium',
  },
  {
    id: 'rule-cigna',
    name: 'Cigna Denials',
    payerIds: ['cigna'],
    assignmentUserId: 'billing-sanjay',
    priority: 'Medium',
  },
]

const clearinghouse = {
  active: 'TriZetto',
  available: ['TriZetto', 'Change Healthcare', 'Availity'],
}

const baseAuditLogs: AuditLogEntry[] = [
  {
    id: 'AL-001',
    timestamp: '2025-10-20T15:20:00Z',
    actorType: 'User',
    actorName: 'Lisa Chen',
    action: 'Updated denial status to In Progress',
    entityType: 'Denial',
    entityId: 'DN-MH-2101',
    details: 'Requested retro authorization from payer portal',
    databaseId: 'mainHospital',
  },
  {
    id: 'AL-002',
    timestamp: '2025-10-18T10:35:00Z',
    actorType: 'System',
    actorName: 'System Automation',
    action: 'Auto-assigned denial to Tom Greene',
    entityType: 'Denial',
    entityId: 'DN-OB-4101',
    details: 'Routing rule rule-bcbs applied',
    databaseId: 'obgynClinic',
  },
  {
    id: 'AL-003',
    timestamp: '2025-10-12T08:15:00Z',
    actorType: 'User',
    actorName: 'Monica Patel',
    action: 'Copied expected rates from Main Hospital to Imaging Center',
    entityType: 'Expected Rate',
    entityId: 'batch-2025-10-12',
    details: 'Included 12 expected rate entries',
    databaseId: 'imagingCenter',
  },
]

const getDefaultDenialOwner = (databaseId: DatabaseKey): string | undefined =>
  users.find((user) => user.role === 'Denial Specialist' && user.databases.includes(databaseId))?.id

const applyRouting = (denial: Denial): Denial => {
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

  return {
    ...denial,
    assignedToUserId: denial.assignedToUserId ?? getDefaultDenialOwner(denial.databaseId) ?? denial.assignedToUserId,
  }
}

const calculateUnderpaymentDenials = (
  claims: Claim[],
  existingDenials: Denial[],
): { updatedClaims: Claim[]; denials: Denial[]; audit: AuditLogEntry[] } => {
  const denials = [...existingDenials]
  const audit: AuditLogEntry[] = []
  const updatedClaims = claims.map((claim) => {
    const expected = claim.expectedAllowed
    if (claim.status === 'Denied' || expected === 0) {
      return claim
    }

    const varianceAmount = claim.paidAmount - expected
    const varianceRatio = varianceAmount / expected
    if (varianceRatio < -0.1) {
      const existing = denials.find((d) => d.claimId === claim.id && d.type === 'Underpayment')
      if (!existing) {
        const amountAtRisk = Math.abs(varianceAmount)
        const baseDenial: Denial = {
          id: `UP-${claim.id}`,
          claimId: claim.id,
          databaseId: claim.databaseId,
          payerId: claim.payerId,
          code: 'CO 45',
          reason: 'Contracted rate variance greater than 10%',
          category: 'CO',
          amountAtRisk,
          daysInAR: claim.daysInAR,
          assignedToUserId: claim.assignedToUserId,
          status: 'New',
          priority: amountAtRisk > 1000 ? 'High' : 'Medium',
          type: 'Underpayment',
          createdAt: new Date().toISOString(),
          notes: 'Automatically generated from payment variance rule',
        }
        const assignedDenial = applyRouting(baseDenial)
        denials.push(assignedDenial)
        audit.push({
          id: `AL-UP-${claim.id}`,
          timestamp: assignedDenial.createdAt,
          actorType: 'System',
          actorName: 'Underpayment Monitor',
          action: `Auto-created underpayment task (${assignedDenial.code})`,
          entityType: 'Denial',
          entityId: assignedDenial.id,
          details: `Variance ${(varianceRatio * 100).toFixed(1)}% assigned to ${assignedDenial.assignedToUserId}`,
          databaseId: claim.databaseId,
        })
      }

      return {
        ...claim,
        status: 'Underpaid' as ClaimStatus,
        hasDenial: true,
      }
    }

    return {
      ...claim,
      hasDenial: existingDenials.some((denial) => denial.claimId === claim.id) || claim.hasDenial,
    }
  })

  return { updatedClaims, denials, audit }
}

const buildDatabaseState = (): AppBootstrapData => {
  const databases: Record<DatabaseKey, DatabaseState> = {
    mainHospital: {
      claims: [],
      denials: [],
      payers: clone(payersByDb.mainHospital),
      expectedRates: clone(expectedRatesByDb.mainHospital),
      reasonCodes: clone(reasonCodesByDb.mainHospital),
    },
    imagingCenter: {
      claims: [],
      denials: [],
      payers: clone(payersByDb.imagingCenter),
      expectedRates: clone(expectedRatesByDb.imagingCenter),
      reasonCodes: clone(reasonCodesByDb.imagingCenter),
    },
    obgynClinic: {
      claims: [],
      denials: [],
      payers: clone(payersByDb.obgynClinic),
      expectedRates: clone(expectedRatesByDb.obgynClinic),
      reasonCodes: clone(reasonCodesByDb.obgynClinic),
    },
  }

  let auditLogs: AuditLogEntry[] = [...baseAuditLogs]

  ;(Object.keys(databases) as DatabaseKey[]).forEach((dbKey: DatabaseKey) => {
    const claims = clone(claimSeeds[dbKey])
    const routedDenials = clone(denialSeeds[dbKey]).map(applyRouting)
    const { updatedClaims, denials, audit } = calculateUnderpaymentDenials(claims, routedDenials)

    databases[dbKey].claims = updatedClaims.map((claim) => {
      const hasDenial = denials.some((denial) => denial.claimId === claim.id)
      return { ...claim, hasDenial }
    })
    databases[dbKey].denials = denials
    auditLogs = [...auditLogs, ...audit]
  })

  return {
    databases,
    metadata: databaseMetadata,
    users,
    routingRules,
    clearinghouse,
    auditLogs,
  }
}

export const getBootstrapData = (): AppBootstrapData => buildDatabaseState()
