'use client';

import { Package, Clock, Truck, CheckCircle } from 'lucide-react';
import Link from 'next/link';

interface OrderStatusCardProps {
    pending: number;
    processing: number;
    shipped: number;
    delivered: number;
    isLoading?: boolean;
}

const statusConfig = [
    { key: 'pending', label: 'Pending', icon: Clock, color: 'bg-amber-100 text-amber-700', filter: 'pending' },
    { key: 'processing', label: 'Processing', icon: Package, color: 'bg-blue-100 text-blue-700', filter: 'processing' },
    { key: 'shipped', label: 'Shipped', icon: Truck, color: 'bg-purple-100 text-purple-700', filter: 'shipped' },
    { key: 'delivered', label: 'Delivered', icon: CheckCircle, color: 'bg-green-100 text-green-700', filter: 'delivered' },
];

export default function OrderStatusCard({
    pending,
    processing,
    shipped,
    delivered,
    isLoading = false
}: OrderStatusCardProps) {
    const counts: Record<string, number> = { pending, processing, shipped, delivered };

    if (isLoading) {
        return (
            <div className="bg-white rounded-3xl p-6 h-full shadow-sm ring-1 ring-gray-100 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                    <div className="h-5 w-24 bg-gray-200 rounded"></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-16 bg-gray-100 rounded-xl"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-3xl p-6 h-full shadow-sm ring-1 ring-gray-100">
            <div className="flex items-center gap-3 mb-4">
                <div className="bg-teal-50 p-2.5 rounded-full">
                    <Package size={20} className="text-teal-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Orders</h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {statusConfig.map(({ key, label, icon: Icon, color, filter }) => (
                    <Link
                        key={key}
                        href={`/orders?status=${filter}`}
                        className={`${color} rounded-xl p-3 transition-transform hover:scale-105 cursor-pointer`}
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <Icon size={14} />
                            <span className="text-xs font-medium">{label}</span>
                        </div>
                        <p className="text-2xl font-bold">{counts[key]}</p>
                    </Link>
                ))}
            </div>
        </div>
    );
}
