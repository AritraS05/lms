'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SanctionActions({ loanId }: { loanId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<'approve' | 'reject' | null>(null);
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function call(action: 'approve' | 'reject', body?: object) {
    setError(null);
    setBusy(action);
    try {
      const res = await fetch(`/api/sanction/loans/${loanId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message ?? `Action failed (${res.status})`);
        return;
      }
      router.refresh();
    } catch {
      setError('Network error.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      {!showReject ? (
        <div className="flex flex-wrap gap-2">
          <button
            disabled={busy !== null}
            onClick={() => call('approve')}
            className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {busy === 'approve' ? 'Approving…' : 'Approve'}
          </button>
          <button
            disabled={busy !== null}
            onClick={() => setShowReject(true)}
            className="rounded-md border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-800 dark:bg-zinc-900 dark:text-red-400 dark:hover:bg-zinc-800"
          >
            Reject…
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for rejection (3–500 characters)"
            rows={3}
            className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
          <div className="flex flex-wrap gap-2">
            <button
              disabled={busy !== null || reason.trim().length < 3}
              onClick={() => call('reject', { reason: reason.trim() })}
              className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {busy === 'reject' ? 'Rejecting…' : 'Confirm reject'}
            </button>
            <button
              disabled={busy !== null}
              onClick={() => {
                setShowReject(false);
                setReason('');
              }}
              className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {error && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
