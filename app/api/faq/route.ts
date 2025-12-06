import { NextResponse } from 'next/server';
import { addDocument } from '@/app/lib/rag';
import { supabase } from '@/app/lib/supabase';

// GET - List all FAQ entries (documents in Q&A categories)
export async function GET() {
    try {
        // First get all Q&A category IDs
        const { data: qaCategories } = await supabase
            .from('knowledge_categories')
            .select('id')
            .eq('type', 'qa');

        const qaCategoryIds = qaCategories?.map(c => c.id) || [];

        if (qaCategoryIds.length === 0) {
            return NextResponse.json([]);
        }

        // Get documents in Q&A categories
        const { data, error } = await supabase
            .from('documents')
            .select('id, content, metadata, category_id')
            .in('category_id', qaCategoryIds)
            .order('id', { ascending: false });

        if (error) {
            console.error('Error fetching FAQs:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Parse Q&A format from content
        const faqs = data?.map(doc => {
            const content = doc.content || '';
            // Use [\s\S] instead of 's' flag for compatibility
            const qMatch = content.match(/Q:\s*([\s\S]+?)(?:\nA:|$)/);
            const aMatch = content.match(/A:\s*([\s\S]+)/);

            return {
                id: doc.id,
                question: qMatch ? qMatch[1].trim() : content.substring(0, 50),
                answer: aMatch ? aMatch[1].trim() : '',
                categoryId: doc.category_id,
            };
        }) || [];

        return NextResponse.json(faqs);
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST - Create a new FAQ entry
export async function POST(req: Request) {
    try {
        const { question, answer, categoryId } = await req.json();

        if (!question || !answer) {
            return NextResponse.json({ error: 'Question and answer are required' }, { status: 400 });
        }

        // Format as Q&A for optimal RAG retrieval
        const formattedContent = `Q: ${question.trim()}\nA: ${answer.trim()}`;

        // Add document with embedding
        const success = await addDocument(formattedContent, {
            type: 'faq',
            categoryId
        });

        if (!success) {
            return NextResponse.json({ error: 'Failed to process FAQ' }, { status: 500 });
        }

        // Get the newly created document to update its category
        const { data: newDoc } = await supabase
            .from('documents')
            .select('id')
            .eq('content', formattedContent)
            .order('id', { ascending: false })
            .limit(1)
            .single();

        // Update category if provided
        if (newDoc && categoryId) {
            await supabase
                .from('documents')
                .update({ category_id: categoryId })
                .eq('id', newDoc.id);
        }

        return NextResponse.json({
            success: true,
            question,
            answer
        }, { status: 201 });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE - Remove an FAQ entry
export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'FAQ ID is required' }, { status: 400 });
        }

        const { error } = await supabase
            .from('documents')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting FAQ:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
