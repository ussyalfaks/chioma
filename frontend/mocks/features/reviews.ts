/**
 * Mock Review Data
 */

export interface ReviewAuthor {
  id: string;
  name: string;
  isVerified: boolean;
  role: 'USER' | 'ADMIN';
}

export interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  propertyName: string;
  context: 'LEASE' | 'MAINTENANCE' | 'SERVICE';
  author: ReviewAuthor;
}

export interface ReviewTarget {
  id: string;
  agreementId: string;
  name: string;
  role: 'USER' | 'ADMIN';
  propertyName: string;
  context: 'LEASE' | 'MAINTENANCE';
  dueLabel: string;
}

export const MOCK_REVIEW_TARGETS: ReviewTarget[] = [
  {
    id: 'rev-target-001',
    agreementId: 'agr-001',
    name: 'James Adebayo',
    role: 'USER',
    propertyName: 'Sunset Apartments, Unit 4B',
    context: 'LEASE',
    dueLabel: 'Lease milestone reached 3 days ago',
  },
  {
    id: 'rev-target-002',
    agreementId: 'mnt-019',
    name: 'Facility Ops Team',
    role: 'USER',
    propertyName: 'Sunset Apartments, Unit 4B',
    context: 'MAINTENANCE',
    dueLabel: 'Maintenance ticket closed yesterday',
  },
  {
    id: 'rev-target-101',
    agreementId: 'agr-002',
    name: 'Ada Nwosu',
    role: 'USER',
    propertyName: 'Glover Road, Ikoyi',
    context: 'LEASE',
    dueLabel: 'Move-in completed 1 week ago',
  },
  {
    id: 'rev-target-102',
    agreementId: 'agr-004',
    name: 'Kunle Bello',
    role: 'USER',
    propertyName: 'Admiralty Way, Block 4',
    context: 'MAINTENANCE',
    dueLabel: 'Maintenance request resolved 2 days ago',
  },
];

export const MOCK_REVIEWS: Review[] = [
  {
    id: 'review-001',
    rating: 5,
    comment:
      'Communication was quick, the lease terms were clear, and repairs were documented properly.',
    createdAt: '2026-02-20T12:30:00.000Z',
    propertyName: 'Sunset Apartments, Unit 4B',
    context: 'LEASE',
    author: {
      id: 'user-001',
      name: 'You',
      isVerified: true,
      role: 'USER',
    },
  },
  {
    id: 'review-002',
    rating: 4,
    comment:
      'The maintenance follow-up was solid after escalation, although the first response took too long.',
    createdAt: '2026-01-10T09:00:00.000Z',
    propertyName: 'Sunset Apartments, Unit 4B',
    context: 'MAINTENANCE',
    author: {
      id: 'user-001',
      name: 'You',
      isVerified: true,
      role: 'USER',
    },
  },
  {
    id: 'review-101',
    rating: 5,
    comment:
      'User stayed current on payments and kept the unit in excellent condition during inspection.',
    createdAt: '2026-02-08T14:00:00.000Z',
    propertyName: 'Glover Road, Ikoyi',
    context: 'LEASE',
    author: {
      id: 'user-002',
      name: 'You',
      isVerified: true,
      role: 'USER',
    },
  },
  {
    id: 'review-102',
    rating: 4,
    comment:
      'User documented the issue clearly and cooperated with maintenance scheduling.',
    createdAt: '2026-03-02T10:15:00.000Z',
    propertyName: 'Admiralty Way, Block 4',
    context: 'MAINTENANCE',
    author: {
      id: 'user-002',
      name: 'You',
      isVerified: true,
      role: 'USER',
    },
  },
];

// Backwards compatibility exports
export const MOCK_TENANT_REVIEW_TARGETS = MOCK_REVIEW_TARGETS;
export const MOCK_TENANT_REVIEWS = MOCK_REVIEWS.slice(0, 2);
export const MOCK_LANDLORD_REVIEW_TARGETS = MOCK_REVIEW_TARGETS.slice(2);
export const MOCK_LANDLORD_REVIEWS = MOCK_REVIEWS.slice(2);
