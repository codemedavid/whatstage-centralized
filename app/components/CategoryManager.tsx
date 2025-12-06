'use client';

import { useState, useEffect } from 'react';
import { Plus, Tag, Trash2, X, HelpCircle, FileText } from 'lucide-react';

interface Category {
    id: string;
    name: string;
    type: 'general' | 'qa';
    color: string;
}

interface CategoryManagerProps {
    selectedCategoryId: string | null;
    onSelectCategory: (category: Category | null) => void;
}

const COLORS = [
    { name: 'gray', bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' },
    { name: 'blue', bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
    { name: 'green', bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
    { name: 'purple', bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
    { name: 'orange', bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
    { name: 'pink', bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-200' },
];

export default function CategoryManager({ selectedCategoryId, onSelectCategory }: CategoryManagerProps) {
    const [categories, setCategories] = useState<Category[]>([]);
    const [showNewCategory, setShowNewCategory] = useState(false);
    const [newName, setNewName] = useState('');
    const [newType, setNewType] = useState<'general' | 'qa'>('general');
    const [newColor, setNewColor] = useState('gray');

    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/categories');
            const data = await res.json();
            if (Array.isArray(data)) {
                setCategories(data);
            }
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleCreate = async () => {
        if (!newName.trim()) return;
        try {
            const res = await fetch('/api/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName, type: newType, color: newColor }),
            });
            if (res.ok) {
                await fetchCategories();
                setNewName('');
                setNewType('general');
                setNewColor('gray');
                setShowNewCategory(false);
            }
        } catch (error) {
            console.error('Failed to create category:', error);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Delete this category? Documents will be uncategorized.')) return;
        try {
            await fetch(`/api/categories?id=${id}`, { method: 'DELETE' });
            await fetchCategories();
            if (selectedCategoryId === id) {
                onSelectCategory(null);
            }
        } catch (error) {
            console.error('Failed to delete category:', error);
        }
    };

    const getColorClasses = (colorName: string) => {
        return COLORS.find(c => c.name === colorName) || COLORS[0];
    };

    return (
        <div className="w-56 flex flex-col h-full bg-gray-50 border-r border-gray-200 flex-shrink-0">
            <div className="p-3 border-b border-gray-200 bg-white">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800 text-sm">Categories</h3>
                    <button
                        onClick={() => setShowNewCategory(true)}
                        className="p-1 hover:bg-gray-100 rounded text-teal-600"
                        title="New Category"
                    >
                        <Plus size={16} />
                    </button>
                </div>
            </div>

            {showNewCategory && (
                <div className="p-3 bg-white border-b border-gray-200 space-y-3">
                    <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Category name"
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                        autoFocus
                    />
                    <div className="flex gap-2">
                        <select
                            value={newType}
                            onChange={(e) => setNewType(e.target.value as 'general' | 'qa')}
                            className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                        >
                            <option value="general">General</option>
                            <option value="qa">Q&A / FAQ</option>
                        </select>
                        <select
                            value={newColor}
                            onChange={(e) => setNewColor(e.target.value)}
                            className="w-20 px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                        >
                            {COLORS.map(c => (
                                <option key={c.name} value={c.name}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleCreate}
                            className="flex-1 px-3 py-1.5 bg-teal-600 text-white text-sm rounded hover:bg-teal-700"
                        >
                            Create
                        </button>
                        <button
                            onClick={() => setShowNewCategory(false)}
                            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {/* All Documents option */}
                <button
                    onClick={() => onSelectCategory(null)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded text-left text-sm transition-colors ${selectedCategoryId === null
                            ? 'bg-teal-100 text-teal-800 border border-teal-200'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                >
                    <Tag size={14} />
                    <span className="flex-1">All Documents</span>
                </button>

                {categories.map((cat) => {
                    const colorClasses = getColorClasses(cat.color);
                    return (
                        <button
                            key={cat.id}
                            onClick={() => onSelectCategory(cat)}
                            className={`w-full group flex items-center gap-2 px-3 py-2 rounded text-left text-sm transition-colors ${selectedCategoryId === cat.id
                                    ? `${colorClasses.bg} ${colorClasses.text} border ${colorClasses.border}`
                                    : 'hover:bg-gray-100 text-gray-700'
                                }`}
                        >
                            {cat.type === 'qa' ? (
                                <HelpCircle size={14} className={colorClasses.text} />
                            ) : (
                                <FileText size={14} className={colorClasses.text} />
                            )}
                            <span className="flex-1 truncate">{cat.name}</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded ${colorClasses.bg} ${colorClasses.text}`}>
                                {cat.type === 'qa' ? 'FAQ' : ''}
                            </span>
                            <button
                                onClick={(e) => handleDelete(cat.id, e)}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded text-gray-400 hover:text-red-600"
                            >
                                <Trash2 size={12} />
                            </button>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
