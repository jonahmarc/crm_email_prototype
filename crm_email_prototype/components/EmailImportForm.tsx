// components/EmailImportForm.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function EmailImportForm() {
    const router = useRouter();
    const [raw, setRaw]         = useState('');
    const [status, setStatus]   = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
    const [message, setMessage] = useState('');

    async function handleImport() {
        if (!raw.trim()) return;
        setStatus('loading');
        setMessage('');

        try {
            const res = await fetch('/api/emails/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ raw }),
            });

            // ── SAFE JSON PARSING ────────────────────────────────────────────────
            // Guard against the server returning an HTML error page (e.g. a Next.js
            // 500 page) instead of JSON — that's what causes:
            //   SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
            const contentType = res.headers.get('content-type') ?? '';
            if (!contentType.includes('application/json')) {
                // Server returned something we can't parse as JSON (HTML error page).
                const text = await res.text();
                console.error('Non-JSON response from server:', text);
                setStatus('error');
                setMessage(`Server error (${res.status}): response was not JSON. Check the terminal for details.`);
                return;
            }

            const data = await res.json();

            if (!res.ok) {
                setStatus('error');
                // Show detail if present (e.g. parse errors), otherwise fall back to error field.
                setMessage(data.detail ?? data.error ?? 'Import failed');
            } else {
                setStatus('ok');
                setMessage(`Imported successfully (id: ${data.id})`);
                setRaw('');
                router.refresh();
            }
        } catch (err) {
            setStatus('error');
            setMessage(String(err));
        }
    }

    return (
        <div className="border rounded-lg p-6 space-y-4 bg-white shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800">Paste Raw Email</h2>
            <p className="text-sm text-gray-500">
                In Gmail: open an email → ⋮ menu → <strong>Show original</strong> → copy all text and paste below.
            </p>

            <textarea
                className="w-full border rounded-md p-3 text-xs font-mono text-black h-56 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={
                    'Received: from mail.example.com...\nFrom: sender@example.com\nTo: you@example.com\nSubject: Hello\n\nEmail body here...'
                }
                value={raw}
                onChange={(e) => setRaw(e.target.value)}
            />

            <div className="flex items-center gap-4">
                <button
                    onClick={handleImport}
                    disabled={status === 'loading' || !raw.trim()}
                    className="bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition"
                >
                    {status === 'loading' ? 'Importing...' : 'Import Email'}
                </button>
                {message && (
                    <span className={`text-sm ${status === 'error' ? 'text-red-600' : 'text-green-600'}`}>
            {message}
          </span>
                )}
            </div>
        </div>
    );
}