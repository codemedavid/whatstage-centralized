import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';

/**
 * Tenant Registration API for Central Router
 * 
 * Use this to register/unregister Facebook Page IDs to customer instances.
 * This should be called after deploying a new customer to register their page.
 */

// GET: List all registered tenants
export async function GET() {
    try {
        const { data, error } = await supabase
            .from('tenant_routes')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ tenants: data });
    } catch (error) {
        console.error('[Register] Error listing tenants:', error);
        return NextResponse.json({ error: 'Failed to list tenants' }, { status: 500 });
    }
}

// POST: Register a new tenant route
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { page_id, tenant_name, destination_url, secret_key } = body;

        // Validation
        if (!page_id || !tenant_name || !destination_url) {
            return NextResponse.json(
                { error: 'Missing required fields: page_id, tenant_name, destination_url' },
                { status: 400 }
            );
        }

        // Validate URL format
        try {
            new URL(destination_url);
        } catch {
            return NextResponse.json(
                { error: 'Invalid destination_url format' },
                { status: 400 }
            );
        }

        // Upsert the route (update if page_id exists, insert otherwise)
        const { data, error } = await supabase
            .from('tenant_routes')
            .upsert(
                {
                    page_id,
                    tenant_name,
                    destination_url,
                    secret_key: secret_key || null,
                    is_active: true,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: 'page_id' }
            )
            .select()
            .single();

        if (error) throw error;

        console.log(`[Register] Tenant registered: ${tenant_name} -> ${destination_url}`);

        return NextResponse.json({
            success: true,
            message: `Tenant "${tenant_name}" registered successfully`,
            tenant: data,
        });

    } catch (error) {
        console.error('[Register] Error registering tenant:', error);
        return NextResponse.json({ error: 'Failed to register tenant' }, { status: 500 });
    }
}

// DELETE: Deactivate a tenant route
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const pageId = searchParams.get('page_id');

        if (!pageId) {
            return NextResponse.json(
                { error: 'Missing page_id query parameter' },
                { status: 400 }
            );
        }

        const { error } = await supabase
            .from('tenant_routes')
            .update({ is_active: false, updated_at: new Date().toISOString() })
            .eq('page_id', pageId);

        if (error) throw error;

        console.log(`[Register] Tenant deactivated: Page ID ${pageId}`);

        return NextResponse.json({
            success: true,
            message: `Route for Page ID "${pageId}" has been deactivated`,
        });

    } catch (error) {
        console.error('[Register] Error deactivating tenant:', error);
        return NextResponse.json({ error: 'Failed to deactivate tenant' }, { status: 500 });
    }
}
