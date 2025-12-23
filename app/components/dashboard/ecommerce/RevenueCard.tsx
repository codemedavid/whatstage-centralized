'use client';

import { DollarSign, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface RevenueCardProps {
    today: number;
    yesterday: number;
    trend: 'up' | 'down' | 'stable';
    trendPercentage: number;
    isLoading?: boolean;
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

export default function RevenueCard({
    today,
    yesterday,
    trend,
    trendPercentage,
    isLoading = false
}: RevenueCardProps) {
    if (isLoading) {
        return (
            <div className="bg-gradient-to-br from-teal-600 to-teal-700 text-white rounded-3xl p-6 h-full shadow-xl animate-pulse">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-10 h-10 bg-white/20 rounded-full"></div>
                    <div className="h-5 w-32 bg-white/20 rounded"></div>
                </div>
                <div className="h-12 w-40 bg-white/20 rounded mb-2"></div>
                <div className="h-4 w-32 bg-white/20 rounded"></div>
            </div>
        );
    }

    const TrendIcon = trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownRight : Minus;
    const trendColor = trend === 'up' ? 'text-green-300' : trend === 'down' ? 'text-red-300' : 'text-white/70';

    return (
        <div className="bg-gradient-to-br from-teal-600 to-teal-700 text-white rounded-3xl p-6 h-full shadow-xl ring-1 ring-teal-500/50">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="bg-white/10 p-2.5 rounded-full">
                        <DollarSign size={20} />
                    </div>
                    <span className="text-teal-100 text-sm font-medium">Today&apos;s Revenue</span>
                </div>
                {trendPercentage > 0 && (
                    <div className={`flex items-center gap-1 text-sm font-bold ${trendColor}`}>
                        <TrendIcon size={16} />
                        {trend === 'up' ? '+' : trend === 'down' ? '-' : ''}{trendPercentage}%
                    </div>
                )}
            </div>

            <p className="text-4xl font-bold tracking-tight mb-2">
                {formatCurrency(today)}
            </p>

            <p className="text-sm text-teal-200">
                vs yesterday: {formatCurrency(yesterday)}
            </p>
        </div>
    );
}
