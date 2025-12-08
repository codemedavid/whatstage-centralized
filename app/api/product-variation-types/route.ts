import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabaseClient';

// GET - List all variation types
export async function GET() {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('product_variation_types')
        .select('*')
        .order('display_order', { ascending: true });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}

// POST - Create a new variation type
export async function POST(request: NextRequest) {
    const supabase = createClient();
    const { name } = await request.json();

    if (!name?.trim()) {
        return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const { data, error } = await supabase
        .from('product_variation_types')
        .insert({ name: name.trim() })
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}

// PATCH - Update a variation type
export async function PATCH(request: NextRequest) {
    const supabase = createClient();
    const { id, name, displayOrder } = await request.json();

    if (!id) {
        return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (displayOrder !== undefined) updates.display_order = displayOrder;

    const { data, error } = await supabase
        .from('product_variation_types')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}

// DELETE - Delete a variation type
export async function DELETE(request: NextRequest) {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const { error } = await supabase
        .from('product_variation_types')
        .delete()
        .eq('id', id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
