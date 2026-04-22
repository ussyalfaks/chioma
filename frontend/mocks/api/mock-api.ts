/**
 * Mock API Layer - Intercepts API calls and returns demo data
 * Enable by setting NEXT_PUBLIC_USE_MOCK_API=true in .env.local
 */

import { MOCK_DISPUTES } from '../features/disputes';
import { MOCK_DASHBOARD_PAYMENTS } from '../features/transactions';
import { MOCK_DOCUMENTS } from '../features/documents';
import { MOCK_MAINTENANCE_REQUESTS } from '../features/maintenance';

// Demo data for various endpoints
const mockData: Record<string, unknown> = {
  // Tenant Disputes
  '/disputes': {
    data: MOCK_DISPUTES.slice(0, 2),
  },

  // Tenant Reviews
  '/reviews': {
    data: [
      {
        id: 'rev-001',
        reviewId: 'RVW-2026-001',
        target: 'James Adebayo',
        targetRole: 'USER',
        propertyName: 'Sunset Apartments, Unit 4B',
        rating: 5,
        comment:
          'Great landlord! Quick communication and repairs handled promptly.',
        status: 'PUBLISHED',
        context: 'LEASE',
        responseCount: 1,
        createdAt: '2026-02-20T12:30:00Z',
        updatedAt: '2026-02-20T12:30:00Z',
      },
      {
        id: 'rev-002',
        reviewId: 'RVW-2026-002',
        target: 'Facility Ops Team',
        targetRole: 'ADMIN',
        propertyName: 'Sunset Apartments, Unit 4B',
        rating: 4,
        comment: 'Maintenance response good after escalation.',
        status: 'PUBLISHED',
        context: 'MAINTENANCE',
        responseCount: 0,
        createdAt: '2026-01-10T09:00:00Z',
        updatedAt: '2026-01-10T09:00:00Z',
      },
    ],
  },

  // Landlord Documents
  '/documents': {
    data: MOCK_DOCUMENTS,
  },

  // Landlord Maintenance
  '/maintenance': {
    data: MOCK_MAINTENANCE_REQUESTS,
  },

  // Payments
  '/payments': {
    data: MOCK_DASHBOARD_PAYMENTS,
  },
};

// Pattern matching for dynamic routes
const dynamicPatterns: Array<{
  pattern: RegExp;
  handler: (match: RegExpMatchArray) => unknown;
}> = [
  {
    pattern: /^\/disputes\/(.+)$/,
    handler: (match) => {
      const dispute = MOCK_DISPUTES.find((d) => d.id === match[1]);
      return { data: dispute || null };
    },
  },
  {
    pattern: /^\/maintenance\/(.+)$/,
    handler: (match) => {
      const maintenance = MOCK_MAINTENANCE_REQUESTS.find(
        (m) => m.id === match[1],
      );
      return { data: maintenance || null };
    },
  },
  {
    pattern: /^\/documents\/(.+)$/,
    handler: (match) => {
      const document = MOCK_DOCUMENTS.find((d) => d.id === match[1]);
      return { data: document || null };
    },
  },
];

export function getMockData(endpoint: string): unknown {
  // Check static patterns first
  if (endpoint in mockData) {
    return mockData[endpoint];
  }

  // Check dynamic patterns
  for (const { pattern, handler } of dynamicPatterns) {
    const match = endpoint.match(pattern);
    if (match) {
      return handler(match);
    }
  }

  // Default response for unknown endpoints
  return { data: [] };
}

export function shouldUseMockApi(): boolean {
  if (typeof process === 'undefined') return false;
  return process.env.NEXT_PUBLIC_USE_MOCK_API === 'true';
}
