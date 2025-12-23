import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';

export async function GET() {
    try {
        // 1. Check Store Settings
        const { data: storeSettings, error: storeError } = await supabase
            .from('store_settings')
            .select('id, setup_completed')
            .single();

        // PGRST116 is "no rows returned", which means no store set up yet
        const hasStore = !storeError && !!storeSettings;

        // 2. Check Facebook Page Connection
        const { count: facebookCount, error: fbError } = await supabase
            .from('connected_pages')
            .select('*', { count: 'exact', head: true })
            .eq('is_active', true);

        const hasFacebookPage = !fbError && (facebookCount || 0) > 0;

        // 3. Check Products
        const { count: productCount, error: productError } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true });

        const hasProducts = !productError && (productCount || 0) > 0;

        return NextResponse.json({
            hasStore,
            hasFacebookPage,
            hasProducts
        }, {
            headers: {
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120'
            }
        });

    } catch (error) {
        console.error('Error checking dashboard status:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
