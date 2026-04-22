/**
 * User Dashboard Components
 * Barrel exports for all dashboard components
 */

export { default as DashboardLayout } from './DashboardLayout';
export { default as Sidebar } from './Sidebar';
export { default as SidebarItem } from './SidebarItem';
export { default as Topbar } from './Topbar';
export { default as KPICards } from './KPICards';
export { default as RecentActivity } from './RecentActivity';
export { default as PropertyPortfolio } from './PropertyPortfolio';
export { default as TransactionsTable } from './TransactionsTable';
export { default as SecurityDepositsSection } from './SecurityDepositsSection';

// Export types
export type {
  NavItem,
  KPIData,
  Transaction,
  ActivityItem,
  PropertyPortfolioItem,
  SecurityDeposit,
  DashboardLayoutProps,
  SidebarProps,
  TopbarProps,
  KPICardsProps,
  RecentActivityProps,
  TransactionsTableProps,
  PropertyPortfolioProps,
  SecurityDepositsSectionProps,
} from './types';
