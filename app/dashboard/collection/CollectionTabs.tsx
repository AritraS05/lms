'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatINR2 } from '@/lib/loan';
import { userOf, type LoanWithUser } from '@/lib/ops';
import StatusBadge from '../StatusBadge';

type Tab = 'disbursed' | 'closed';

export default function CollectionTabs({
  loans,
}: {
  loans: LoanWithUser[];
}) {
  const [tab, setTab] = useState<Tab>('disbursed');

  const disbursedLoans = loans.filter((l) => l.status === 'disbursed');
  const closedLoans = loans.filter((l) => l.status === 'closed');

  const activeLoans = tab === 'disbursed' ? disbursedLoans : closedLoans;

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-900">
          <button
            onClick={() => setTab('disbursed')}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              tab === 'disbursed'
                ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50'
                : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'
            }`}
          >
            Disbursed
            {disbursedLoans.length > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-zinc-200 px-1.5 text-[10px] font-semibold text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300">
                {disbursedLoans.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab('closed')}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              tab === 'closed'
                ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50'
                : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'
            }`}
          >
            Closed
            {closedLoans.length > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-zinc-200 px-1.5 text-[10px] font-semibold text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300">
                {closedLoans.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeLoans.length === 0 ? (
        <p className="mt-6 rounded-md border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          No {tab} loans yet.
        </p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-900">
              <tr className="text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                <th className="px-4 py-3">Borrower</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-right">Paid</th>
                <th className="px-4 py-3 text-right">Outstanding</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {activeLoans.map((loan) => {
                const u = userOf(loan);
                const outstanding = loan.totalRepayment - loan.amountPaid;
                return (
                  <tr key={loan._id}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-zinc-900 dark:text-zinc-50">
                        {u?.name ?? 'Unknown'}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {u?.email ?? '—'}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-zinc-900 dark:text-zinc-50">
                      {formatINR2(loan.totalRepayment)}
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-700 dark:text-zinc-300">
                      {formatINR2(loan.amountPaid)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-zinc-900 dark:text-zinc-50">
                      {formatINR2(outstanding)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={loan.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/dashboard/collection/${loan._id}`}
                        className="text-sm font-medium text-zinc-900 underline-offset-2 hover:underline dark:text-zinc-50"
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
