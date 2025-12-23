import { getDashboardData, getEcommerceMetrics } from '../lib/dashboardData';
import DashboardClient from './DashboardClient';

export const dynamic = 'force-dynamic';
export const revalidate = 60; // Revalidate every 60 seconds

export default async function Dashboard() {
  // Fetch all dashboard data server-side in parallel
  const dashboardData = await getDashboardData();

  // Fetch e-commerce metrics if store type is ecommerce
  let ecommerceMetrics = null;
  if (dashboardData.metrics?.store?.type === 'ecommerce') {
    ecommerceMetrics = await getEcommerceMetrics(24);
  }

  return (
    <DashboardClient
      initialData={dashboardData}
      initialEcommerceMetrics={ecommerceMetrics}
    />
  );
}
