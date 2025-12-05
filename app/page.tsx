'use client';

import { useState } from "react";
import KnowledgeBase from "./components/KnowledgeBase";
import ChatPreview from "./components/ChatPreview";
import Header from "./components/Header";
import DocumentEditor from "./components/DocumentEditor";
import RulesEditor from "./components/RulesEditor";
import { FileText, Bot } from "lucide-react";

export default function Home() {
  const [selectedDocText, setSelectedDocText] = useState('');
  const [activeTab, setActiveTab] = useState<'documents' | 'rules'>('documents');

  const handleSaveDocument = async (text: string) => {
    try {
      await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      window.location.reload();
    } catch (error) {
      console.error('Failed to save document:', error);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <KnowledgeBase onSelect={setSelectedDocText} />

        {/* Main Content Area with Tabs */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tab Bar */}
          <div className="h-12 bg-white border-b border-gray-200 flex items-center px-4 gap-1 flex-shrink-0">
            <button
              onClick={() => setActiveTab('documents')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'documents'
                  ? 'bg-teal-50 text-teal-700 border border-teal-200'
                  : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
              <FileText size={16} />
              Documents
            </button>
            <button
              onClick={() => setActiveTab('rules')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'rules'
                  ? 'bg-teal-50 text-teal-700 border border-teal-200'
                  : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
              <Bot size={16} />
              Bot Rules
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'documents' ? (
              <DocumentEditor initialText={selectedDocText} onSave={handleSaveDocument} />
            ) : (
              <RulesEditor />
            )}
          </div>
        </div>

        <ChatPreview />
      </div>
    </div>
  );
}
