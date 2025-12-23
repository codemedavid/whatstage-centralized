import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { supabase } from '@/app/lib/supabase';

// Cache for tenant routes to minimize DB lookups
const routeCache = new Map<string, { url: string; cachedAt: number }>();
const CACHE_TTL_MS = 60000; // 1 minute
const REQUEST_TIMEOUT_MS = 5000; // 5 seconds timeout for forwards

/**
 * Central Webhook Router
 * 
 * This endpoint receives ALL webhook events from Facebook (for all customers).
 * It looks up the destination URL based on Page ID and forwards the request.
 * 
 * Security: Validates Facebook signature before processing
 * Performance: Responds to Facebook immediately, forwards async with timeout
 * Reliability: Failed forwards are stored in dead letter queue for retry
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
        // Get raw body for signature validation
        const rawBody = await request.text();

        // Validate Facebook signature
        const signature = request.headers.get('X-Hub-Signature-256');
        if (!verifyFacebookSignature(signature, rawBody)) {
            console.warn('[Central Router] Invalid or missing Facebook signature');
            return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
        }

        const body = JSON.parse(rawBody);

        // Facebook sends events in 'entry' array
        if (!body.object || body.object !== 'page' || !body.entry) {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        // Respond to Facebook immediately (fire-and-forget pattern)
        // This prevents Facebook from timing out while we forward to tenants
        const responsePromise = NextResponse.json({ status: 'received' }, { status: 200 });

        // Process forwards asynchronously (don't await)
        processForwards(body).catch(err => {
            console.error('[Central Router] Background processing error:', err);
        });

        const duration = Date.now() - startTime;
        console.log(`[Central Router] Responded in ${duration}ms, forwarding in background`);

        return responsePromise;

    } catch (error) {
        console.error('[Central Router] Error processing webhook:', error);
        // Still return 200 to prevent Facebook from disabling the webhook
        return NextResponse.json({ status: 'error' }, { status: 200 });
    }
}

/**
 * Process and forward webhook entries to tenant destinations
 */
async function processForwards(body: any): Promise<void> {
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

        // Forward with timeout
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

            const response = await fetch(destinationUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Forwarded-By': 'central-router',
                    'X-Original-Page-Id': pageId,
                },
                body: JSON.stringify(body),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            console.log(`[Central Router] Forwarded to ${destinationUrl} - Status: ${response.status}`);
            return { pageId, status: response.status };

        } catch (fetchError: any) {
            const errorMessage = fetchError.name === 'AbortError'
                ? 'Request timed out'
                : fetchError.message || 'Unknown error';

            console.error(`[Central Router] Failed to forward to ${destinationUrl}: ${errorMessage}`);

            // Store in dead letter queue for retry
            await storeFailedEvent(pageId, destinationUrl, body, errorMessage);

            return { pageId, error: errorMessage };
        }
    });

    await Promise.all(forwardPromises);
}

/**
 * Validate Facebook webhook signature using HMAC-SHA256
 */
function verifyFacebookSignature(signature: string | null, rawBody: string): boolean {
    const appSecret = process.env.FACEBOOK_APP_SECRET;

    // Skip validation if no app secret is configured (development mode)
    if (!appSecret) {
        console.warn('[Central Router] FACEBOOK_APP_SECRET not set, skipping signature validation');
        return true;
    }

    if (!signature) {
        return false;
    }

    // Signature format: "sha256=<hash>"
    const expectedSignature = 'sha256=' + createHmac('sha256', appSecret)
        .update(rawBody)
        .digest('hex');

    // Use timing-safe comparison to prevent timing attacks
    if (signature.length !== expectedSignature.length) {
        return false;
    }

    let isValid = true;
    for (let i = 0; i < signature.length; i++) {
        if (signature[i] !== expectedSignature[i]) {
            isValid = false;
        }
    }

    return isValid;
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

/**
 * Store failed webhook event in dead letter queue for later retry
 */
async function storeFailedEvent(
    pageId: string,
    destinationUrl: string,
    payload: any,
    errorMessage: string
): Promise<void> {
    try {
        // Calculate next retry with exponential backoff (5 min, 15 min, 45 min)
        const nextRetryAt = new Date(Date.now() + 5 * 60 * 1000); // First retry in 5 minutes

        await supabase
            .from('failed_webhook_events')
            .insert({
                page_id: pageId,
                destination_url: destinationUrl,
                payload: payload,
                error_message: errorMessage,
                next_retry_at: nextRetryAt.toISOString(),
            });

        console.log(`[Central Router] Stored failed event for Page ID: ${pageId} for retry`);
    } catch (err) {
        console.error('[Central Router] Failed to store event in dead letter queue:', err);
    }
}
