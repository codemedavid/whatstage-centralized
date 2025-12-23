'use client';

import { Trophy, Flame, MousePointer2 } from 'lucide-react';

const topProducts = [
    { rank: 1, name: 'Premium Package', sales: 234, revenue: '₱456,780' },
    { rank: 2, name: 'Basic Subscription', sales: 189, revenue: '₱189,000' },
    { rank: 3, name: 'Enterprise Plan', sales: 45, revenue: '₱675,000' },
    { rank: 4, name: 'Starter Kit', sales: 156, revenue: '₱78,000' },
    { rank: 5, name: 'Pro Bundle', sales: 98, revenue: '₱245,000' },
];

const hottestLeads = [
    { rank: 1, name: 'John dela Cruz', score: 95, lastActivity: '2 min ago' },
    { rank: 2, name: 'Maria Santos', score: 92, lastActivity: '5 min ago' },
    { rank: 3, name: 'Pedro Reyes', score: 88, lastActivity: '12 min ago' },
    { rank: 4, name: 'Ana Garcia', score: 85, lastActivity: '1 hour ago' },
    { rank: 5, name: 'Luis Mendoza', score: 82, lastActivity: '2 hours ago' },
];

const bestPages = [
    { rank: 1, name: 'Landing Page A', conversions: 156, rate: '12.4%' },
    { rank: 2, name: 'Product Showcase', conversions: 134, rate: '10.8%' },
    { rank: 3, name: 'Pricing Page', conversions: 98, rate: '8.2%' },
    { rank: 4, name: 'Contact Form', conversions: 76, rate: '6.5%' },
    { rank: 5, name: 'About Us', conversions: 45, rate: '4.1%' },
];

const getRankStyle = (rank: number) => {
    switch (rank) {
        case 1:
            return 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white';
        case 2:
            return 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800';
        case 3:
            return 'bg-gradient-to-r from-orange-400 to-orange-500 text-white';
        default:
            return 'bg-gray-100 text-gray-600';
    }
};

export default function Leaderboards() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Top Products */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                    <Trophy size={18} className="text-yellow-500" />
                    <h3 className="text-sm font-semibold text-gray-700">Top Products</h3>
                </div>
                <div className="space-y-3">
                    {topProducts.map((product) => (
                        <div key={product.rank} className="flex items-center gap-3">
                            <span
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${getRankStyle(
                                    product.rank
                                )}`}
                            >
                                {product.rank}
                            </span>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800 truncate">{product.name}</p>
                                <p className="text-xs text-gray-400">{product.sales} sales</p>
                            </div>
                            <span className="text-sm font-semibold text-gray-700">{product.revenue}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Hottest Leads */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                    <Flame size={18} className="text-orange-500" />
                    <h3 className="text-sm font-semibold text-gray-700">Hottest Leads</h3>
                </div>
                <div className="space-y-3">
                    {hottestLeads.map((lead) => (
                        <div key={lead.rank} className="flex items-center gap-3">
                            <span
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${getRankStyle(
                                    lead.rank
                                )}`}
                            >
                                {lead.rank}
                            </span>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800 truncate">{lead.name}</p>
                                <p className="text-xs text-gray-400">{lead.lastActivity}</p>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-full"
                                        style={{ width: `${lead.score}%` }}
                                    />
                                </div>
                                <span className="text-xs font-medium text-gray-600">{lead.score}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Best Converting Pages */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                    <MousePointer2 size={18} className="text-blue-500" />
                    <h3 className="text-sm font-semibold text-gray-700">Best Converting Pages</h3>
                </div>
                <div className="space-y-3">
                    {bestPages.map((page) => (
                        <div key={page.rank} className="flex items-center gap-3">
                            <span
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${getRankStyle(
                                    page.rank
                                )}`}
                            >
                                {page.rank}
                            </span>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800 truncate">{page.name}</p>
                                <p className="text-xs text-gray-400">{page.conversions} conversions</p>
                            </div>
                            <span className="text-sm font-semibold text-emerald-600">{page.rate}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
