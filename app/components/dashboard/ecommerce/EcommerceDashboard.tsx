'use client';

import { useState, useEffect, useCallback } from 'react';
import RevenueCard from './RevenueCard';
import OrderStatusCard from './OrderStatusCard';
import CartAbandonmentCard from './CartAbandonmentCard';
import TopProductsCard from './TopProductsCard';
import ActionItems from '../ActionItems';
import HumanTakeoverCard from '../HumanTakeoverCard';
import type { EcommerceMetrics, DashboardStatus, FlaggedLead } from '@/app/lib/dashboardData';

interface EcommerceDashboardProps {
    initialMetrics: EcommerceMetrics | null;
    initialStatus: DashboardStatus | null;
    initialFlaggedLeads: FlaggedLead[];
    initialActiveSessions: Record<string, number>;
    onLeadClick?: (leadId: string, leadData: any) => void;
}

export default function EcommerceDashboard({
    initialMetrics,
    initialStatus,
    initialFlaggedLeads,
    initialActiveSessions,
    onLeadClick
}: EcommerceDashboardProps) {
    const [metrics, setMetrics] = useState<EcommerceMetrics | null>(initialMetrics);
    const [status, setStatus] = useState<DashboardStatus | null>(initialStatus);
    const [flaggedLeads, setFlaggedLeads] = useState<FlaggedLead[]>(initialFlaggedLeads);
    const [activeSessions, setActiveSessions] = useState(initialActiveSessions);
    const [abandonmentFilter, setAbandonmentFilter] = useState(24);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const refreshMetrics = useCallback(async (hours?: number) => {
        setIsRefreshing(true);
        try {
            const res = await fetch(`/api/dashboard/ecommerce?abandonmentHours=${hours || abandonmentFilter}`);
            if (res.ok) {
                setMetrics(await res.json());
            }
        } catch (error) {
            console.error('Error refreshing e-commerce metrics:', error);
        } finally {
            setIsRefreshing(false);
        }
    }, [abandonmentFilter]);

    const handleFilterChange = async (hours: number) => {
        setAbandonmentFilter(hours);
        await refreshMetrics(hours);
    };

    // Poll for updates every 60 seconds
    useEffect(() => {
        const interval = setInterval(() => refreshMetrics(), 60000);
        return () => clearInterval(interval);
    }, [refreshMetrics]);

    const handleStatusRefresh = async () => {
        try {
            const res = await fetch('/api/dashboard/status');
            if (res.ok) setStatus(await res.json());
        } catch (error) {
            console.error('Error refreshing status:', error);
        }
    };

    const handleTakeoverRefresh = async () => {
        try {
            const [leadsRes, sessionsRes] = await Promise.all([
                fetch('/api/leads/needs-attention'),
                fetch('/api/leads/active-sessions'),
            ]);
            if (leadsRes.ok) {
                const data = await leadsRes.json();
                setFlaggedLeads(data.leads || []);
            }
            if (sessionsRes.ok) {
                const data = await sessionsRes.json();
                setActiveSessions(data.activeSessions || {});
            }
        } catch (error) {
            console.error('Error refreshing takeover data:', error);
        }
    };

    return (
        <div className="grid grid-cols-12 gap-6 h-full min-h-[600px]">
            {/* Top Row */}
            <div className="col-span-12 md:col-span-4">
                <RevenueCard
                    today={metrics?.revenue.today || 0}
                    yesterday={metrics?.revenue.yesterday || 0}
                    trend={metrics?.revenue.trend || 'stable'}
                    trendPercentage={metrics?.revenue.trendPercentage || 0}
                    isLoading={isRefreshing}
                />
            </div>

            <div className="col-span-12 md:col-span-4">
                <OrderStatusCard
                    pending={metrics?.orders.pending || 0}
                    processing={metrics?.orders.processing || 0}
                    shipped={metrics?.orders.shipped || 0}
                    delivered={metrics?.orders.delivered || 0}
                    isLoading={isRefreshing}
                />
            </div>

            <div className="col-span-12 md:col-span-4">
                <ActionItems
                    initialStatus={status}
                    onRefresh={handleStatusRefresh}
                />
            </div>

            {/* Middle Row - Cart Abandonment (full width) */}
            <div className="col-span-12">
                <CartAbandonmentCard
                    leads={metrics?.cartAbandonment.leads || []}
                    count={metrics?.cartAbandonment.count || 0}
                    selectedFilter={abandonmentFilter}
                    onFilterChange={handleFilterChange}
                    onLeadClick={onLeadClick}
                    isLoading={isRefreshing}
                />
            </div>

            {/* Bottom Row */}
            <div className="col-span-12 md:col-span-5">
                <TopProductsCard
                    products={metrics?.topProducts || []}
                    isLoading={isRefreshing}
                />
            </div>

            <div className="col-span-12 md:col-span-7">
                <HumanTakeoverCard
                    onLeadClick={onLeadClick}
                    initialLeads={flaggedLeads}
                    initialSessions={activeSessions}
                    onRefresh={handleTakeoverRefresh}
                    onUpdateLeads={setFlaggedLeads}
                    onUpdateSessions={setActiveSessions}
                />
            </div>
        </div>
    );
}
