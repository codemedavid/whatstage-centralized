'use client';

import { useEffect, useState } from 'react';
import { Store, Target, TrendingUp, TrendingDown, Minus, Settings, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface DashboardMetrics {
    store: {
        isSetup: boolean;
        name: string | null;
        type: 'ecommerce' | 'real_estate' | null;
    };
    goal: {
        type: 'lead_generation' | 'appointment_booking' | 'tripping' | 'purchase';
        reached: number;
        total: number;
        percentage: number;
    };
    pipeline: {
        qualifiedCount: number;
        trend: 'up' | 'down' | 'stable';
        trendPercentage: number;
    };
}

const goalLabels: Record<string, string> = {
    lead_generation: 'Lead Capture',
    appointment_booking: 'Bookings',
    tripping: 'Qualified Leads',
    purchase: 'Purchases'
};

const storeTypeLabels: Record<string, string> = {
    ecommerce: 'E-Commerce',
    real_estate: 'Real Estate'
};

export default function DashboardHero() {
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const res = await fetch('/api/dashboard/metrics');
                if (res.ok) {
                    const data = await res.json();
                    setMetrics(data);
                }
            } catch (error) {
                console.error('Error fetching metrics:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchMetrics();
        // Refresh every 60 seconds
        const interval = setInterval(fetchMetrics, 60000);
        return () => clearInterval(interval);
    }, []);

    const TrendIcon = metrics?.pipeline.trend === 'up' ? TrendingUp :
        metrics?.pipeline.trend === 'down' ? TrendingDown : Minus;

    const trendColor = metrics?.pipeline.trend === 'up' ? 'text-emerald-600' :
        metrics?.pipeline.trend === 'down' ? 'text-red-500' : 'text-gray-400';

    // Teal brand color: #008774 (using teal-600/700 closest matches or custom style)

    return (
        <div className="w-full mb-8">
            <div className="bg-white rounded-3xl p-8 shadow-xl ring-1 ring-gray-100 flex flex-col h-full justify-between">
                {/* Header */}
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-1">
                            Business Overview
                        </h1>
                        <p className="text-sm text-gray-500">Real-time performance snapshot</p>
                    </div>
                    {/* Optional: Add a subtle brand element or date here if needed */}
                </div>

                {loading ? (
                    <div className="animate-pulse grid grid-cols-3 gap-8">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex flex-col gap-3">
                                <div className="h-10 w-10 bg-gray-100 rounded-xl"></div>
                                <div className="h-4 w-24 bg-gray-100 rounded"></div>
                                <div className="h-8 w-16 bg-gray-100 rounded"></div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-3 gap-8 divide-x divide-gray-100">

                        {/* Store Status */}
                        <div className="flex flex-col pr-8">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-3 rounded-2xl ${metrics?.store.isSetup ? 'bg-teal-50 text-teal-700' : 'bg-amber-50 text-amber-600'}`}>
                                    <Store size={24} />
                                </div>
                                {metrics?.store.isSetup && (
                                    <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-medium border border-gray-200">
                                        {storeTypeLabels[metrics.store.type || 'ecommerce']}
                                    </span>
                                )}
                            </div>

                            {metrics?.store.isSetup ? (
                                <div className="mt-auto">
                                    <h3 className="text-3xl font-bold text-gray-900 tracking-tight">
                                        {metrics.store.name || 'My Store'}
                                    </h3>
                                    <p className="text-sm font-medium text-teal-600 mt-1 flex items-center gap-1">
                                        Store Active <span className="h-2 w-2 rounded-full bg-teal-500 animate-pulse ml-1"></span>
                                    </p>
                                </div>
                            ) : (
                                <div className="mt-auto">
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">Setup Required</h3>
                                    <Link
                                        href="/setup"
                                        className="inline-flex items-center gap-2 text-sm font-medium text-white bg-[#008774] px-4 py-2 rounded-xl hover:bg-[#007060] transition-colors shadow-sm shadow-teal-200/50"
                                    >
                                        <Settings size={16} /> Configure Store
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Goal Progress */}
                        <div className="flex flex-col px-8">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-3 rounded-2xl ${metrics?.goal.percentage && metrics.goal.percentage > 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-50 text-gray-400'}`}>
                                    <Target size={24} />
                                </div>
                                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                                    {goalLabels[metrics?.goal.type || 'lead_generation']}
                                </span>
                            </div>
                            <div className="mt-auto">
                                <div className="flex items-baseline gap-2">
                                    <h3 className="text-4xl font-bold text-gray-900 tracking-tight">
                                        {metrics?.goal.percentage || 0}%
                                    </h3>
                                    <span className="text-sm text-gray-500 font-medium">reached</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2 mt-3 overflow-hidden">
                                    <div
                                        className="bg-indigo-500 h-2 rounded-full transition-all duration-500 ease-out"
                                        style={{ width: `${metrics?.goal.percentage || 0}%` }}
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    <span className="font-medium text-gray-900">{metrics?.goal.reached}</span> / {metrics?.goal.total} total leads
                                </p>
                            </div>
                        </div>

                        {/* Pipeline Health */}
                        <div className="flex flex-col pl-8">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 rounded-2xl bg-blue-50 text-blue-600">
                                    <TrendingUp size={24} />
                                </div>
                                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                                    Active Pipeline
                                </span>
                            </div>
                            <div className="mt-auto">
                                <div className="flex items-baseline gap-3">
                                    <h3 className="text-4xl font-bold text-gray-900 tracking-tight">
                                        {metrics?.pipeline.qualifiedCount || 0}
                                    </h3>
                                    <div className={`flex items-center text-sm font-medium ${trendColor} bg-opacity-10 rounded-lg px-2 py-1`}>
                                        <TrendIcon size={16} className="mr-1" />
                                        {metrics?.pipeline.trendPercentage || 0}%
                                    </div>
                                </div>
                                <p className="text-sm text-gray-500 mt-2">
                                    Total leads in positive stages
                                </p>
                                <div className="mt-3 flex items-center gap-1 text-xs text-blue-600 font-medium cursor-pointer hover:underline">
                                    View Pipeline <ArrowRight size={12} />
                                </div>
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
}
