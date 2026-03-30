export interface AnalyticsRange {
  days: number;
  startDate: string;
  endDate: string;
}

export interface AnalyticsSummary {
  totalProperties: number;
  publishedProperties: number;
  totalViews: number;
  totalFavorites: number;
  totalInquiries: number;
  conversionRate: number;
}

export interface AnalyticsPerformance {
  averageViewsPerProperty: number;
  averageInquiriesPerProperty: number;
  inquiryResponseRate: number;
  favoriteToViewRate: number;
}

export interface TopPerformingProperty {
  propertyId: string;
  title: string;
  city: string | null;
  status: string;
  viewCount: number;
  favoriteCount: number;
  inquiryCount: number;
  conversionRate: number;
}

export interface InquiryTrendPoint {
  date: string;
  inquiries: number;
}

export interface ListingStatusDistributionPoint {
  status: string;
  count: number;
  percentage: number;
}

export interface CityTrendPoint {
  city: string;
  propertyCount: number;
  totalViews: number;
  totalFavorites: number;
  totalInquiries: number;
  averageViewsPerProperty: number;
}

export interface LandlordPropertyAnalytics {
  generatedAt: string;
  range: AnalyticsRange;
  summary: AnalyticsSummary;
  performance: AnalyticsPerformance;
  topPerformingProperties: TopPerformingProperty[];
  marketTrends: {
    inquiryTrend: InquiryTrendPoint[];
    listingStatusDistribution: ListingStatusDistributionPoint[];
    cityTrends: CityTrendPoint[];
  };
}
