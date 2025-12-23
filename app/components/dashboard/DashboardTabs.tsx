"use client";

import { AlertOctagon, LayoutGrid } from 'lucide-react';

interface DashboardTabsProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
    humanTakeoverCount?: number;
}

export default function DashboardTabs({ activeTab, onTabChange, humanTakeoverCount = 0 }: DashboardTabsProps) {
    const tabs = [
        { id: 'Overview', label: 'Overview', icon: LayoutGrid },
        { id: 'Human Takeover', label: 'Human Takeover', icon: AlertOctagon, badge: humanTakeoverCount },
    ];

    return (
        <div className="flex items-center gap-2 mb-6 bg-gray-100/80 p-1 rounded-xl w-fit">
            {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <Icon size={16} />
                        {tab.label}
                        {tab.badge !== undefined && tab.badge > 0 && (
                            <span className={`ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full ${isActive
                                    ? 'bg-orange-100 text-orange-600'
                                    : 'bg-gray-200 text-gray-600'
                                }`}>
                                {tab.badge}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}

