'use client';

import { useEffect, useState, useCallback } from 'react';
import { formatINR, formatINR2 } from '@/lib/loan';
import { fmtDate, fmtDateTime } from '@/lib/formatDate';
import type { Loan } from '@/lib/loan';
import StatusBadge from './StatusBadge';

/* ------------------------------------------------------------------ */
/*  Types matching the backend /api/loans/:id response                 */
/* ------------------------------------------------------------------ */
interface Payment {
  _id: string;
  utr: string;
  amount: number;
  paidOn: string;
  createdAt: string;
}

interface BorrowerLoanDetailResponse {
  loan: Loan;
  payments: Payment[];
  outstanding: number;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function BorrowerLoanDetailModal({
  loanId,
  open,
  onClose,
}: {
  loanId: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const [data, setData] = useState<BorrowerLoanDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !loanId) return;
    setLoading(true);
    setError(null);
    fetch(`/api/loans/${loanId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`Failed (${res.status})`);
        return res.json() as Promise<BorrowerLoanDetailResponse>;
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [open, loanId]);

  /* Close on Escape */
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );
  useEffect(() => {
    if (!open) return;
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, handleKey]);

  /* Prevent body scroll when open */
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  const loan = data?.loan;
  const payments = data?.payments ?? [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative mx-4 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          aria-label="Close"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-zinc-200" />
          </div>
        )}

        {error && (
          <p className="py-12 text-center text-sm text-red-500">{error}</p>
        )}

        {data && loan && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-5 pr-8">
               <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Loan Application Details
              </h2>
              <StatusBadge status={loan.status} />
            </div>

            {/* Rejection Reason (if any) */}
            {loan.status === 'rejected' && loan.rejectionReason && (
              <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/30">
                <h3 className="text-sm font-semibold text-red-800 dark:text-red-300">
                  Application Rejected
                </h3>
                <p className="mt-1 text-sm text-red-700 dark:text-red-400">
                  {loan.rejectionReason}
                </p>
              </div>
            )}

            {/* ---- Loan info ---- */}
            <section className="mb-6">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Financial Summary
              </h3>
              <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-800/80 dark:bg-zinc-900/50">
                  <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm sm:grid-cols-4">
                    <DetailRow
                      label="Principal"
                      value={formatINR(loan.principal)}
                    />
                    <DetailRow
                      label="Tenure"
                      value={`${loan.tenureDays} days`}
                    />
                    <DetailRow
                      label="Total Repayment"
                      value={formatINR2(loan.totalRepayment)}
                    />
                     <DetailRow
                      label="Amount Paid"
                      value={
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                           {formatINR2(loan.amountPaid)}
                        </span>
                      }
                    />
                    <DetailRow
                      label="Amount Due"
                      value={
                         <span className="font-semibold text-rose-600 dark:text-rose-400">
                          {formatINR2(data.outstanding)}
                         </span>
                      }
                    />
                     <DetailRow
                      label="Applied At"
                      value={fmtDate(loan.appliedAt)}
                    />
                  </dl>
              </div>
            </section>

             {/* ---- Payment History ---- */}
             {payments.length > 0 && (
              <section className="mt-6">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  Payment History
                </h3>
                <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <table className="min-w-full text-sm">
                    <thead className="bg-zinc-50 dark:bg-zinc-900/50">
                      <tr className="text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">UTR</th>
                        <th className="px-4 py-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-950">
                      {payments.map((payment) => (
                        <tr key={payment._id}>
                          <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">
                            {fmtDate(payment.paidOn)}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                            {payment.utr}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-emerald-600 dark:text-emerald-400">
                            {formatINR2(payment.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Empty payments state for disbursed/closed loans */}
            {['disbursed', 'closed'].includes(loan.status) && payments.length === 0 && (
               <section className="mt-6">
                 <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  Payment History
                </h3>
                 <p className="rounded-lg border border-dashed border-zinc-300 px-4 py-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                   No payments recorded yet.
                 </p>
               </section>
            )}

          </>
        )}
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-zinc-500 dark:text-zinc-400 text-xs uppercase tracking-wider mb-1">{label}</dt>
      <dd className="font-medium text-zinc-900 dark:text-zinc-50">
        {value}
      </dd>
    </div>
  );
}
