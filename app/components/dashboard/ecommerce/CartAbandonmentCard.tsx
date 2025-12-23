'use client';

import { ShoppingCart, Clock, Eye, Bell } from 'lucide-react';
import type { CartAbandonmentLead } from '@/app/lib/dashboardData';

interface CartAbandonmentCardProps {
    leads: CartAbandonmentLead[];
    count: number;
    selectedFilter: number;
    onFilterChange: (hours: number) => void;
    onLeadClick?: (leadId: string, leadData: any) => void;
    isLoading?: boolean;
}

const filterOptions = [
    { value: 6, label: '6h' },
    { value: 12, label: '12h' },
    { value: 24, label: '24h' },
    { value: 48, label: '48h' },
];

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

function formatAge(hours: number): string {
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

export default function CartAbandonmentCard({
    leads,
    count,
    selectedFilter,
    onFilterChange,
    onLeadClick,
    isLoading = false
}: CartAbandonmentCardProps) {
    if (isLoading) {
        return (
            <div className="bg-white rounded-3xl p-6 shadow-sm ring-1 ring-gray-100 animate-pulse">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                        <div className="h-5 w-40 bg-gray-200 rounded"></div>
                    </div>
                    <div className="flex gap-2">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="w-10 h-8 bg-gray-200 rounded-full"></div>
                        ))}
                    </div>
                </div>
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-16 bg-gray-100 rounded-xl"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-3xl p-6 shadow-sm ring-1 ring-gray-100">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="bg-amber-50 p-2.5 rounded-full">
                        <ShoppingCart size={20} className="text-amber-600" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                            Cart Abandonment
                        </h3>
                        <p className="text-xs text-gray-400">
                            {count} lead{count !== 1 ? 's' : ''} with pending orders
                        </p>
                    </div>
                </div>

                {/* Filter Pills */}
                <div className="flex gap-1.5">
                    {filterOptions.map(({ value, label }) => (
                        <button
                            key={value}
                            onClick={() => onFilterChange(value)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${selectedFilter === value
                                    ? 'bg-teal-600 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {leads.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                    <ShoppingCart className="mx-auto mb-2 opacity-50" size={32} />
                    <p className="text-sm">No abandoned carts in this period</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {leads.map((lead) => (
                        <div
                            key={lead.orderId}
                            className="flex items-center justify-between p-3 rounded-xl bg-amber-50/50 border border-amber-100 hover:bg-amber-50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                {lead.profilePic ? (
                                    <img
                                        src={lead.profilePic}
                                        alt={lead.name}
                                        className="w-10 h-10 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-amber-200 flex items-center justify-center text-amber-700 font-bold">
                                        {lead.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div>
                                    <p className="font-semibold text-gray-800">{lead.name}</p>
                                    <p className="text-xs text-gray-500">
                                        {lead.itemCount} item{lead.itemCount !== 1 ? 's' : ''} • {formatAge(lead.cartAgeHours)}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <p className="font-bold text-amber-700">{formatCurrency(lead.cartTotal)}</p>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => onLeadClick?.(lead.id, lead)}
                                        className="p-2 rounded-full bg-white text-gray-600 hover:bg-gray-100 transition-colors"
                                        title="View Lead"
                                    >
                                        <Eye size={16} />
                                    </button>
                                    <button
                                        className="p-2 rounded-full bg-teal-600 text-white hover:bg-teal-700 transition-colors"
                                        title="Send Reminder"
                                    >
                                        <Bell size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
