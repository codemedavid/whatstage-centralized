'use client';

import { UserCheck, Clock, ShieldAlert } from 'lucide-react';

export default function AIRecommendations() {
    return (
        <div className="bg-white rounded-3xl p-8 h-full flex flex-col justify-between shadow-sm relative overflow-hidden ring-1 ring-gray-100">
            <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-2">
                    <div className="bg-teal-50 p-2 rounded-lg">
                        <UserCheck size={20} className="text-teal-600" />
                    </div>
                    <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Human Takeover</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div>
                    <p className="text-5xl font-bold text-gray-900">18</p>
                    <p className="text-sm text-gray-500 mt-2">Active Takeovers</p>
                </div>
                <div>
                    <p className="text-5xl font-bold text-gray-900">142</p>
                    <p className="text-sm text-gray-500 mt-2">Resolved this week</p>
                </div>
            </div>

            <div className="mt-8 space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                        <Clock size={16} className="text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">Avg. Resolution Time</span>
                    </div>
                    <span className="font-bold text-gray-900">12m 30s</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-100">
                    <div className="flex items-center gap-3">
                        <ShieldAlert size={16} className="text-red-500" />
                        <span className="text-sm font-medium text-red-700">Crucial Flags</span>
                    </div>
                    <span className="font-bold text-red-700">3 Pending</span>
                </div>
            </div>
        </div>
    );
}
