'use client';

import { Target, ArrowUpRight } from 'lucide-react';

interface ConversionMetricProps {
    percentage?: number;
    trend?: 'up' | 'down' | 'stable';
    trendValue?: number;
    isLoading?: boolean;
}

export default function ConversionMetric({
    percentage = 0,
    trend = 'stable',
    trendValue = 0,
    isLoading = false
}: ConversionMetricProps) {
    if (isLoading) {
        return (
            <div className="bg-white rounded-3xl p-8 h-full flex flex-col justify-between shadow-sm relative overflow-hidden ring-1 ring-gray-100 animate-pulse">
                <div className="flex justify-between items-start">
                    <div className="h-8 w-32 bg-gray-200 rounded"></div>
                    <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
                </div>
                <div className="mt-4">
                    <div className="h-12 w-24 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 w-32 bg-gray-200 rounded"></div>
                </div>
                <div className="mt-6">
                    <div className="h-3 w-full bg-gray-200 rounded-full"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-3xl p-8 h-full flex flex-col justify-between shadow-sm relative overflow-hidden ring-1 ring-gray-100">
            <div className="flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="bg-teal-50 p-2 rounded-lg">
                            <Target size={20} className="text-teal-600" />
                        </div>
                        <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Pipeline Health</span>
                    </div>
                </div>
                {trendValue > 0 && (
                    <div className={`
                        px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1
                        ${trend === 'up' ? 'bg-green-50 text-green-700' : trend === 'down' ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-600'}
                    `}>
                        <ArrowUpRight size={12} className={trend === 'down' ? 'rotate-90' : ''} />
                        {trend === 'up' ? '+' : trend === 'down' ? '-' : ''}{trendValue}%
                    </div>
                )}
            </div>

            <div className="mt-4">
                <div className="flex items-baseline gap-2">
                    <span className="text-6xl font-bold text-gray-900">{percentage}%</span>
                    <span className="text-lg text-gray-400 font-medium">/ 100%</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">Leads in positive stages</p>
            </div>

            <div className="mt-6">
                <div className="flex justify-between text-xs font-medium text-gray-500 mb-2">
                    <span>Efficiency</span>
                    <span className="text-teal-600">{percentage > 20 ? 'Good' : 'Needs Focus'}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div
                        className="bg-teal-500 h-full rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${percentage}%` }}
                    ></div>
                </div>
            </div>
        </div>
    );
}
