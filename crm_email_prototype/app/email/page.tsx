// app/email/page.tsx
import { createClient } from '@supabase/supabase-js';
import EmailImportForm from '@/components/EmailImportForm';
import EmailList from '@/components/EmailList';

export const dynamic = 'force-dynamic';

export default async function EmailInboxPage() {
    // Server-side: use secret key
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SECRET_KEY!
    );

    const { data: emails } = await supabase
        .from('email_messages')
        .select('id, from_address, subject, body_text, raw_date, imported_at')
        .order('imported_at', { ascending: false })
        .limit(50);

    return (
        <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Email Inbox</h1>
            <EmailImportForm />
            <EmailList emails={emails ?? []} />
        </main>
    );
}