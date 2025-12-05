import { NextResponse } from 'next/server';
import { getBotResponse } from '@/app/lib/chatService';
import fs from 'fs';
import path from 'path';

// Reusing the DB helper from chat route (in a real app, this should be a shared utility)
const DB_PATH = path.join(process.cwd(), 'knowledge_db.json');

const readDb = () => {
    if (!fs.existsSync(DB_PATH)) {
        return [];
    }
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    try {
        return JSON.parse(data);
    } catch (e) {
        return [];
    }
};

const SETTINGS_PATH = path.join(process.cwd(), 'settings.json');

const readSettings = () => {
    if (!fs.existsSync(SETTINGS_PATH)) {
        return {};
    }
    const data = fs.readFileSync(SETTINGS_PATH, 'utf-8');
    try {
        return JSON.parse(data);
    } catch (e) {
        return {};
    }
};

export async function GET(req: Request) {
    const settings = readSettings();
    const VERIFY_TOKEN = settings.facebookVerifyToken || process.env.FACEBOOK_VERIFY_TOKEN || 'TEST_TOKEN';
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('WEBHOOK_VERIFIED');
            return new NextResponse(challenge, { status: 200 });
        } else {
            return new NextResponse('Forbidden', { status: 403 });
        }
    }

    return new NextResponse('Bad Request', { status: 400 });
}

// Track processed message IDs to prevent duplicates (Facebook retries webhooks)
const processedMessages = new Set<string>();
const MAX_PROCESSED_CACHE = 1000;

function cleanupProcessedMessages() {
    if (processedMessages.size > MAX_PROCESSED_CACHE) {
        const toDelete = Array.from(processedMessages).slice(0, processedMessages.size - MAX_PROCESSED_CACHE);
        toDelete.forEach(id => processedMessages.delete(id));
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        console.log('Webhook POST received:', JSON.stringify(body, null, 2));

        if (body.object === 'page') {
            for (const entry of body.entry) {
                const webhook_event = entry.messaging?.[0];
                if (!webhook_event) {
                    console.log('No messaging event found in entry:', entry);
                    continue;
                }

                const sender_psid = webhook_event.sender?.id;
                const messageId = webhook_event.message?.mid;

                // Skip if already processed (prevents duplicate responses)
                if (messageId && processedMessages.has(messageId)) {
                    console.log('Skipping duplicate message:', messageId);
                    continue;
                }

                // Mark as processed
                if (messageId) {
                    processedMessages.add(messageId);
                    cleanupProcessedMessages();
                }

                console.log('Processing message from:', sender_psid, 'mid:', messageId);

                if (webhook_event.message && webhook_event.message.text) {
                    console.log('Message text:', webhook_event.message.text);
                    // Process message in background (don't await)
                    handleMessage(sender_psid, webhook_event.message.text).catch(err => {
                        console.error('Error handling message:', err);
                    });
                }
            }
            return new NextResponse('EVENT_RECEIVED', { status: 200 });
        } else {
            console.log('Not a page event:', body.object);
            return new NextResponse('Not Found', { status: 404 });
        }
    } catch (error) {
        console.error('Webhook error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}


// Send typing indicator to show bot is working
async function sendTypingIndicator(sender_psid: string, on: boolean) {
    const settings = readSettings();
    const PAGE_ACCESS_TOKEN = settings.facebookPageAccessToken || process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

    if (!PAGE_ACCESS_TOKEN) return;

    try {
        await fetch(`https://graph.facebook.com/v21.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                recipient: { id: sender_psid },
                sender_action: on ? 'typing_on' : 'typing_off'
            }),
        });
    } catch (error) {
        console.error('Failed to send typing indicator:', error);
    }
}

async function handleMessage(sender_psid: string, received_message: string) {
    console.log('handleMessage called, generating response...');

    // Send typing indicator immediately
    await sendTypingIndicator(sender_psid, true);

    // Process message and send response
    try {
        const responseText = await getBotResponse(received_message, sender_psid);
        console.log('Bot response generated:', responseText.substring(0, 100) + '...');

        const response = {
            text: responseText,
        };

        await callSendAPI(sender_psid, response);
    } finally {
        // Turn off typing indicator
        await sendTypingIndicator(sender_psid, false);
    }
}



async function callSendAPI(sender_psid: string, response: any) {
    const settings = readSettings();
    const PAGE_ACCESS_TOKEN = settings.facebookPageAccessToken || process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

    console.log('callSendAPI called, token present:', !!PAGE_ACCESS_TOKEN);

    if (!PAGE_ACCESS_TOKEN) {
        console.warn('FACEBOOK_PAGE_ACCESS_TOKEN not set, skipping message send.');
        return;
    }

    const requestBody = {
        recipient: {
            id: sender_psid,
        },
        message: response,
    };

    console.log('Sending to Facebook:', JSON.stringify(requestBody, null, 2));

    try {
        const res = await fetch(`https://graph.facebook.com/v21.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
        });

        const resText = await res.text();
        console.log('Facebook API response:', res.status, resText);

        if (!res.ok) {
            console.error('Unable to send message:', resText);
        }
    } catch (error) {
        console.error('Unable to send message:', error);
    }
}

