'use client';

import { useState, useCallback } from 'react';
import { Store, Facebook, RefreshCw, CheckCircle, AlertOctagon } from 'lucide-react';
import Link from 'next/link';
import type { DashboardStatus } from '@/app/lib/dashboardData';

interface ActionItemsProps {
    initialStatus: DashboardStatus | null;
    onRefresh?: () => Promise<void>;
}

export default function ActionItems({ initialStatus, onRefresh }: ActionItemsProps) {
    const [status, setStatus] = useState<DashboardStatus | null>(initialStatus);
    const [loading, setLoading] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            if (onRefresh) {
                await onRefresh();
            } else {
                const statusRes = await fetch('/api/dashboard/status');
                if (statusRes.ok) setStatus(await statusRes.json());
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    }, [onRefresh]);

    const items: any[] = [];

    // Setup Items
    if (status && !status.hasStore) items.push({ type: 'setup', title: 'Setup Store', sub: 'Required', icon: Store });
    if (status && !status.hasFacebookPage) items.push({ type: 'setup', title: 'Connect Facebook', sub: 'Required', icon: Facebook });

    return (
        <div className="bg-white rounded-3xl p-6 h-full flex flex-col shadow-sm ring-1 ring-gray-100">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <div className="bg-teal-600 text-white p-2 rounded-full">
                        <AlertOctagon size={18} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Alerts & Actions</h2>
                        <p className="text-xs text-gray-500">System checks</p>
                    </div>
                </div>
                <button
                    onClick={() => fetchData()}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <RefreshCw size={16} className={loading ? 'animate-spin text-teal-600' : 'text-gray-400'} />
                </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                {items.length === 0 && (
                    <div className="mt-8 text-center text-gray-500">
                        <CheckCircle className="mx-auto mb-2 opacity-50 text-teal-500" />
                        <p className="text-sm">All caught up!</p>
                        <p className="text-xs text-gray-400 mt-1">System is running smoothly</p>
                    </div>
                )}

                {items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl transition-all group border bg-white hover:bg-gray-50 border-gray-100 hover:border-gray-200">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            {/* Icon */}
                            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-teal-50 text-teal-600">
                                <item.icon size={18} />
                            </div>

                            {/* Content */}
                            <div className="min-w-0 flex-1">
                                <h3 className="text-sm font-bold text-gray-800 truncate">{item.title}</h3>
                                <p className="text-xs text-gray-500 truncate">{item.sub}</p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex-shrink-0 ml-2">
                            <Link
                                href={item.title.includes('Store') ? '/setup' : '/settings'}
                                className="text-xs bg-teal-600 text-white px-3 py-1.5 rounded-full hover:bg-teal-700 transition-colors font-medium"
                            >
                                Fix
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
