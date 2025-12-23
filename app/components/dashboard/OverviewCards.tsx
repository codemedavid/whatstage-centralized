'use client';

import { Users, MessageSquare, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { OverviewMetrics } from '@/app/lib/dashboardData';

interface OverviewCardsProps {
    data: OverviewMetrics | null;
}

export default function OverviewCards({ data }: OverviewCardsProps) {
    const dailyLeads = data?.dailyLeads || { count: 0, trend: 'stable' as const, trendPercentage: 0 };
    const totalResponses = data?.totalResponses || { count: 0, responseRate: 100 };
    const activeConversations = data?.activeConversations || 0;
    const pendingActions = data?.pendingActions || 0;

    const TrendIcon = dailyLeads.trend === 'up' ? TrendingUp : dailyLeads.trend === 'down' ? TrendingDown : Minus;
    const trendText = dailyLeads.trend === 'stable'
        ? 'Same as yesterday'
        : `${dailyLeads.trend === 'up' ? '+' : '-'}${dailyLeads.trendPercentage}% from yesterday`;

    return (
        <div className="bg-teal-600 text-white rounded-3xl p-8 h-full flex flex-col justify-between shadow-xl ring-1 ring-teal-700/50">
            <div>
                <h2 className="text-xl font-medium text-teal-100 mb-6">Daily Performance</h2>

                <div className="grid grid-cols-2 gap-8">
                    <div>
                        <div className="flex items-center gap-2 text-teal-200 mb-2">
                            <Users size={18} />
                            <span className="text-sm font-medium">Daily Leads</span>
                        </div>
                        <p className="text-5xl font-bold tracking-tight">{dailyLeads.count.toLocaleString()}</p>
                        <p className="text-sm text-teal-200 mt-2 flex items-center gap-1">
                            <TrendIcon size={14} />
                            {trendText}
                        </p>
                    </div>

                    <div>
                        <div className="flex items-center gap-2 text-teal-200 mb-2">
                            <MessageSquare size={18} />
                            <span className="text-sm font-medium">Total Responses</span>
                        </div>
                        <p className="text-5xl font-bold tracking-tight">{totalResponses.count.toLocaleString()}</p>
                        <p className="text-sm text-teal-200 mt-2">{totalResponses.responseRate}% response rate</p>
                    </div>
                </div>
            </div>

            <div className="mt-8 border-t border-teal-500/30 pt-4 flex gap-4">
                <div className="flex-1 bg-teal-700/30 rounded-2xl p-4">
                    <p className="text-sm text-teal-200">Active Conversations</p>
                    <p className="text-2xl font-bold">{activeConversations.toLocaleString()}</p>
                </div>
                <div className="flex-1 bg-teal-700/30 rounded-2xl p-4">
                    <p className="text-sm text-teal-200">Pending Actions</p>
                    <p className="text-2xl font-bold">{pendingActions.toLocaleString()}</p>
                </div>
            </div>
        </div>
    );
}
