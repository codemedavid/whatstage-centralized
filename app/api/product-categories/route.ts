import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';

// GET - List all product categories
export async function GET() {
    try {
        const { data, error } = await supabase
            .from('product_categories')
            .select('*')
            .order('display_order', { ascending: true });

        if (error) {
            console.error('Error fetching product categories:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data || []);
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST - Create new product category
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, description, color, displayOrder } = body;

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('product_categories')
            .insert({
                name,
                description: description || null,
                color: color || '#6B7280',
                display_order: displayOrder || 0,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating product category:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data, { status: 201 });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// PATCH - Update product category
export async function PATCH(req: Request) {
    try {
        const body = await req.json();
        const { id, name, description, color, displayOrder } = body;

        if (!id) {
            return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updates: any = {};
        if (name !== undefined) updates.name = name;
        if (description !== undefined) updates.description = description;
        if (color !== undefined) updates.color = color;
        if (displayOrder !== undefined) updates.display_order = displayOrder;

        const { data, error } = await supabase
            .from('product_categories')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating product category:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE - Delete product category
export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
        }

        const { error } = await supabase
            .from('product_categories')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting product category:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
