'use client';

import { useState, useEffect, use } from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';

interface Field {
    id: string;
    label: string;
    field_type: string;
    is_required: boolean;
    options?: string[];
    placeholder?: string;
    use_separator?: boolean;
}

interface Form {
    id: string;
    title: string;
    description: string;
    fields: Field[];
    settings: any;
}

export default function PublicFormPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [form, setForm] = useState<Form | null>(null);
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchForm = async () => {
            try {
                const res = await fetch(`/api/forms/${id}`);
                if (!res.ok) throw new Error('Form not found or unavailable');
                const data = await res.json();
                setForm(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchForm();
    }, [id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            const res = await fetch('/api/forms/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    form_id: id,
                    data: Object.entries(formData).reduce((acc, [key, value]) => {
                        // Find field definition
                        const field = form?.fields.find(f => f.id === key);
                        // If it's a number field with separator, strip commas
                        if (field?.field_type === 'number' && field?.use_separator && typeof value === 'string') {
                            acc[key] = value.replace(/,/g, '');
                        } else {
                            acc[key] = value;
                        }
                        return acc;
                    }, {} as Record<string, any>)
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Submission failed');
            }

            setSubmitted(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleChange = (fieldId: string, value: any) => {
        setFormData(prev => ({ ...prev, [fieldId]: value }));
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-teal-600" /></div>;
    }

    if (error && !form) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">{error}</div>;
    }

    if (submitted) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white max-w-md w-full p-8 rounded-2xl shadow-lg text-center border border-gray-100">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
                    <p className="text-gray-600">Your submission has been received successfully.</p>
                </div>
            </div>
        );
    }

    if (!form) return null;

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-xl mx-auto">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* Form Header */}
                    <div className="bg-teal-600 p-8 text-white">
                        <h1 className="text-3xl font-bold mb-2">{form.title}</h1>
                        {form.description && (
                            <p className="text-teal-100 text-lg opacity-90">{form.description}</p>
                        )}
                    </div>

                    {/* Form Body */}
                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        {error && (
                            <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
                                {error}
                            </div>
                        )}

                        {form.fields.map((field) => (
                            <div key={field.id || field.label} className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700">
                                    {field.label}
                                    {field.is_required && <span className="text-red-500 ml-1">*</span>}
                                </label>

                                {field.field_type === 'textarea' ? (
                                    <textarea
                                        required={field.is_required}
                                        placeholder={field.placeholder}
                                        onChange={e => handleChange(field.id, e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all resize-y min-h-[100px]"
                                    />
                                ) : field.field_type === 'select' ? (
                                    <select
                                        required={field.is_required}
                                        onChange={e => handleChange(field.id, e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all bg-white"
                                        defaultValue=""
                                    >
                                        <option value="" disabled>Select an option...</option>
                                        {field.options?.map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                ) : field.field_type === 'radio' ? (
                                    <div className="space-y-2 pt-1">
                                        {field.options?.map(opt => (
                                            <label key={opt} className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
                                                <input
                                                    type="radio"
                                                    name={field.id}
                                                    value={opt}
                                                    required={field.is_required}
                                                    onChange={e => handleChange(field.id, e.target.value)}
                                                    className="w-4 h-4 text-teal-600 focus:ring-teal-500 border-gray-300"
                                                />
                                                <span className="text-gray-700 font-medium">{opt}</span>
                                            </label>
                                        ))}
                                    </div>
                                ) : field.field_type === 'number' && field.use_separator ? (
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        required={field.is_required}
                                        placeholder={field.placeholder}
                                        value={formData[field.id] || ''}
                                        onChange={e => {
                                            // Allow digits and dots, remove others
                                            let raw = e.target.value.replace(/[^0-9.]/g, '');

                                            // Start handling basic decimal logic
                                            const parts = raw.split('.');
                                            // If multiple dots, keep only the first two parts (integer and decimal)
                                            if (parts.length > 2) {
                                                raw = parts[0] + '.' + parts.slice(1).join('');
                                            }

                                            const integerPart = parts[0];
                                            const decimalPart = parts.length > 1 ? '.' + parts[1] : '';

                                            // Format integer part
                                            const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

                                            handleChange(field.id, formattedInteger + decimalPart);
                                        }}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                                    />
                                ) : (
                                    <input
                                        type={field.field_type === 'phone' ? 'tel' : field.field_type}
                                        required={field.is_required}
                                        placeholder={field.placeholder}
                                        onChange={e => handleChange(field.id, e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                                    />
                                )}
                            </div>
                        ))}

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-4 px-6 text-white bg-teal-600 hover:bg-teal-700 rounded-xl font-bold text-lg shadow-md hover:shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    'Submit'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
