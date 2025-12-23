'use server';

import { NextResponse } from 'next/server';
import { getEcommerceMetrics } from '@/app/lib/dashboardData';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const abandonmentHours = parseInt(searchParams.get('abandonmentHours') || '24', 10);

        const metrics = await getEcommerceMetrics(abandonmentHours);

        return NextResponse.json(metrics);
    } catch (error) {
        console.error('Error fetching e-commerce metrics:', error);
        return NextResponse.json(
            { error: 'Failed to fetch e-commerce metrics' },
            { status: 500 }
        );
    }
}
