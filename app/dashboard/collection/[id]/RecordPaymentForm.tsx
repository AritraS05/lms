'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  loanId: string;
  outstanding: number;
}

export default function RecordPaymentForm({ loanId, outstanding }: Props) {
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);
  const [utr, setUtr] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [paidOn, setPaidOn] = useState(today);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      setError('Amount must be greater than zero.');
      return;
    }
    if (amt > outstanding) {
      setError(
        `Amount exceeds outstanding balance (₹${outstanding.toLocaleString('en-IN')}).`,
      );
      return;
    }
    if (!/^[A-Za-z0-9]{8,30}$/.test(utr.trim())) {
      setError('UTR must be 8–30 alphanumeric characters.');
      return;
    }

    setBusy(true);
    try {
      const res = await fetch(`/api/collection/loans/${loanId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          utr: utr.trim().toUpperCase(),
          amount: amt,
          paidOn,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message ?? `Failed (${res.status})`);
        return;
      }
      setUtr('');
      setAmount('');
      setPaidOn(today);
      router.refresh();
    } catch {
      setError('Network error.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 grid gap-4 sm:grid-cols-3">
      <div className="sm:col-span-1">
        <label
          htmlFor="utr"
          className="block text-xs font-medium text-zinc-700 dark:text-zinc-300"
        >
          UTR
        </label>
        <input
          id="utr"
          required
          value={utr}
          onChange={(e) => setUtr(e.target.value.toUpperCase())}
          className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 font-mono text-sm uppercase text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          maxLength={30}
        />
      </div>
      <div>
        <label
          htmlFor="amount"
          className="block text-xs font-medium text-zinc-700 dark:text-zinc-300"
        >
          Amount (₹)
        </label>
        <input
          id="amount"
          type="number"
          required
          min={1}
          max={outstanding}
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
      </div>
      <div>
        <label
          htmlFor="paidOn"
          className="block text-xs font-medium text-zinc-700 dark:text-zinc-300"
        >
          Paid on
        </label>
        <input
          id="paidOn"
          type="date"
          required
          value={paidOn}
          max={today}
          onChange={(e) => setPaidOn(e.target.value)}
          className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
      </div>
      {error && (
        <p className="sm:col-span-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={busy}
        className="sm:col-span-3 flex h-10 w-full items-center justify-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {busy ? 'Recording…' : 'Record payment'}
      </button>
    </form>
  );
}
