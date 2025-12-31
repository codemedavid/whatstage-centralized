'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Calendar,
    Clock,
    User,
    Phone,
    Mail,
    MapPin,
    FileText,
    Trash2,
    Loader2,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';
import { useState } from 'react';

interface Appointment {
    id: string;
    sender_psid: string;
    customer_name: string | null;
    facebook_name?: string | null;
    customer_email: string | null;
    customer_phone: string | null;
    appointment_date: string;
    start_time: string;
    end_time: string;
    notes: string | null;
    status: string;
    created_at: string;
    properties?: {
        title: string;
        address: string | null;
    } | null;
}

interface AppointmentDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    appointment: Appointment | null;
    onCancel?: (id: string) => Promise<void>;
}

export default function AppointmentDetailsModal({
    isOpen,
    onClose,
    appointment,
    onCancel
}: AppointmentDetailsModalProps) {
    const [cancelling, setCancelling] = useState(false);

    if (!isOpen || !appointment) return null;

    const formatTime = (time: string) => {
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    const formatDate = (dateStr: string) => {
        const [year, month, day] = dateStr.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const handleCancel = async () => {
        if (!onCancel || !confirm('Are you sure you want to cancel this appointment?')) return;
        setCancelling(true);
        try {
            await onCancel(appointment.id);
            onClose();
        } catch (err) {
            console.error('Failed to cancel appointment:', err);
            alert('Failed to cancel appointment');
        } finally {
            setCancelling(false);
        }
    };

    const getStatusDisplay = (status: string) => {
        switch (status) {
            case 'confirmed':
                return { label: 'Confirmed', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 };
            case 'pending':
                return { label: 'Pending', color: 'bg-yellow-100 text-yellow-700', icon: Clock };
            case 'cancelled':
                return { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: AlertCircle };
            case 'completed':
                return { label: 'Completed', color: 'bg-blue-100 text-blue-700', icon: CheckCircle2 };
            case 'no_show':
                return { label: 'No Show', color: 'bg-gray-100 text-gray-700', icon: AlertCircle };
            default:
                return { label: status, color: 'bg-gray-100 text-gray-700', icon: Clock };
        }
    };

    const statusInfo = getStatusDisplay(appointment.status);
    const StatusIcon = statusInfo.icon;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
                    >
                        <div
                            className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden pointer-events-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="relative bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-white">
                                <button
                                    onClick={onClose}
                                    className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                                >
                                    <X size={18} />
                                </button>

                                {/* Avatar & Name */}
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                                        <User size={32} className="text-white/80" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h2 className="text-xl font-bold truncate">
                                            {appointment.customer_name || 'Guest Booking'}
                                        </h2>
                                        {appointment.facebook_name && appointment.facebook_name !== appointment.customer_name && (
                                            <p className="text-sm text-white/80 truncate">
                                                FB: {appointment.facebook_name}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Status Badge */}
                                <div className="mt-4">
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${statusInfo.color}`}>
                                        <StatusIcon size={14} />
                                        {statusInfo.label}
                                    </span>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                                {/* Date & Time */}
                                <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 bg-emerald-100 rounded-xl">
                                            <Calendar size={20} className="text-emerald-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-emerald-600 font-medium uppercase tracking-wide">Appointment Date</p>
                                            <p className="text-gray-900 font-bold">{formatDate(appointment.appointment_date)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-emerald-100 rounded-xl">
                                            <Clock size={20} className="text-emerald-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-emerald-600 font-medium uppercase tracking-wide">Time</p>
                                            <p className="text-gray-900 font-bold">
                                                {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Property Info (if property viewing) */}
                                {appointment.properties && (
                                    <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-blue-100 rounded-xl">
                                                <MapPin size={20} className="text-blue-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs text-blue-600 font-medium uppercase tracking-wide">Property Viewing</p>
                                                <p className="text-gray-900 font-bold truncate">{appointment.properties.title}</p>
                                                {appointment.properties.address && (
                                                    <p className="text-sm text-gray-600 mt-1">{appointment.properties.address}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Customer Details */}
                                <div className="space-y-4">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Customer Information</h3>

                                    <div className="grid grid-cols-1 gap-3">
                                        {/* Email */}
                                        <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
                                            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                                                <Mail size={16} />
                                            </div>
                                            <div className="overflow-hidden flex-1">
                                                <p className="text-xs text-gray-500">Email</p>
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {appointment.customer_email || 'Not provided'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Phone */}
                                        <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
                                            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                                                <Phone size={16} />
                                            </div>
                                            <div className="overflow-hidden flex-1">
                                                <p className="text-xs text-gray-500">Phone</p>
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {appointment.customer_phone || 'Not provided'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Notes */}
                                {appointment.notes && (
                                    <div className="space-y-2">
                                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                            <FileText size={14} />
                                            Notes / Special Instructions
                                        </h3>
                                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                            <p className="text-gray-700 text-sm whitespace-pre-wrap">
                                                {appointment.notes}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Booking Metadata */}
                                <div className="pt-4 border-t border-gray-100">
                                    <p className="text-xs text-gray-400">
                                        Booked on {new Date(appointment.created_at).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric',
                                            hour: 'numeric',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                            </div>

                            {/* Footer Actions */}
                            {appointment.status !== 'cancelled' && (
                                <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                                    <button
                                        onClick={onClose}
                                        className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors"
                                    >
                                        Close
                                    </button>
                                    <button
                                        onClick={handleCancel}
                                        disabled={cancelling}
                                        className="px-4 py-2 bg-red-50 text-red-600 font-medium rounded-xl hover:bg-red-100 transition-colors flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {cancelling ? (
                                            <Loader2 size={16} className="animate-spin" />
                                        ) : (
                                            <Trash2 size={16} />
                                        )}
                                        Cancel Appointment
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
