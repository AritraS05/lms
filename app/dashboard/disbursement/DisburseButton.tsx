'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DisburseButton({ loanId }: { loanId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function disburse() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(
        `/api/disbursement/loans/${loanId}/disburse`,
        { method: 'POST' },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message ?? `Failed (${res.status})`);
        return;
      }
      router.refresh();
    } catch {
      setError('Network error.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        disabled={busy}
        onClick={disburse}
        className="rounded-md bg-violet-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
      >
        {busy ? 'Marking disbursed…' : 'Mark as disbursed'}
      </button>
      {error && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
