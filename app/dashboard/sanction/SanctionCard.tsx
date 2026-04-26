'use client';

import { useState } from 'react';
import { formatINR, formatINR2 } from '@/lib/loan';
import type { LoanWithUser } from '@/lib/ops';
import { userOf } from '@/lib/ops';
import LoanDetailModal from '../LoanDetailModal';
import SanctionActions from './SanctionActions';

export default function SanctionCard({ loan }: { loan: LoanWithUser }) {
  const [open, setOpen] = useState(false);
  const u = userOf(loan);

  return (
    <>
      <li
        className="cursor-pointer rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
        onClick={() => setOpen(true)}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-medium text-zinc-900 dark:text-zinc-50">
              {u?.name ?? 'Unknown'}{' '}
              <span className="font-normal text-zinc-500 dark:text-zinc-400">
                · {u?.email ?? '—'}
              </span>
            </p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400" suppressHydrationWarning>
              Applied {new Date(loan.appliedAt).toLocaleString()}
            </p>
          </div>
          <dl className="grid grid-cols-3 gap-4 text-right text-sm">
            <div>
              <dt className="text-zinc-500 dark:text-zinc-400">Principal</dt>
              <dd className="font-medium text-zinc-900 dark:text-zinc-50">
                {formatINR(loan.principal)}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500 dark:text-zinc-400">Tenure</dt>
              <dd className="font-medium text-zinc-900 dark:text-zinc-50">
                {loan.tenureDays}d
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500 dark:text-zinc-400">Total</dt>
              <dd className="font-semibold text-zinc-900 dark:text-zinc-50">
                {formatINR2(loan.totalRepayment)}
              </dd>
            </div>
          </dl>
        </div>
        <div className="mt-4 flex items-start justify-between border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            Click to view full details &amp; salary slip
          </p>
          {/* Inline action buttons – stop propagation so card click doesn't fire */}
          <div onClick={(e) => e.stopPropagation()}>
            <SanctionActions loanId={loan._id} />
          </div>
        </div>
      </li>

      <LoanDetailModal loanId={loan._id} open={open} onClose={() => setOpen(false)}>
        <SanctionActions loanId={loan._id} />
      </LoanDetailModal>
    </>
  );
}
