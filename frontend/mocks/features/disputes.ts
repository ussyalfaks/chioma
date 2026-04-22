/**
 * Mock Dispute Data
 */

export interface Evidence {
  id: string;
  label: string;
  type: 'image' | 'document' | 'video';
  url: string;
  uploadedByName: string;
  uploadedAt: string;
}

export interface TimelineEvent {
  id: string;
  type: string;
  title: string;
  description: string;
  actorName: string;
  actorRole: 'user' | 'admin' | 'system';
  createdAt: string;
}

export interface Dispute {
  id: string;
  disputeId: string;
  agreementReference: string;
  propertyName: string;
  claimantName: string;
  claimantRole: 'user';
  respondentName: string;
  respondentRole: 'user';
  disputeType: string;
  description: string;
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'CLOSED';
  priority: 'low' | 'medium' | 'high';
  requestedAmount: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
  assignedToName?: string;
  evidence?: Evidence[];
  timeline?: TimelineEvent[];
  resolutionHistory?: unknown[];
}

export const MOCK_DISPUTES: Dispute[] = [
  {
    id: 'dis-001',
    disputeId: 'DSP-2026-001',
    agreementReference: 'AGR-2025-014',
    propertyName: 'Sunset Apartments, Unit 4B',
    claimantName: 'Amina Hassan',
    claimantRole: 'user',
    respondentName: 'James Adebayo',
    respondentRole: 'user',
    disputeType: 'MAINTENANCE',
    description:
      'Water damage repairs were delayed for 12 days after the issue was reported.',
    status: 'UNDER_REVIEW',
    priority: 'high',
    requestedAmount: 40000,
    currency: 'USDC',
    createdAt: '2026-02-18T10:00:00.000Z',
    updatedAt: '2026-03-06T13:20:00.000Z',
    assignedToName: 'Arbiter Team A',
    evidence: [
      {
        id: 'ev-1',
        label: 'Bathroom leak — photo set 1',
        type: 'image',
        url: '/globe.svg',
        uploadedByName: 'Amina Hassan',
        uploadedAt: '2026-02-18T10:05:00.000Z',
      },
      {
        id: 'ev-2',
        label: 'Maintenance ticket export',
        type: 'document',
        url: '/file.svg',
        uploadedByName: 'Amina Hassan',
        uploadedAt: '2026-02-18T10:08:00.000Z',
      },
      {
        id: 'ev-3',
        label: 'Follow-up video walkthrough',
        type: 'video',
        url: '/globe.svg',
        uploadedByName: 'Amina Hassan',
        uploadedAt: '2026-02-20T14:00:00.000Z',
      },
    ],
    timeline: [
      {
        id: 'tl-1',
        type: 'created',
        title: 'Dispute opened',
        description: 'Case filed under maintenance category.',
        actorName: 'Amina Hassan',
        actorRole: 'user',
        createdAt: '2026-02-18T10:00:00.000Z',
      },
      {
        id: 'tl-2',
        type: 'evidence_submitted',
        title: 'Evidence uploaded',
        description: '3 files attached to the case.',
        actorName: 'Amina Hassan',
        actorRole: 'user',
        createdAt: '2026-02-18T10:08:00.000Z',
      },
      {
        id: 'tl-3',
        type: 'status_change',
        title: 'Status → Under review',
        description: 'Escalated to dispute resolution queue.',
        actorName: 'System',
        actorRole: 'system',
        createdAt: '2026-02-19T09:00:00.000Z',
      },
      {
        id: 'tl-4',
        type: 'assigned',
        title: 'Assigned to arbiter pool',
        description: 'Arbiter Team A picked up preliminary review.',
        actorName: 'Admin',
        actorRole: 'admin',
        createdAt: '2026-03-01T11:30:00.000Z',
      },
      {
        id: 'tl-5',
        type: 'comment',
        title: 'Response from respondent',
        description:
          'Contractor was scheduled; delay due to parts shipment — attaching vendor comms.',
        actorName: 'James Adebayo',
        actorRole: 'user',
        createdAt: '2026-03-04T16:45:00.000Z',
      },
    ],
    resolutionHistory: [],
  },
  {
    id: 'dis-002',
    disputeId: 'DSP-2025-019',
    agreementReference: 'AGR-2025-014',
    propertyName: 'Sunset Apartments, Unit 4B',
    claimantName: 'Amina Hassan',
    claimantRole: 'user',
    respondentName: 'James Adebayo',
    respondentRole: 'user',
    disputeType: 'SECURITY_DEPOSIT',
    description:
      'Requesting clarity on deduction applied to the security deposit statement.',
    status: 'RESOLVED',
    priority: 'medium',
    requestedAmount: 60000,
    currency: 'USDC',
    createdAt: '2025-12-20T16:00:00.000Z',
    updatedAt: '2026-01-04T12:10:00.000Z',
    assignedToName: 'Arbiter Team B',
    evidence: [
      {
        id: 'ev-d2-1',
        label: 'Deposit statement PDF',
        type: 'document',
        url: '/file.svg',
        uploadedByName: 'Amina Hassan',
        uploadedAt: '2025-12-20T16:02:00.000Z',
      },
    ],
    timeline: [],
    resolutionHistory: [],
  },
  {
    id: 'dis-101',
    disputeId: 'DSP-2026-004',
    agreementReference: 'AGR-2025-021',
    propertyName: 'Glover Road, Ikoyi',
    claimantName: 'James Adebayo',
    claimantRole: 'user',
    respondentName: 'Ada Nwosu',
    respondentRole: 'user',
    disputeType: 'RENT_PAYMENT',
    description:
      'Tenant claims rent was debited twice after a manual settlement was also recorded.',
    status: 'OPEN',
    priority: 'high',
    requestedAmount: 180000,
    currency: 'USDC',
    createdAt: '2026-03-04T08:45:00.000Z',
    updatedAt: '2026-03-04T08:45:00.000Z',
    evidence: [],
    timeline: [],
    resolutionHistory: [],
  },
  {
    id: 'dis-102',
    disputeId: 'DSP-2026-002',
    agreementReference: 'AGR-2025-010',
    propertyName: 'Admiralty Way, Block 4',
    claimantName: 'James Adebayo',
    claimantRole: 'user',
    respondentName: 'Kunle Bello',
    respondentRole: 'user',
    disputeType: 'PROPERTY_DAMAGE',
    description:
      'Checkout inspection found damage to the kitchen cabinet and broken smoke detectors.',
    status: 'UNDER_REVIEW',
    priority: 'medium',
    requestedAmount: 95000,
    currency: 'USDC',
    createdAt: '2026-02-09T17:30:00.000Z',
    updatedAt: '2026-03-03T10:00:00.000Z',
    evidence: [],
    timeline: [],
    resolutionHistory: [],
  },
];
