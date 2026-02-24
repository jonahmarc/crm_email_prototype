// app/api/emails/import/route.ts
import { createClient } from '@supabase/supabase-js';
import { simpleParser } from 'mailparser';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
    // ─── TOP-LEVEL SAFETY NET ──────────────────────────────────────────────────
    // Without this, any unhandled throw (bad env vars, missing package, etc.)
    // causes Next.js to return an HTML error page, which the client can't parse.
    try {
        // Initialise Supabase inside the handler so a missing env var throws here,
        // where we can catch it and return proper JSON instead of an HTML 500 page.
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SECRET_KEY;

        if (!supabaseUrl || !supabaseKey) {
            return Response.json(
                { error: 'Server misconfiguration: Supabase env vars are missing.' },
                { status: 500 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // ── Parse request body ───────────────────────────────────────────────────
        let rawEmail: string;
        try {
            const body = await req.json();
            rawEmail = body.raw as string;
        } catch {
            return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
        }

        if (!rawEmail || rawEmail.trim().length === 0) {
            return Response.json({ error: '"raw" field is required' }, { status: 400 });
        }

        // ── Parse the RFC 2822 raw email ─────────────────────────────────────────
        let parsed;
        try {
            parsed = await simpleParser(rawEmail);
        } catch (err) {
            return Response.json(
                { error: 'Failed to parse email', detail: String(err) },
                { status: 422 }
            );
        }

        // ── Extract fields ───────────────────────────────────────────────────────
        const fromAddress = parsed.from?.text ?? '(unknown sender)';
        const toAddress = parsed.to
            ? Array.isArray(parsed.to)
                ? parsed.to.map((a) => a.text).join(', ')
                : parsed.to.text
            : '(unknown recipient)';
        const subject   = parsed.subject   ?? '(no subject)';
        const bodyHtml  = parsed.html       || null;
        const bodyText  = parsed.text       || null;
        const rawDate   = parsed.date       ? parsed.date.toISOString() : null;
        const messageId = parsed.messageId  ?? null;

        // ── Insert into Supabase ─────────────────────────────────────────────────
        const { data, error } = await supabase
            .from('email_messages')
            .insert({
                from_address: fromAddress,
                to_address:   toAddress,
                subject,
                body_html:    bodyHtml,
                body_text:    bodyText,
                raw_date:     rawDate,
                message_id:   messageId,
            })
            .select('id')
            .single();

        if (error) {
            return Response.json({ error: error.message }, { status: 500 });
        }

        return Response.json({ ok: true, id: data.id }, { status: 201 });

    } catch (err) {
        // Catch-all: guarantees the client always receives JSON, never an HTML page.
        console.error('[/api/emails/import] Unhandled error:', err);
        return Response.json(
            { error: 'Internal server error', detail: String(err) },
            { status: 500 }
        );
    }
}