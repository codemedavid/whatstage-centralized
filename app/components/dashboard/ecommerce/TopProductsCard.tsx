'use client';

import { Trophy, Package } from 'lucide-react';
import type { TopProduct } from '@/app/lib/dashboardData';

interface TopProductsCardProps {
    products: TopProduct[];
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

const rankColors = [
    'bg-amber-100 text-amber-700 border-amber-200',
    'bg-gray-100 text-gray-600 border-gray-200',
    'bg-orange-100 text-orange-700 border-orange-200',
    'bg-teal-50 text-teal-700 border-teal-100',
    'bg-blue-50 text-blue-700 border-blue-100',
];

export default function TopProductsCard({
    products,
    isLoading = false
}: TopProductsCardProps) {
    if (isLoading) {
        return (
            <div className="bg-white rounded-3xl p-6 h-full shadow-sm ring-1 ring-gray-100 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                    <div className="h-5 w-28 bg-gray-200 rounded"></div>
                </div>
                <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="h-12 bg-gray-100 rounded-xl"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-3xl p-6 h-full shadow-sm ring-1 ring-gray-100">
            <div className="flex items-center gap-3 mb-4">
                <div className="bg-amber-50 p-2.5 rounded-full">
                    <Trophy size={20} className="text-amber-600" />
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                        Top Products
                    </h3>
                    <p className="text-xs text-gray-400">Last 7 days</p>
                </div>
            </div>

            {products.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                    <Package className="mx-auto mb-2 opacity-50" size={32} />
                    <p className="text-sm">No orders yet</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {products.map((product, index) => (
                        <div
                            key={product.id}
                            className={`flex items-center gap-3 p-3 rounded-xl border ${rankColors[index] || rankColors[4]}`}
                        >
                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center font-bold text-sm shadow-sm">
                                {index + 1}
                            </div>

                            {product.imageUrl ? (
                                <img
                                    src={product.imageUrl}
                                    alt={product.name}
                                    className="w-10 h-10 rounded-lg object-cover"
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center">
                                    <Package size={18} className="text-gray-400" />
                                </div>
                            )}

                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-800 truncate">{product.name}</p>
                                <p className="text-xs text-gray-500">
                                    {product.orderCount} order{product.orderCount !== 1 ? 's' : ''}
                                </p>
                            </div>

                            <p className="font-bold text-sm">{formatCurrency(product.revenue)}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
