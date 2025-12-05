'use client';

import { useState, useEffect } from 'react';
import { Save, Check, Loader2 } from 'lucide-react';

interface DocumentEditorProps {
    initialText?: string;
    onSave: (text: string) => Promise<void>;
}

export default function DocumentEditor({ initialText = '', onSave }: DocumentEditorProps) {
    const [text, setText] = useState(initialText);
    const [title, setTitle] = useState('Untitled Document');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        setText(initialText);
    }, [initialText]);

    const handleSave = async () => {
        if (saving || !text.trim()) return; // Prevent multiple clicks

        setSaving(true);
        setSaved(false);

        try {
            await onSave(text);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (error) {
            console.error('Save failed:', error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex-1 bg-gray-100 flex flex-col h-full overflow-hidden relative">
            <div className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4 flex-shrink-0">
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="font-medium text-gray-700 focus:outline-none hover:bg-gray-50 px-2 py-1 rounded"
                />
                <button
                    onClick={handleSave}
                    disabled={saving || saved || !text.trim()}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors ${saved
                            ? 'bg-green-600 text-white'
                            : saving
                                ? 'bg-teal-400 text-white cursor-not-allowed'
                                : 'bg-teal-600 text-white hover:bg-teal-700'
                        } disabled:opacity-70`}
                >
                    {saved ? (
                        <>
                            <Check size={16} />
                            Saved!
                        </>
                    ) : saving ? (
                        <>
                            <Loader2 size={16} className="animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save size={16} />
                            Save
                        </>
                    )}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 flex justify-center">
                <div className="w-full max-w-[816px] min-h-[1056px] bg-white shadow-sm border border-gray-200 p-12 mb-8">
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Type your knowledge here..."
                        className="w-full h-full resize-none focus:outline-none text-gray-800 leading-relaxed"
                        style={{ minHeight: '800px' }}
                    />
                </div>
            </div>
        </div>
    );
}
