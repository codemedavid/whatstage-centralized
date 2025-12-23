'use client';

import { useState, useCallback, useEffect } from 'react';
import {
    User,
    UserX,
    Play,
    RefreshCw,
    AlertTriangle,
    CheckCircle,
    Clock,
    MessageSquare,
    Filter,
    ArrowUpDown,
    AlertOctagon
} from 'lucide-react';
import type { FlaggedLead } from '@/app/lib/dashboardData';

interface HumanTakeoverPageProps {
    onLeadClick?: (leadId: string, leadData: any) => void;
    initialLeads?: FlaggedLead[];
    initialSessions?: Record<string, number>;
    onRefresh?: () => Promise<void>;
    onUpdateLeads?: (leads: FlaggedLead[]) => void;
    onUpdateSessions?: (sessions: Record<string, number>) => void;
}

type SortField = 'name' | 'priority' | 'flaggedAt' | 'reason';
type SortDirection = 'asc' | 'desc';
type PriorityFilter = 'all' | 'critical' | 'high' | 'medium' | 'low';

const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
const priorityColors = {
    critical: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', badge: 'bg-red-500' },
    high: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200', badge: 'bg-orange-500' },
    medium: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200', badge: 'bg-yellow-500' },
    low: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200', badge: 'bg-gray-400' },
};

