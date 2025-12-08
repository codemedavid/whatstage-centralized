'use client';

import { X, Check } from 'lucide-react';

interface ProductCategory {
    id: string;
    name: string;
    color: string;
    description: string | null;
}

interface CategoryFormModalProps {
    isOpen: boolean;
    categoryName: string;
    setCategoryName: (name: string) => void;
    categoryColor: string;
    setCategoryColor: (color: string) => void;
    onSave: () => void;
    onClose: () => void;
}

const categoryColors = [
    '#EF4444', '#F97316', '#F59E0B', '#84CC16', '#22C55E',
    '#14B8A6', '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6',
    '#A855F7', '#EC4899', '#F43F5E', '#6B7280'
];

export default function CategoryFormModal({
    isOpen,
    categoryName,
    setCategoryName,
    categoryColor,
    setCategoryColor,
    onSave,
    onClose,
}: CategoryFormModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-xl font-semibold text-gray-900">Add Category</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Category Name *
                        </label>
                        <input
                            type="text"
                            value={categoryName}
                            onChange={(e) => setCategoryName(e.target.value)}
                            placeholder="Enter category name"
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-gray-900"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Color
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {categoryColors.map((color) => (
                                <button
                                    key={color}
                                    onClick={() => setCategoryColor(color)}
                                    className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${categoryColor === color
                                        ? 'ring-2 ring-offset-2 ring-gray-400 scale-110'
                                        : ''
                                        }`}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 text-gray-600 hover:text-gray-800 font-medium rounded-xl hover:bg-gray-100 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onSave}
                        disabled={!categoryName.trim()}
                        className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-xl hover:from-teal-600 hover:to-emerald-600 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-teal-500/25"
                    >
                        <Check size={18} />
                        Add Category
                    </button>
                </div>
            </div>
        </div>
    );
}
