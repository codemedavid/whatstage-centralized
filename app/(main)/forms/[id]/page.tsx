'use client';

import { useState, useEffect, use } from 'react';
import {
    Save,
    ArrowLeft,
    Plus,
    Trash2,
    GripVertical,
    Settings,
    Eye,
    CheckCircle2
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Field {
    id?: string;
    label: string;
    field_type: string;
    is_required: boolean;
    options?: string[];
    placeholder?: string;
    mapping_field?: string | null;
    use_separator?: boolean;
}

interface Form {
    id: string;
    title: string;
    description: string;
    pipeline_stage_id: string;
    settings: any;
    fields: Field[];
}

interface PipelineStage {
    id: string;
    name: string;
}

export default function FormBuilderPage({ params }: { params: Promise<{ id: string }> }) {
    // Unwrap params using use() hook as recommended in Next.js 15+ or await it
    // But since this is a client component, params is a promise in recent Next.js versions?
    // Actually in Next 15 params is async. But let's assume standard behavior or use `use`.
    const { id } = use(params);

    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState<Form | null>(null);
    const [stages, setStages] = useState<PipelineStage[]>([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Stages
                const stagesRes = await fetch('/api/pipeline/stages');
                const stagesData = await stagesRes.json();
                if (Array.isArray(stagesData)) setStages(stagesData);

                // Fetch Form
                const formRes = await fetch(`/api/forms/${id}`);
                if (!formRes.ok) throw new Error('Form not found');
                const formData = await formRes.json();

                // Ensure fields is array
                if (!formData.fields) formData.fields = [];
                setForm(formData);

            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handleSave = async () => {
        if (!form) return;
        setSaving(true);
        setSuccess('');
        setError('');

        try {
            const res = await fetch(`/api/forms/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });

            if (!res.ok) throw new Error('Failed to save');

            setSuccess('Form saved successfully!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const addField = (type: string) => {
        if (!form) return;
        const newField: Field = {
            label: 'New Question',
            field_type: type,
            is_required: false,
            placeholder: '',
            mapping_field: null,
            options: type === 'select' || type === 'radio' ? ['Option 1', 'Option 2'] : undefined,
            use_separator: false
        };
        setForm({ ...form, fields: [...form.fields, newField] });
    };

    const updateField = (index: number, updates: Partial<Field>) => {
        if (!form) return;
        const newFields = [...form.fields];
        newFields[index] = { ...newFields[index], ...updates };
        setForm({ ...form, fields: newFields });
    };

    const removeField = (index: number) => {
        if (!form) return;
        const newFields = form.fields.filter((_, i) => i !== index);
        setForm({ ...form, fields: newFields });
    };

    const moveField = (index: number, direction: 'up' | 'down') => {
        if (!form) return;
        const newFields = [...form.fields];
        if (direction === 'up' && index > 0) {
            [newFields[index], newFields[index - 1]] = [newFields[index - 1], newFields[index]];
        } else if (direction === 'down' && index < newFields.length - 1) {
            [newFields[index], newFields[index + 1]] = [newFields[index + 1], newFields[index]];
        }
        setForm({ ...form, fields: newFields });
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;
    if (!form) return <div className="p-8 text-center">Form not found</div>;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col h-screen overflow-hidden">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                    <Link href="/forms" className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">{form.title}</h1>
                        <p className="text-xs text-gray-500">Form Builder</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <a
                        href={`/f/${id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                    >
                        <Eye size={16} />
                        Preview
                    </a>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors shadow-sm font-medium disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : success ? 'Saved!' : 'Save Changes'}
                        {!saving && !success && <Save size={18} />}
                        {success && <CheckCircle2 size={18} />}
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-hidden flex">
                {/* Main Content: Form Preview / Editor */}
                <div className="flex-1 overflow-y-auto p-8 relative">
                    <div className="max-w-2xl mx-auto space-y-6">
                        {/* Form Settings Card */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                            <div className="flex items-center gap-2 mb-2 text-gray-400 uppercase text-xs font-bold tracking-wider">
                                <Settings size={14} />
                                General Settings
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Form Title</label>
                                <input
                                    type="text"
                                    value={form.title}
                                    onChange={e => setForm({ ...form, title: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={form.description || ''}
                                    onChange={e => setForm({ ...form, description: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all resize-none h-20"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Pipeline Stage</label>
                                <select
                                    value={form.pipeline_stage_id || ''}
                                    onChange={e => setForm({ ...form, pipeline_stage_id: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                                >
                                    <option value="">Select a stage...</option>
                                    {stages.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-500 mt-1">Leads from this form will be added to this stage.</p>
                            </div>
                        </div>

                        {/* Fields List */}
                        <div className="space-y-4">
                            {form.fields.map((field, index) => (
                                <div key={index} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:border-teal-500/30 transition-all group relative">
                                    {/* Action Buttons */}
                                    <div className="absolute right-4 top-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => moveField(index, 'up')} disabled={index === 0} className="p-1 text-gray-400 hover:text-teal-600 disabled:opacity-30">▲</button>
                                        <button onClick={() => moveField(index, 'down')} disabled={index === form.fields.length - 1} className="p-1 text-gray-400 hover:text-teal-600 disabled:opacity-30">▼</button>
                                        <button onClick={() => removeField(index)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                                    </div>

                                    <div className="space-y-4 pr-8">
                                        <div className="flex gap-4">
                                            <div className="flex-1">
                                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">Question Label</label>
                                                <input
                                                    type="text"
                                                    value={field.label}
                                                    onChange={e => updateField(index, { label: e.target.value })}
                                                    className="w-full px-3 py-2 bg-gray-50 border-b-2 border-transparent focus:border-teal-500 outline-none font-medium text-gray-900 placeholder-gray-400 transition-colors"
                                                    placeholder="Enter question..."
                                                />
                                            </div>
                                            <div className="w-1/3">
                                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">Type</label>
                                                <div className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm capitalize">
                                                    {field.field_type}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">Placeholder</label>
                                                <input
                                                    type="text"
                                                    value={field.placeholder || ''}
                                                    onChange={e => updateField(index, { placeholder: e.target.value })}
                                                    className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:border-teal-500 outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">Map to Lead Field</label>
                                                <select
                                                    value={field.mapping_field || ''}
                                                    onChange={e => updateField(index, { mapping_field: e.target.value || null })}
                                                    className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:border-teal-500 outline-none"
                                                >
                                                    <option value="">None (Custom Data)</option>
                                                    <option value="name">Full Name</option>
                                                    <option value="email">Email Address</option>
                                                    <option value="phone">Phone Number</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 mt-2">
                                            <input
                                                type="checkbox"
                                                id={`req-${index}`}
                                                checked={field.is_required}
                                                onChange={e => updateField(index, { is_required: e.target.checked })}
                                                className="rounded text-teal-600 focus:ring-teal-500"
                                            />
                                            <label htmlFor={`req-${index}`} className="text-sm text-gray-600 select-none cursor-pointer">Required</label>
                                        </div>

                                        {field.field_type === 'number' && (
                                            <div className="flex items-center gap-2 mt-2">
                                                <input
                                                    type="checkbox"
                                                    id={`sep-${index}`}
                                                    checked={field.use_separator || false}
                                                    onChange={e => updateField(index, { use_separator: e.target.checked })}
                                                    className="rounded text-teal-600 focus:ring-teal-500"
                                                />
                                                <label htmlFor={`sep-${index}`} className="text-sm text-gray-600 select-none cursor-pointer">Use Number Separator</label>
                                            </div>
                                        )}

                                        {(field.field_type === 'select' || field.field_type === 'radio') && (
                                            <div className="mt-2 bg-gray-50 p-3 rounded-xl border border-dashed border-gray-300">
                                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Options (comma separated)</label>
                                                <input
                                                    type="text"
                                                    value={field.options?.join(', ') || ''}
                                                    onChange={e => updateField(index, { options: e.target.value.split(',').map(s => s.trim()) })}
                                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:border-teal-500 outline-none"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {form.fields.length === 0 && (
                                <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
                                    No fields yet. Add one from the sidebar.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Sidebar: Tools */}
                <div className="w-64 bg-white border-l border-gray-200 p-6 flex flex-col gap-6 shrink-0 z-10">
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Add Field</h3>
                        <div className="grid grid-cols-1 gap-2">
                            {[
                                { type: 'text', label: 'Short Text' },
                                { type: 'textarea', label: 'Long Text' },
                                { type: 'email', label: 'Email' },
                                { type: 'phone', label: 'Phone' },
                                { type: 'number', label: 'Number' },
                                { type: 'select', label: 'Dropdown' },
                                { type: 'radio', label: 'Multiple Choice' },
                                { type: 'checkbox', label: 'Checkbox' },
                            ].map(item => (
                                <button
                                    key={item.type}
                                    onClick={() => addField(item.type)}
                                    className="flex items-center gap-2 p-2.5 text-left bg-gray-50 hover:bg-teal-50 hover:text-teal-700 text-gray-600 rounded-lg transition-colors text-sm font-medium border border-gray-100 hover:border-teal-200"
                                >
                                    <Plus size={14} />
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