export default function HumanTakeoverPage({
    onLeadClick,
    initialLeads = [],
    initialSessions = {},
    onRefresh,
    onUpdateLeads,
    onUpdateSessions
}: HumanTakeoverPageProps) {
    const [flaggedLeads, setFlaggedLeads] = useState<FlaggedLead[]>(initialLeads);
    const [activeSessions, setActiveSessions] = useState<Record<string, number>>(initialSessions);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Filters and sorting
    const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
    const [sortField, setSortField] = useState<SortField>('priority');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

    // Sync with parent state
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

    // Handlers
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

    const toggleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    // Filter and sort leads
    const filteredLeads = flaggedLeads
        .filter(lead => priorityFilter === 'all' || lead.priority === priorityFilter)
        .sort((a, b) => {
            let comparison = 0;
            switch (sortField) {
                case 'name':
                    comparison = a.name.localeCompare(b.name);
                    break;
                case 'priority':
                    comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
                    break;
                case 'flaggedAt':
                    comparison = new Date(a.flaggedAt).getTime() - new Date(b.flaggedAt).getTime();
                    break;
                case 'reason':
                    comparison = a.reason.localeCompare(b.reason);
                    break;
            }
            return sortDirection === 'asc' ? comparison : -comparison;
        });

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffDays > 0) return `${diffDays}d ago`;
        if (diffHours > 0) return `${diffHours}h ago`;
        if (diffMins > 0) return `${diffMins}m ago`;
        return 'Just now';
    };

    const activeSessionCount = Object.keys(activeSessions).length;
    const criticalCount = flaggedLeads.filter(l => l.priority === 'critical').length;
    const highCount = flaggedLeads.filter(l => l.priority === 'high').length;

    return (
        <div className="flex flex-col h-full gap-6">
            {/* Header Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-4 shadow-sm ring-1 ring-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-orange-100">
                            <AlertOctagon size={20} className="text-orange-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{flaggedLeads.length}</p>
                            <p className="text-xs text-gray-500">Total Flags</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-4 shadow-sm ring-1 ring-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-red-100">
                            <AlertTriangle size={20} className="text-red-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{criticalCount}</p>
                            <p className="text-xs text-gray-500">Critical</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-4 shadow-sm ring-1 ring-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-yellow-100">
                            <Clock size={20} className="text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{highCount}</p>
                            <p className="text-xs text-gray-500">High Priority</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-4 shadow-sm ring-1 ring-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-green-100">
                            <User size={20} className="text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{activeSessionCount}</p>
                            <p className="text-xs text-gray-500">Active Takeovers</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Table Card */}
            <div className="bg-white rounded-3xl shadow-sm ring-1 ring-gray-100 flex-1 flex flex-col overflow-hidden">
                {/* Table Header */}
                <div className="p-6 border-b border-gray-100">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-orange-100 text-orange-600 p-2 rounded-full">
                                <MessageSquare size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Flagged Leads</h2>
                                <p className="text-xs text-gray-500">Leads requiring human intervention</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Priority Filter */}
                            <div className="flex items-center gap-2">
                                <Filter size={14} className="text-gray-400" />
                                <select
                                    value={priorityFilter}
                                    onChange={(e) => setPriorityFilter(e.target.value as PriorityFilter)}
                                    className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-orange-200"
                                >
                                    <option value="all">All Priorities</option>
                                    <option value="critical">Critical</option>
                                    <option value="high">High</option>
                                    <option value="medium">Medium</option>
                                    <option value="low">Low</option>
                                </select>
                            </div>

                            {/* Refresh Button */}
                            <button
                                onClick={() => fetchData()}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
                            >
                                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Table Content */}
                <div className="flex-1 overflow-auto">
                    {filteredLeads.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 py-16">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle size={40} className="text-teal-500 opacity-50" />
                            </div>
                            <p className="text-lg font-medium text-gray-600">No flags detected</p>
                            <p className="text-sm mt-1 max-w-sm">
                                {priorityFilter !== 'all'
                                    ? `No ${priorityFilter} priority leads need attention.`
                                    : 'Great job! All AI conversations are running smoothly.'}
                            </p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="px-6 py-3 text-left">
                                        <button
                                            onClick={() => toggleSort('name')}
                                            className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700"
                                        >
                                            Lead
                                            <ArrowUpDown size={12} className={sortField === 'name' ? 'text-orange-500' : ''} />
                                        </button>
                                    </th>
                                    <th className="px-6 py-3 text-left">
                                        <button
                                            onClick={() => toggleSort('priority')}
                                            className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700"
                                        >
                                            Priority
                                            <ArrowUpDown size={12} className={sortField === 'priority' ? 'text-orange-500' : ''} />
                                        </button>
                                    </th>
                                    <th className="px-6 py-3 text-left">
                                        <button
                                            onClick={() => toggleSort('reason')}
                                            className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700"
                                        >
                                            Reason
                                            <ArrowUpDown size={12} className={sortField === 'reason' ? 'text-orange-500' : ''} />
                                        </button>
                                    </th>
                                    <th className="px-6 py-3 text-left">
                                        <button
                                            onClick={() => toggleSort('flaggedAt')}
                                            className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700"
                                        >
                                            Flagged
                                            <ArrowUpDown size={12} className={sortField === 'flaggedAt' ? 'text-orange-500' : ''} />
                                        </button>
                                    </th>
                                    <th className="px-6 py-3 text-left">
                                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            Status
                                        </span>
                                    </th>
                                    <th className="px-6 py-3 text-right">
                                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredLeads.map((lead) => {
                                    const isActive = !!activeSessions[lead.senderId];
                                    const remainingMins = activeSessions[lead.senderId] || 0;
                                    const colors = priorityColors[lead.priority];

                                    return (
                                        <tr
                                            key={lead.id}
                                            onClick={() => onLeadClick?.(lead.id, lead)}
                                            className={`cursor-pointer transition-colors ${isActive ? 'bg-orange-50/50' : 'hover:bg-gray-50'
                                                }`}
                                        >
                                            {/* Lead Info */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden border-2 ${isActive ? 'border-orange-200' : 'border-gray-100'
                                                        }`}>
                                                        {lead.profilePic ? (
                                                            <img src={lead.profilePic} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <User size={18} className="text-gray-400" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900">{lead.name}</p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Priority */}
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase ${colors.bg} ${colors.text}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${colors.badge}`}></span>
                                                    {lead.priority}
                                                </span>
                                            </td>

                                            {/* Reason */}
                                            <td className="px-6 py-4">
                                                <p className="text-sm text-gray-600 max-w-xs truncate" title={lead.reason}>
                                                    {lead.reason}
                                                </p>
                                            </td>

                                            {/* Flagged Time */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                                                    <Clock size={14} />
                                                    {formatTimeAgo(lead.flaggedAt)}
                                                </div>
                                            </td>

                                            {/* Status */}
                                            <td className="px-6 py-4">
                                                {isActive ? (
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                                                        <span className="text-xs font-medium text-orange-700">
                                                            Taking over • {remainingMins}m left
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-400">Awaiting action</span>
                                                )}
                                            </td>

                                            {/* Actions */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    {isActive ? (
                                                        <button
                                                            onClick={(e) => handleResumeAI(lead.senderId, e)}
                                                            disabled={actionLoading === lead.senderId}
                                                            className="px-3 py-1.5 bg-white border border-gray-200 hover:border-emerald-300 hover:text-emerald-600 rounded-lg text-xs font-bold text-gray-600 transition-all flex items-center gap-1.5"
                                                        >
                                                            <Play size={12} />
                                                            Resume AI
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={(e) => handleTakeover(lead.senderId, e)}
                                                            disabled={actionLoading === lead.senderId}
                                                            className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
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
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
