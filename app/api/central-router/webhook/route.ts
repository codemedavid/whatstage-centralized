import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';

// Cache for tenant routes to minimize DB lookups
const routeCache = new Map<string, { url: string; cachedAt: number }>();
const CACHE_TTL_MS = 60000; // 1 minute

/**
 * Central Webhook Router
 * 
 * This endpoint receives ALL webhook events from Facebook (for all customers).
 * It looks up the destination URL based on Page ID and forwards the request.
 */

// GET: Handle Facebook Webhook Verification
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    // Use the same verify token as the main app (or a dedicated one for Router)
    const VERIFY_TOKEN = process.env.FACEBOOK_VERIFY_TOKEN || 'TEST_TOKEN';

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('[Central Router] Webhook verified successfully');
        return new NextResponse(challenge, { status: 200 });
    }

    console.log('[Central Router] Webhook verification failed');
    return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}

// POST: Receive and Forward Webhook Events
export async function POST(request: NextRequest) {
    const startTime = Date.now();

    try {
        const body = await request.json();

        // Facebook sends events in 'entry' array
        if (!body.object || body.object !== 'page' || !body.entry) {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        // Process each entry (usually one, but can be batched)
        const forwardPromises = body.entry.map(async (entry: any) => {
            const pageId = entry.id;

            if (!pageId) {
                console.warn('[Central Router] Entry missing page ID, skipping');
                return null;
            }

            // Look up destination URL
            const destinationUrl = await getDestinationUrl(pageId);

            if (!destinationUrl) {
                console.warn(`[Central Router] No route found for Page ID: ${pageId}`);
                return null;
            }

            // Forward the ENTIRE original body to the destination
            // (Customer instance expects standard Facebook payload)
            try {
                const response = await fetch(destinationUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Forwarded-By': 'central-router',
                        'X-Original-Page-Id': pageId,
                    },
                    body: JSON.stringify(body),
                });

                console.log(`[Central Router] Forwarded to ${destinationUrl} - Status: ${response.status}`);
                return { pageId, status: response.status };
            } catch (fetchError) {
                console.error(`[Central Router] Failed to forward to ${destinationUrl}:`, fetchError);
                return { pageId, error: 'Forward failed' };
            }
        });

        await Promise.all(forwardPromises);

        const duration = Date.now() - startTime;
        console.log(`[Central Router] Processed in ${duration}ms`);

        // Always return 200 to Facebook quickly
        return NextResponse.json({ status: 'received' }, { status: 200 });

    } catch (error) {
        console.error('[Central Router] Error processing webhook:', error);
        // Still return 200 to prevent Facebook from disabling the webhook
        return NextResponse.json({ status: 'error' }, { status: 200 });
    }
}

/**
 * Get destination URL for a Page ID (with caching)
 */
async function getDestinationUrl(pageId: string): Promise<string | null> {
    const now = Date.now();
    const cached = routeCache.get(pageId);

    if (cached && now - cached.cachedAt < CACHE_TTL_MS) {
        return cached.url;
    }

    const { data, error } = await supabase
        .from('tenant_routes')
        .select('destination_url')
        .eq('page_id', pageId)
        .eq('is_active', true)
        .single();

    if (error || !data) {
        return null;
    }

    routeCache.set(pageId, { url: data.destination_url, cachedAt: now });
    return data.destination_url;
}
