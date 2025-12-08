'use client';

import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onClose: () => void;
}

export default function ConfirmModal({
    isOpen,
    title,
    message,
    onConfirm,
    onClose,
}: ConfirmModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6 text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle size={32} className="text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">
                        {title}
                    </h2>
                    <p className="text-gray-500">
                        {message}
                    </p>
                </div>

                <div className="flex items-center gap-3 p-6 pt-2">
                    <button
                        onClick={onClose}
                        className="flex-1 px-6 py-3 text-gray-700 font-medium rounded-xl border border-gray-200 hover:bg-gray-50 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 px-6 py-3 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600 transition-all"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}
