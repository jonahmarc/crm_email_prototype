// app/email/[id]/page.tsx
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function EmailDetailPage({
                                                  params,
                                              }: {
    params: Promise<{ id: string }>;
}) {
    // Await params — required in Next.js 16+
    const { id } = await params;

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SECRET_KEY!
    );

    const { data: email } = await supabase
        .from('email_messages')
        .select('*')
        .eq('id', id)
        .single();

    if (!email) notFound()

    return (
        <main className="max-w-3xl mx-auto px-4 py-8">
            <Link href="/email" className="text-blue-600 text-sm hover:underline mb-6 inline-block">
                ← Back to Inbox
            </Link>

            {/* Email header */}
            <div className="bg-white border rounded-lg p-6 shadow-sm space-y-3 mb-4">
                <h1 className="text-xl font-bold text-gray-900">{email.subject}</h1>
                <div className="text-sm text-gray-600 space-y-1">
                    <p><span className="font-medium">From:</span> {email.from_address}</p>
                    <p><span className="font-medium">To:</span> {email.to_address}</p>
                    {email.raw_date && (
                        <p>
                            <span className="font-medium">Date:</span>{' '}
                            {new Date(email.raw_date).toLocaleString()}
                        </p>
                    )}
                </div>
            </div>

            {/* Email body */}
            <div className="bg-white text-black border rounded-lg p-6 shadow-sm">
                {email.body_html ? (
                    // In production, sanitize with DOMPurify before rendering
                    <div
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: email.body_html }}
                    />
                ) : (
                    <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                        {email.body_text ?? '(no body)'}
                    </pre>
                )}
            </div>
        </main>
    );
}