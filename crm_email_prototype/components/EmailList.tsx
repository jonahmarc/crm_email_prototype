// components/EmailList.tsx
import Link from 'next/link';

type EmailRow = {
    id: string;
    from_address: string;
    subject: string;
    body_text: string | null;
    raw_date: string | null;
    imported_at: string;
};

export default function EmailList({ emails }: { emails: EmailRow[] }) {
    if (emails.length === 0) {
        return (
            <div className="text-center py-16 text-gray-400">
                No emails imported yet. Paste a raw email above to get started.
            </div>
        );
    }

    return (
        <div className="divide-y border rounded-lg bg-white shadow-sm">
            {emails.map((email) => (
                <Link
                    key={email.id}
                    href={`/email/${email.id}`}
                    className="flex flex-col p-4 hover:bg-gray-50 transition"
                >
                    <div className="flex justify-between items-start gap-2">
                        <span className="font-medium text-gray-900 truncate">{email.from_address}</span>
                        <span className="text-xs text-gray-400 shrink-0">
              {email.raw_date
                  ? new Date(email.raw_date).toLocaleDateString()
                  : new Date(email.imported_at).toLocaleDateString()}
            </span>
                    </div>
                    <span className="text-sm font-semibold text-gray-700 truncate mt-0.5">{email.subject}</span>
                    <span className="text-sm text-gray-400 truncate mt-0.5">
            {email.body_text?.slice(0, 100) ?? ''}
          </span>
                </Link>
            ))}
        </div>
    );
}