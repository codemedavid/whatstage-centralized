'use client';

import { useState, useCallback, useEffect } from 'react';
import { User, UserX, Play, RefreshCw, AlertOctagon, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import type { FlaggedLead } from '@/app/lib/dashboardData';

interface HumanTakeoverCardProps {
    onLeadClick?: (leadId: string, leadData: any) => void;
    initialLeads?: FlaggedLead[];
    initialSessions?: Record<string, number>;
    onRefresh?: () => Promise<void>;
    onUpdateLeads?: (leads: FlaggedLead[]) => void;
    onUpdateSessions?: (sessions: Record<string, number>) => void;
}

const priorityColors = {
    critical: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', icon: 'bg-red-50 text-red-500' },
    high: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200', icon: 'bg-orange-50 text-orange-500' },
    medium: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200', icon: 'bg-yellow-50 text-yellow-500' },
    low: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200', icon: 'bg-gray-50 text-gray-500' },
};

export default function HumanTakeoverCard({
    onLeadClick,
    initialLeads = [],
    initialSessions = {},
    onRefresh,
    onUpdateLeads,
    onUpdateSessions
}: HumanTakeoverCardProps) {
    const [flaggedLeads, setFlaggedLeads] = useState<FlaggedLead[]>(initialLeads);
    const [loading, setLoading] = useState(false);
    const [activeSessions, setActiveSessions] = useState<Record<string, number>>(initialSessions);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Update local state when parent updates
    useEffect(() => {
        setFlaggedLeads(initialLeads);
    }, [initialLeads]);

    useEffect(() => {
        setActiveSessions(initialSessions);
    }, [initialSessions]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            if (onRefresh) {
                await onRefresh();
            } else {
                const [leadsRes, sessionsRes] = await Promise.all([
                    fetch('/api/leads/needs-attention'),
                    fetch('/api/leads/active-sessions'),
                ]);

                if (leadsRes.ok) {
                    const data = await leadsRes.json();
                    const leads = data.leads || [];
                    setFlaggedLeads(leads);
                    onUpdateLeads?.(leads);
                }

                if (sessionsRes.ok) {
                    const data = await sessionsRes.json();
                    const sessions = data.activeSessions || {};
                    setActiveSessions(sessions);
                    onUpdateSessions?.(sessions);
                }
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    }, [onRefresh, onUpdateLeads, onUpdateSessions]);

    // Poll for updates every 30 seconds
    useEffect(() => {
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, [fetchData]);

    // Start human takeover for a lead
    const handleTakeover = async (senderId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setActionLoading(senderId);
        try {
            const res = await fetch('/api/leads/takeover', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ senderId, action: 'start' }),
            });
            if (res.ok) {
                const updatedSessions = { ...activeSessions, [senderId]: 5 };
                setActiveSessions(updatedSessions);
                onUpdateSessions?.(updatedSessions);
            }
        } catch (error) {
            console.error('Takeover failed:', error);
        } finally {
            setActionLoading(null);
        }
    };

    // Resume AI for a lead
    const handleResumeAI = async (senderId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setActionLoading(senderId);
        try {
            const res = await fetch('/api/leads/takeover', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ senderId, action: 'end' }),
            });
            if (res.ok) {
                const updatedSessions = { ...activeSessions };
                delete updatedSessions[senderId];
                setActiveSessions(updatedSessions);
                onUpdateSessions?.(updatedSessions);
            }
        } catch (error) {
            console.error('Resume AI failed:', error);
        } finally {
            setActionLoading(null);
        }
    };

    // Resolve a lead (mark as no longer needing attention)
    const handleResolve = async (leadId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setActionLoading(leadId);
        try {
            const res = await fetch('/api/leads/needs-attention', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ leadId }),
            });
            if (res.ok) {
                const updatedLeads = flaggedLeads.filter(l => l.id !== leadId);
                setFlaggedLeads(updatedLeads);
                onUpdateLeads?.(updatedLeads);
            }
        } catch (error) {
            console.error('Resolve failed:', error);
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="bg-white rounded-3xl p-6 h-full flex flex-col shadow-sm ring-1 ring-gray-100 relative overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 z-10 relative">
                <div className="flex items-center gap-3">
                    <div className="bg-orange-100 text-orange-600 p-2 rounded-full ring-4 ring-orange-50">
                        <AlertOctagon size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Human Takeover</h2>
                        <div className="flex items-center gap-2">
                            <p className="text-xs text-gray-500">Leads requiring intervention</p>
                            {Object.keys(activeSessions).length > 0 && (
                                <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                    {Object.keys(activeSessions).length} Active
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => fetchData()}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Content List */}
            <div className="flex-1 overflow-y-auto pr-1 z-10 relative space-y-3">
                {flaggedLeads.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 py-8">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle size={32} className="text-teal-500 opacity-50" />
                        </div>
                        <p className="text-sm font-medium text-gray-600">No flags detected</p>
                        <p className="text-xs mt-1">Great job! All AI conversations are running smoothly.</p>
                    </div>
                )}

                {flaggedLeads.map((lead) => {
                    const isActive = !!activeSessions[lead.senderId];
                    const remainingMins = activeSessions[lead.senderId] || 0;

                    return (
                        <div
                            key={lead.id}
                            onClick={() => onLeadClick?.(lead.id, lead)}
                            className={`flex items-center justify-between p-4 rounded-xl transition-all border group cursor-pointer ${isActive
                                ? 'bg-orange-50 border-orange-200 shadow-sm'
                                : 'bg-white hover:bg-gray-50 border-gray-100 hover:border-gray-200 hover:shadow-sm'
                                }`}
                        >
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                {/* Profile Pic */}
                                <div className="relative">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center overflow-hidden border-2 ${isActive ? 'border-orange-200' : 'border-white shadow-sm'
                                        }`}>
                                        {lead.profilePic ? (
                                            <img src={lead.profilePic} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <User size={20} className="text-gray-400" />
                                        )}
                                    </div>
                                    {/* Priority Badge */}
                                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white ${lead.priority === 'critical' ? 'bg-red-500 text-white' :
                                        lead.priority === 'high' ? 'bg-orange-500 text-white' :
                                            'bg-yellow-500 text-white'
                                        }`}>
                                        <span className="text-[10px] font-bold">!</span>
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <h3 className="text-sm font-bold text-gray-900 truncate">{lead.name}</h3>
                                        {isActive && (
                                            <span className="bg-orange-100 text-orange-700 text-[10px] px-1.5 rounded font-bold uppercase tracking-wider">
                                                Active
                                            </span>
                                        )}
                                    </div>
                                    <p className={`text-xs truncate ${isActive ? 'text-orange-700' : 'text-gray-500'}`}>
                                        {lead.reason}
                                    </p>
                                    {isActive && (
                                        <p className="text-[10px] text-orange-600 font-medium mt-1 flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                                            Taking over • {remainingMins}m remaining
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                                {isActive ? (
                                    <button
                                        onClick={(e) => handleResumeAI(lead.senderId, e)}
                                        disabled={actionLoading === lead.senderId}
                                        className="px-3 py-1.5 bg-white border border-gray-200 hover:border-emerald-300 hover:text-emerald-600 rounded-lg text-xs font-bold text-gray-600 transition-all flex items-center gap-1.5 shadow-sm"
                                    >
                                        <Play size={12} />
                                        Resume AI
                                    </button>
                                ) : (
                                    <button
                                        onClick={(e) => handleTakeover(lead.senderId, e)}
                                        disabled={actionLoading === lead.senderId}
                                        className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                                    >
                                        <UserX size={12} />
                                        Take Over
                                    </button>
                                )}
                                <button
                                    onClick={(e) => handleResolve(lead.id, e)}
                                    disabled={actionLoading === lead.id}
                                    className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                    title="Mark as Resolved"
                                >
                                    <CheckCircle size={16} />
                                </button>
                            </div>
                        </div>
                    );
                })}

                {flaggedLeads.length > 0 && (
                    <div className="pt-2 text-center">
                        <Link href="/pipeline" className="text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors">
                            View all in pipeline →
                        </Link>
                    </div>
                )}
            </div>

            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-orange-50 to-transparent rounded-full blur-3xl -z-0 opacity-50 pointer-events-none translate-x-32 -translate-y-32"></div>
        </div>
    );
}
