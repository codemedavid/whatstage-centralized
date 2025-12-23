"use client";

import { useState } from 'react';
import DashboardHero from './DashboardHero';
import DashboardTabs from './DashboardTabs';

export default function DashboardShell({
    children
}: {
    children: React.ReactNode
}) {
    const [activeTab, setActiveTab] = useState('Overview');

    return (
        <div className="flex flex-col h-full bg-[var(--background)] overflow-y-auto">
            <div className="p-8 pb-32"> {/* Extra padding bottom for scroll */}
                <DashboardHero />

                <div className="bg-white rounded-[32px] p-8 min-h-[500px] shadow-sm">
                    <DashboardTabs activeTab={activeTab} onTabChange={setActiveTab} />

                    <div className="mt-6">
                        {activeTab === 'Overview' ? (
                            children
                        ) : (
                            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                                <p className="text-lg">Content for {activeTab} is coming soon.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
