/**
 * Mock Agreement/Lease Data
 */

export interface Agreement {
  id: string;
  reference: string;
  propertyId: string;
  party1Id: string;
  party2Id: string;
  party3Id?: string;
  rentAmount: number;
  currency: string;
  securityDeposit: number;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'PENDING' | 'EXPIRED' | 'TERMINATED';
  stage: 'DRAFT' | 'SIGNED' | 'DEPOSIT_LOCKED' | 'ACTIVE' | 'COMPLETED';
}

export const MOCK_AGREEMENTS: Agreement[] = [
  {
    id: 'agr-001',
    reference: 'AGR-2025-014',
    propertyId: 'prop-001',
    party1Id: 'user-001',
    party2Id: 'user-002',
    party3Id: 'user-003',
    rentAmount: 150000,
    currency: 'USDC',
    securityDeposit: 300000,
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    status: 'ACTIVE',
    stage: 'ACTIVE',
  },
  {
    id: 'agr-002',
    reference: 'AGR-2025-021',
    propertyId: 'prop-002',
    party1Id: 'user-004',
    party2Id: 'user-005',
    party3Id: 'user-003',
    rentAmount: 200000,
    currency: 'USDC',
    securityDeposit: 400000,
    startDate: '2025-02-01',
    endDate: '2026-01-31',
    status: 'ACTIVE',
    stage: 'ACTIVE',
  },
  {
    id: 'agr-003',
    reference: 'AGR-2025-010',
    propertyId: 'prop-003',
    party1Id: 'user-001',
    party2Id: 'user-006',
    party3Id: 'user-007',
    rentAmount: 180000,
    currency: 'USDC',
    securityDeposit: 360000,
    startDate: '2025-03-01',
    endDate: '2026-02-28',
    status: 'ACTIVE',
    stage: 'ACTIVE',
  },
];
