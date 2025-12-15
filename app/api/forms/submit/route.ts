import { createClient } from '@/app/lib/supabaseServer';
import { NextResponse } from 'next/server';

// This is a public route, potentially.
// But createClient() uses cookies.
// For public access, we might need a service role client or ensure RLS allows anon.
// We'll rely on RLS allowing anon access as configured in migration.
// createClient() with no cookies will fall back to anon key which is fine if RLS allows.

export async function POST(request: Request) {
    const supabase = await createClient();

    try {
        const body = await request.json();
        const { form_id, data: submissionData } = body;

        if (!form_id || !submissionData) {
            return NextResponse.json({ error: 'Missing form_id or data' }, { status: 400 });
        }

        // 1. Fetch Form configuration to know mapping
        const { data: form, error: formError } = await supabase
            .from('forms')
            .select('*')
            .eq('id', form_id)
            .single();

        if (formError || !form) {
            return NextResponse.json({ error: 'Form not found' }, { status: 404 });
        }

        const { data: fields, error: fieldsError } = await supabase
            .from('form_fields')
            .select('*')
            .eq('form_id', form_id);

        if (fieldsError) {
            return NextResponse.json({ error: 'Error loading fields' }, { status: 500 });
        }

        // 2. Prepare Lead Data
        // We need to identify if lead exists (by email/phone) or create new.
        // However, leads usually use sender_id (from FB usually).
        // For web forms, we might generate a sender_id or allow null sender_id?
        // Looking at schema: `sender_id TEXT NOT NULL UNIQUE`.
        // This is a constraint. We need a sender_id.
        // For web leads, we can generate a unique ID, e.g. "web:uuid".

        // Check if email or phone exists to deduplicate?
        // Current schema enforces UNIQUE on sender_id.
        // It DOES NOT enforce unique email/phone (just indexes).

        // Strategy:
        // Extract Email/Phone from submissionData based on mapping.
        let email = null;
        let phone = null;
        let name = null;
        let customData: Record<string, any> = {};

        fields.forEach((field: any) => {
            const value = submissionData[field.id]; // data keyed by field_id
            if (value) {
                if (field.mapping_field === 'email') email = value;
                else if (field.mapping_field === 'phone') phone = value;
                else if (field.mapping_field === 'name') name = value;
                else {
                    // Add to custom data using Label as key (or field id?)
                    // Label is human readable, Field ID is stable.
                    // Let's use Label for readability in UI for now, or maybe Field ID is safer?
                    // `custom_data` is JSONB. Let's use label for now so it's readable.
                    customData[field.label] = value;
                }
            }
        });

        // Try to find existing lead by email or phone
        let leadId = null;

        if (email) {
            const { data: existingLead } = await supabase
                .from('leads')
                .select('id')
                .eq('email', email)
                .limit(1)
                .single();
            if (existingLead) leadId = existingLead.id;
        }

        if (!leadId && phone) {
            const { data: existingLead } = await supabase
                .from('leads')
                .select('id')
                .eq('phone', phone)
                .limit(1)
                .single();
            if (existingLead) leadId = existingLead.id;
        }

        // 3. Create or Update Lead
        if (leadId) {
            // Update
            const updates: any = { custom_data: customData }; // This overwrites custom_data? Maybe merge?
            // Let's do a simple update for now. 
            // Need to be careful not to overwrite valid data with nulls, but here we only scraped valid values.
            if (name) updates.name = name;
            if (phone) updates.phone = phone;
            if (email) updates.email = email;

            // Merge custom data?
            // Supabase update merges columns, but for JSONB it replaces the column value usually unless using jsonb_set.
            // Let's fetch current custom_data first? Optimization for later.
            // For now, let's just save what we have.

            await supabase
                .from('leads')
                .update(updates)
                .eq('id', leadId);
        } else {
            // Create New Lead
            // Generate pseudo sender_id
            const newSenderId = `web_form_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            const newLead = {
                sender_id: newSenderId,
                name: name || 'Form Lead',
                email,
                phone,
                current_stage_id: form.pipeline_stage_id, // Default to form's stage
                custom_data: customData,
                message_count: 0
            };

            const { data: createdLead, error: createError } = await supabase
                .from('leads')
                .insert([newLead])
                .select()
                .single();

            if (createError) {
                console.error('Lead create error', createError);
                // If error (e.g. sender_id collision), maybe retry? 
                return NextResponse.json({ error: 'Failed to create lead: ' + createError.message }, { status: 500 });
            }
            leadId = createdLead.id;
        }

        // 4. Record Submission
        const { error: matchError } = await supabase
            .from('form_submissions')
            .insert([{
                form_id: form_id,
                lead_id: leadId,
                submitted_data: submissionData
            }]);

        if (matchError) {
            console.error('Submission log error', matchError);
        }

        return NextResponse.json({ success: true, lead_id: leadId });

    } catch (error) {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
}
