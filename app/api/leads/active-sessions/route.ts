import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';

/**
 * GET /api/leads/active-sessions
 * Fetch leads with active human takeover sessions
 */
export async function GET() {
    try {
        // Get all active takeover sessions
        const { data: sessions, error } = await supabase
            .from('human_takeover_sessions')
            .select('lead_sender_id, last_human_message_at, timeout_minutes');

        if (error) {
            console.error('Error fetching active sessions:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Filter to only sessions that haven't expired
        const now = new Date();
        const activeSessions = (sessions || []).filter(session => {
            const lastMessage = new Date(session.last_human_message_at);
            const timeoutMs = (session.timeout_minutes || 5) * 60 * 1000;
            const elapsed = now.getTime() - lastMessage.getTime();
            return elapsed < timeoutMs;
        });

        // Return map of sender_id -> remaining time in minutes
        const activeMap: Record<string, number> = {};
        activeSessions.forEach(session => {
            const lastMessage = new Date(session.last_human_message_at);
            const timeoutMs = (session.timeout_minutes || 5) * 60 * 1000;
            const elapsed = now.getTime() - lastMessage.getTime();
            const remainingMs = timeoutMs - elapsed;
            activeMap[session.lead_sender_id] = Math.ceil(remainingMs / 60000);
        });

        return NextResponse.json({
            activeSessions: activeMap,
            count: Object.keys(activeMap).length,
        });
    } catch (error) {
        console.error('Error in active-sessions GET:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
