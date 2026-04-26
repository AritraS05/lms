'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatINR, formatINR2 } from '@/lib/loan';
import { fmtDate, fmtDateTime } from '@/lib/formatDate';
import type { Loan } from '@/lib/loan';
import StatusBadge from './StatusBadge';
import BorrowerLoanDetailModal from './BorrowerLoanDetailModal';

type Tab = 'active' | 'history';

export default function BorrowerLoanTabs({
  activeLoan,
  historyLoans,
  hasActiveLoan,
}: {
  activeLoan: Loan | null;
  historyLoans: Loan[];
  hasActiveLoan: boolean;
}) {
  const [tab, setTab] = useState<Tab>('active');
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);

  return (
    <div className="mt-6">
      {/* Tab bar + Apply button */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-900">
          <button
            onClick={() => setTab('active')}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              tab === 'active'
                ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50'
                : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'
            }`}
          >
            Active Loan
          </button>
          <button
            onClick={() => setTab('history')}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              tab === 'history'
                ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50'
                : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'
            }`}
          >
            Loan History
            {historyLoans.length > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-zinc-200 px-1.5 text-[10px] font-semibold text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300">
                {historyLoans.length}
              </span>
            )}
          </button>
        </div>

        {hasActiveLoan ? (
          <div className="group relative">
            <button
              disabled
              className="inline-flex cursor-not-allowed items-center gap-2 rounded-lg bg-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Apply for Loan
            </button>
            <span className="pointer-events-none absolute bottom-full right-0 mb-2 hidden whitespace-nowrap rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white shadow-lg group-hover:block dark:bg-zinc-100 dark:text-zinc-900">
              You already have an active loan application
            </span>
          </div>
        ) : (
          <Link
            href="/borrower/apply-loan"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Apply for Loan
          </Link>
        )}
      </div>

      {/* Active Loan tab content */}
      {tab === 'active' && (
        <div className="mt-4">
          {activeLoan ? (
            <div onClick={() => setSelectedLoanId(activeLoan._id)} className="cursor-pointer">
              <ActiveLoanCard loan={activeLoan} />
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center dark:border-zinc-700 dark:bg-zinc-950">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-900">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-zinc-400 dark:text-zinc-500"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="12" y1="18" x2="12" y2="12" />
                  <line x1="9" y1="15" x2="15" y2="15" />
                </svg>
              </div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                No active loan
              </p>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                You don&apos;t have an active loan application. Click &quot;Apply
                for Loan&quot; to get started.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Loan History tab content */}
      {tab === 'history' && (
        <div className="mt-4">
          {historyLoans.length > 0 ? (
            <div className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <ul className="divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
                {historyLoans.map((l) => (
                  <li
                    key={l._id}
                    className="flex cursor-pointer items-center justify-between px-6 py-4 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                    onClick={() => setSelectedLoanId(l._id)}
                  >
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-zinc-50">
                        {formatINR(l.principal)} · {l.tenureDays} days
                      </p>
                      <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                        Applied{' '}
                        {fmtDate(l.appliedAt)}
                      </p>
                    </div>
                    <StatusBadge status={l.status} />
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center dark:border-zinc-700 dark:bg-zinc-950">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                No loan history yet.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Loan Detail Modal */}
      <BorrowerLoanDetailModal
        loanId={selectedLoanId}
        open={!!selectedLoanId}
        onClose={() => setSelectedLoanId(null)}
      />
    </div>
  );
}

function ActiveLoanCard({ loan }: { loan: Loan }) {
  return (
    <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-6 shadow-sm transition-shadow hover:shadow-md dark:border-indigo-900/60 dark:bg-indigo-950/40">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Active loan application
        </h3>
        <StatusBadge status={loan.status} />
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-zinc-500 dark:text-zinc-400">Principal</dt>
          <dd className="mt-1 font-medium text-zinc-900 dark:text-zinc-50">
            {formatINR(loan.principal)}
          </dd>
        </div>
        <div>
          <dt className="text-zinc-500 dark:text-zinc-400">Tenure</dt>
          <dd className="mt-1 font-medium text-zinc-900 dark:text-zinc-50">
            {loan.tenureDays} days
          </dd>
        </div>
        <div>
          <dt className="text-zinc-500 dark:text-zinc-400">
            Interest @ {loan.interestRatePct}%
          </dt>
          <dd className="mt-1 font-medium text-zinc-900 dark:text-zinc-50">
            {formatINR2(loan.interestAmount)}
          </dd>
        </div>
        <div>
          <dt className="text-zinc-500 dark:text-zinc-400">Total repayment</dt>
          <dd className="mt-1 font-semibold text-zinc-900 dark:text-zinc-50">
            {formatINR2(loan.totalRepayment)}
          </dd>
        </div>
      </dl>
      <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">
        Applied on {fmtDateTime(loan.appliedAt)}
      </p>
    </div>
  );
}
