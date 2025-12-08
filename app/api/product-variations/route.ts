import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabaseClient';

// GET - List variations for a product
export async function GET(request: NextRequest) {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    let query = supabase
        .from('product_variations')
        .select(`
            *,
            variation_type:product_variation_types(id, name)
        `)
        .order('display_order', { ascending: true });

    if (productId) {
        query = query.eq('product_id', productId);
    }

    const { data, error } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}

// POST - Create a new product variation
export async function POST(request: NextRequest) {
    const supabase = createClient();
    const { productId, variationTypeId, value, price } = await request.json();

    if (!productId || !variationTypeId || !value?.trim() || price === undefined) {
        return NextResponse.json(
            { error: 'Product ID, variation type ID, value, and price are required' },
            { status: 400 }
        );
    }

    const { data, error } = await supabase
        .from('product_variations')
        .insert({
            product_id: productId,
            variation_type_id: variationTypeId,
            value: value.trim(),
            price: parseFloat(price),
        })
        .select(`
            *,
            variation_type:product_variation_types(id, name)
        `)
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}

// PATCH - Update a product variation
export async function PATCH(request: NextRequest) {
    const supabase = createClient();
    const { id, value, price, isActive, displayOrder } = await request.json();

    if (!id) {
        return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const updates: any = {};
    if (value !== undefined) updates.value = value;
    if (price !== undefined) updates.price = parseFloat(price);
    if (isActive !== undefined) updates.is_active = isActive;
    if (displayOrder !== undefined) updates.display_order = displayOrder;

    const { data, error } = await supabase
        .from('product_variations')
        .update(updates)
        .eq('id', id)
        .select(`
            *,
            variation_type:product_variation_types(id, name)
        `)
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}

// DELETE - Delete a product variation
export async function DELETE(request: NextRequest) {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const { error } = await supabase
        .from('product_variations')
        .delete()
        .eq('id', id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
