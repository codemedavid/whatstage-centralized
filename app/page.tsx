'use client';

import { useState } from "react";
import KnowledgeBase from "./components/KnowledgeBase";
import ChatPreview from "./components/ChatPreview";
import Header from "./components/Header";
import DocumentEditor from "./components/DocumentEditor";
import RulesEditor from "./components/RulesEditor";
import CategoryManager from "./components/CategoryManager";
import FAQEditor from "./components/FAQEditor";
import { FileText, Bot } from "lucide-react";

interface Category {
  id: string;
  name: string;
  type: 'general' | 'qa';
  color: string;
}

export default function Home() {
  const [selectedDocText, setSelectedDocText] = useState('');
  const [activeTab, setActiveTab] = useState<'documents' | 'rules'>('documents');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const handleSaveDocument = async (text: string, categoryId?: string) => {
    try {
      await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, categoryId }),
      });
      window.location.reload();
    } catch (error) {
      console.error('Failed to save document:', error);
    }
  };

  // Determine which editor to show based on selected category
  const renderEditor = () => {
    if (activeTab === 'rules') {
      return <RulesEditor />;
    }

    // If a Q&A category is selected, show FAQ editor
    if (selectedCategory?.type === 'qa') {
      return (
        <FAQEditor
          categoryId={selectedCategory.id}
          categoryName={selectedCategory.name}
        />
      );
    }

    // Default: show document editor
    return (
      <DocumentEditor
        initialText={selectedDocText}
        onSave={(text) => handleSaveDocument(text, selectedCategory?.id)}
      />
    );
  };

  return (
    <div className="flex flex-col h-full">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        {/* Category Manager */}
        <CategoryManager
          selectedCategoryId={selectedCategory?.id || null}
          onSelectCategory={setSelectedCategory}
        />

        {/* Knowledge Base - filtered by category */}
        <KnowledgeBase
          onSelect={setSelectedDocText}
        />

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
              {selectedCategory?.type === 'qa' ? 'FAQs' : 'Documents'}
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
            {selectedCategory && (
              <span className="ml-2 text-sm text-gray-500">
                Category: <span className="font-medium text-gray-700">{selectedCategory.name}</span>
              </span>
            )}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            {renderEditor()}
          </div>
        </div>

        <ChatPreview />
      </div>
    </div>
  );
}
