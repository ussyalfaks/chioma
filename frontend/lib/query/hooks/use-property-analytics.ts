'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { queryKeys } from '../keys';
import type { LandlordPropertyAnalytics } from '@/lib/property-analytics';

const LIVE_REFRESH_MS = 30_000;

export function useLandlordPropertyAnalytics(days = 30) {
  const normalizedDays = Math.min(365, Math.max(1, Math.floor(days)));

  return useQuery({
    queryKey: queryKeys.analytics.landlordOverview(normalizedDays),
    queryFn: async () => {
      const { data } = await apiClient.get<LandlordPropertyAnalytics>(
        `/analytics/landlord/dashboard?days=${normalizedDays}`,
      );
      return data;
    },
    refetchInterval: LIVE_REFRESH_MS,
    refetchIntervalInBackground: true,
  });
}
