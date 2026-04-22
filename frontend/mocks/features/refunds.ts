/**
 * Mock Refund Request Data\n */

export interface RefundRequestRow {
  id: string;
  refundId: string;
  originalPaymentId: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'APPROVED' | 'PROCESSING' | 'COMPLETED' | 'REJECTED';
  requesterName: string;
  requesterEmail: string;
  reasonSummary: string;
  requestedAt: string;
  updatedAt: string;
}

export interface RefundRequestDetail extends RefundRequestRow {
  reasonDetail: string;
  paymentMethod: string;
  propertyName: string;
  agreementReference: string;
  history: Array<{
    id: string;
    action: string;
    message: string;
    actorName: string;
    actorRole: 'user' | 'admin' | 'system';
    createdAt: string;
  }>;
}

export const MOCK_REFUND_REQUESTS: RefundRequestRow[] = [
  {
    id: 'rfd-001',
    refundId: 'RFD-2026-014',
    originalPaymentId: 'PAY-9K2M7Q',
    amount: 45000,
    currency: 'USDC',
    status: 'PENDING',
    requesterName: 'Ada Nwosu',
    requesterEmail: 'ada.nwosu@email.com',
    reasonSummary: 'Duplicate rent debit',
    requestedAt: '2026-03-22T11:20:00.000Z',
    updatedAt: '2026-03-22T11:20:00.000Z',
  },
  {
    id: 'rfd-002',
    refundId: 'RFD-2026-011',
    originalPaymentId: 'PAY-8J1L4R',
    amount: 125000,
    currency: 'USDC',
    status: 'APPROVED',
    requesterName: 'Kunle Bello',
    requesterEmail: 'kunle.bello@email.com',
    reasonSummary: 'Service outage — payment taken twice',
    requestedAt: '2026-03-18T09:00:00.000Z',
    updatedAt: '2026-03-19T14:30:00.000Z',
  },
  {
    id: 'rfd-003',
    refundId: 'RFD-2026-009',
    originalPaymentId: 'PAY-7H0K3P',
    amount: 32000,
    currency: 'USDC',
    status: 'PROCESSING',
    requesterName: 'Amina Hassan',
    requesterEmail: 'amina.hassan@email.com',
    reasonSummary: 'Overpayment on maintenance invoice',
    requestedAt: '2026-03-10T16:45:00.000Z',
    updatedAt: '2026-03-21T08:15:00.000Z',
  },
  {
    id: 'rfd-004',
    refundId: 'RFD-2025-882',
    originalPaymentId: 'PAY-6G9J2N',
    amount: 18000,
    currency: 'USDC',
    status: 'COMPLETED',
    requesterName: 'Chidi Okonkwo',
    requesterEmail: 'chidi.okonkwo@email.com',
    reasonSummary: 'Deposit reconciliation — partial credit',
    requestedAt: '2025-12-05T10:00:00.000Z',
    updatedAt: '2025-12-12T15:00:00.000Z',
  },
  {
    id: 'rfd-005',
    refundId: 'RFD-2026-003',
    originalPaymentId: 'PAY-5F8I1M',
    amount: 9500,
    currency: 'USDC',
    status: 'REJECTED',
    requesterName: 'James Adebayo',
    requesterEmail: 'james.adebayo@email.com',
    reasonSummary: 'Requested refund outside policy window',
    requestedAt: '2026-02-28T13:00:00.000Z',
    updatedAt: '2026-03-01T09:30:00.000Z',
  },
];

export const MOCK_REFUND_DETAILS: Record<string, RefundRequestDetail> = {
  'rfd-001': {
    ...MOCK_REFUND_REQUESTS[0],
    reasonDetail:
      'Tenant reports that rent for March was debited twice: once via scheduled Stellar transfer and once after a manual reconciliation entry. Bank statement excerpts are attached in the payment dispute log.',
    paymentMethod: 'Stellar (USDC)',
    propertyName: 'Glover Road, Ikoyi',
    agreementReference: 'AGR-2025-021',
    history: [
      {
        id: 'h1',
        action: 'created',
        message: 'Refund request created from user dashboard.',
        actorName: 'Ada Nwosu',
        actorRole: 'user',
        createdAt: '2026-03-22T11:20:00.000Z',
      },
    ],
  },
  'rfd-002': {
    ...MOCK_REFUND_REQUESTS[1],
    reasonDetail:
      'During platform maintenance window, checkout retried and captured a second payment for the same invoice reference.',
    paymentMethod: 'Bank transfer',
    propertyName: 'Admiralty Way, Block 4',
    agreementReference: 'AGR-2025-010',
    history: [
      {
        id: 'h2a',
        action: 'created',
        message: 'Request submitted.',
        actorName: 'Kunle Bello',
        actorRole: 'user',
        createdAt: '2026-03-18T09:00:00.000Z',
      },
      {
        id: 'h2b',
        action: 'approved',
        message: 'Refund approved by admin.',
        actorName: 'Admin',
        actorRole: 'admin',
        createdAt: '2026-03-19T14:30:00.000Z',
      },
    ],
  },
};
