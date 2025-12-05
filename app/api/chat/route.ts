import { NextResponse } from 'next/server';
import { getBotResponse } from '@/app/lib/chatService';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { message, sessionId } = body;

        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        // Use provided sessionId or generate a web session identifier
        const senderId = sessionId || `web_${Date.now()}`;

        const reply = await getBotResponse(message, senderId);

        return NextResponse.json({ reply, sessionId: senderId });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
