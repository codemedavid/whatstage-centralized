import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';

// GET /api/leads/needs-attention - Fetch leads that need human attention
export async function GET() {
    try {
        const { data, error } = await supabase
            .from('leads')
            .select(`
                id,
                sender_id,
                name,
                profile_pic,
                phone,
                email,
                smart_passive_reason,
                smart_passive_activated_at,
                attention_priority,
                priority_analyzed_at,
                last_message_at,
                current_stage_id,
                pipeline_stages (
                    name,
                    color
                )
            `)
            .eq('needs_human_attention', true)
            .order('smart_passive_activated_at', { ascending: false })
            .limit(20);

        if (error) {
            console.error('Error fetching leads needing attention:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Format the response
        const leads = (data || []).map(lead => ({
            id: lead.id,
            senderId: lead.sender_id,
            name: lead.name || 'Unknown Customer',
            profilePic: lead.profile_pic,
            phone: lead.phone,
            email: lead.email,
            reason: lead.smart_passive_reason || 'Needs assistance',
            flaggedAt: lead.smart_passive_activated_at,
            priority: lead.attention_priority || 'low',
            priorityAnalyzedAt: lead.priority_analyzed_at,
            lastMessageAt: lead.last_message_at,
            stage: lead.pipeline_stages ? {
                name: (lead.pipeline_stages as unknown as { name: string; color: string }).name,
                color: (lead.pipeline_stages as unknown as { name: string; color: string }).color,
            } : null,
        }));

        return NextResponse.json({ leads, count: leads.length });
    } catch (error) {
        console.error('Error in needs-attention GET:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/leads/needs-attention - Resolve a lead (mark as no longer needing attention)
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { leadId, senderId } = body;

        if (!leadId && !senderId) {
            return NextResponse.json({ error: 'leadId or senderId required' }, { status: 400 });
        }

        // Build query based on provided identifier
        let query = supabase
            .from('leads')
            .update({
                needs_human_attention: false,
                smart_passive_activated_at: null,
                smart_passive_reason: null,
                unanswered_question_count: 0,
                recent_questions: [],
            });

        if (leadId) {
            query = query.eq('id', leadId);
        } else {
            query = query.eq('sender_id', senderId);
        }

        const { error } = await query;

        if (error) {
            console.error('Error resolving lead attention:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Lead marked as resolved' });
    } catch (error) {
        console.error('Error in needs-attention POST:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
