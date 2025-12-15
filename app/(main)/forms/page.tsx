'use client';

import { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    FileText,
    MoreHorizontal,
    Pencil,
    Trash2,
    Eye,
    Loader2,
    Copy
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Form {
    id: string;
    title: string;
    description: string;
    is_active: boolean;
    created_at: string;
    submissions_count?: number; // Optional if we join later
}

export default function FormsPage() {
    const [forms, setForms] = useState<Form[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();

    useEffect(() => {
        fetchForms();
    }, []);

    const fetchForms = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/forms');
            const data = await res.json();
            if (Array.isArray(data)) {
                setForms(data);
            }
        } catch (error) {
            console.error('Failed to fetch forms:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateForm = async () => {
        try {
            const res = await fetch('/api/forms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: 'Untitled Form',
                    description: 'New lead generation form',
                    settings: {}
                })
            });

            if (res.ok) {
                const newForm = await res.json();
                router.push(`/forms/${newForm.id}`);
            }
        } catch (error) {
            console.error('Failed to create form:', error);
        }
    };

    const handleDeleteForm = async (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this form?')) return;

        try {
            const res = await fetch(`/api/forms/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setForms(forms.filter(f => f.id !== id));
            }
        } catch (error) {
            console.error('Failed to delete form:', error);
        }
    };

    const copyPublicLink = (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();
        const url = `${window.location.origin}/forms/${id}`;
        navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
    };

    const filteredForms = forms.filter(f =>
        f.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="animate-spin text-teal-500" size={40} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Forms</h1>
                        <p className="text-gray-500 mt-1">Create and manage lead generation forms</p>
                    </div>
                    <button
                        onClick={handleCreateForm}
                        className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors shadow-sm font-medium"
                    >
                        <Plus size={20} />
                        Create Form
                    </button>
                </div>

                {/* Search */}
                <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm mb-6 max-w-md">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search forms..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 text-black pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm"
                        />
                    </div>
                </div>

                {/* Grid */}
                {filteredForms.length === 0 ? (
                    <div className="text-center py-24 bg-white rounded-3xl border border-gray-200 border-dashed">
                        <div className="bg-gray-50 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                            <FileText size={32} className="text-gray-400" />
                        </div>
                        <h3 className="text-gray-900 font-medium text-lg">No forms created yet</h3>
                        <p className="text-gray-500 text-sm mt-1 mb-6">Create your first form to start collecting leads</p>
                        <button
                            onClick={handleCreateForm}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100 transition-colors font-medium text-sm"
                        >
                            <Plus size={16} />
                            Create New Form
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredForms.map((form) => (
                            <Link
                                key={form.id}
                                href={`/forms/${form.id}`}
                                className="group bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-teal-500/50 transition-all duration-200 flex flex-col h-full"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-teal-50 text-teal-600 rounded-xl group-hover:scale-110 transition-transform duration-200">
                                        <FileText size={24} />
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className={`w-2 h-2 rounded-full ${form.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                                    </div>
                                </div>

                                <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-1 group-hover:text-teal-600 transition-colors">
                                    {form.title}
                                </h3>
                                <p className="text-gray-500 text-sm mb-6 line-clamp-2 min-h-[40px]">
                                    {form.description || 'No description'}
                                </p>

                                <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between text-gray-400">
                                    <span className="text-xs font-medium">
                                        {new Date(form.created_at).toLocaleDateString()}
                                    </span>

                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => copyPublicLink(e, form.id)}
                                            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-teal-600"
                                            title="Copy Public Link"
                                        >
                                            <Copy size={16} />
                                        </button>
                                        <button
                                            onClick={(e) => handleDeleteForm(e, form.id)}
                                            className="p-1.5 hover:bg-red-50 rounded-lg text-gray-500 hover:text-red-500"
                                            title="Delete Form"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
