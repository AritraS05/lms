'use client';

import { useEffect, useState, useCallback } from 'react';
import { formatINR, formatINR2 } from '@/lib/loan';

/* ------------------------------------------------------------------ */
/*  Types matching the backend /api/ops/loans/:id response             */
/* ------------------------------------------------------------------ */
interface PopulatedUser {
  _id: string;
  name: string;
  email: string;
}

interface SalarySlipMeta {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
}

interface BorrowerProfile {
  fullName: string;
  pan: string;
  dob: string;
  monthlySalary: number;
  employmentMode: string;
  status: string;
  salarySlip?: SalarySlipMeta;
}

interface LoanDetail {
  _id: string;
  principal: number;
  tenureDays: number;
  interestRatePct: number;
  interestAmount: number;
  totalRepayment: number;
  status: string;
  appliedAt: string;
  sanctionedAt?: string;
  disbursedAt?: string;
  user: PopulatedUser;
}

interface InspectionResponse {
  loan: LoanDetail;
  profile: BorrowerProfile | null;
  outstanding: number;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function LoanDetailModal({
  loanId,
  open,
  onClose,
  children,
}: {
  loanId: string;
  open: boolean;
  onClose: () => void;
  /** Action buttons (approve/reject, disburse) rendered at the bottom */
  children?: React.ReactNode;
}) {
  const [data, setData] = useState<InspectionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slipUrl, setSlipUrl] = useState<string | null>(null);
  const [slipLoading, setSlipLoading] = useState(false);
  const [slipError, setSlipError] = useState<string | null>(null);

  /* Fetch loan + profile when modal opens */
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    fetch(`/api/ops/loans/${loanId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`Failed (${res.status})`);
        return res.json() as Promise<InspectionResponse>;
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [open, loanId]);

  /* Fetch salary slip blob URL when profile data is available */
  useEffect(() => {
    if (!open || !data?.profile?.salarySlip) return;
    setSlipLoading(true);
    setSlipError(null);
    fetch(`/api/ops/loans/${loanId}/salary-slip`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`Failed to load slip (${res.status})`);
        const blob = await res.blob();
        return URL.createObjectURL(blob);
      })
      .then(setSlipUrl)
      .catch((e) => setSlipError(e.message))
      .finally(() => setSlipLoading(false));
  }, [open, loanId, data?.profile?.salarySlip]);

  /* Cleanup blob URL */
  useEffect(() => {
    return () => {
      if (slipUrl) URL.revokeObjectURL(slipUrl);
    };
  }, [slipUrl]);

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

  const profile = data?.profile;
  const loan = data?.loan;
  const slip = profile?.salarySlip;
  const isImage = slip?.mimeType?.startsWith('image/');
  const isPdf = slip?.mimeType === 'application/pdf';

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Modal panel */}
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
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Loan Application Details
            </h2>

            {/* ---- Borrower info ---- */}
            <section className="mt-5">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Borrower Information
              </h3>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <DetailRow
                  label="Full Name"
                  value={profile?.fullName ?? loan.user.name}
                />
                <DetailRow label="Email" value={loan.user.email} />
                <DetailRow
                  label="PAN"
                  value={profile?.pan ?? '—'}
                />
                <DetailRow
                  label="Date of Birth"
                  value={
                    profile?.dob
                      ? new Date(profile.dob).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '—'
                  }
                />
                <DetailRow
                  label="Monthly Salary"
                  value={
                    profile?.monthlySalary
                      ? formatINR(profile.monthlySalary)
                      : '—'
                  }
                />
                <DetailRow
                  label="Employment Mode"
                  value={profile?.employmentMode ?? '—'}
                />
                <DetailRow
                  label="BRE Status"
                  value={
                    <span
                      className={
                        profile?.status === 'eligible'
                          ? 'font-medium text-emerald-600 dark:text-emerald-400'
                          : 'font-medium text-red-600 dark:text-red-400'
                      }
                    >
                      {profile?.status
                        ? profile.status.charAt(0).toUpperCase() +
                          profile.status.slice(1)
                        : '—'}
                    </span>
                  }
                />
              </dl>
            </section>

            {/* ---- Loan info ---- */}
            <section className="mt-6">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Loan Details
              </h3>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <DetailRow
                  label="Principal"
                  value={formatINR(loan.principal)}
                />
                <DetailRow
                  label="Tenure"
                  value={`${loan.tenureDays} days`}
                />
                <DetailRow
                  label="Interest Rate"
                  value={`${loan.interestRatePct}% p.a.`}
                />
                <DetailRow
                  label="Interest Amount"
                  value={formatINR2(loan.interestAmount)}
                />
                <DetailRow
                  label="Total Repayment"
                  value={
                    <span className="font-semibold">
                      {formatINR2(loan.totalRepayment)}
                    </span>
                  }
                />
                <DetailRow
                  label="Status"
                  value={
                    <span className="capitalize">{loan.status}</span>
                  }
                />
                <DetailRow
                  label="Applied At"
                  value={new Date(loan.appliedAt).toLocaleString('en-IN')}
                />
                {loan.sanctionedAt && (
                  <DetailRow
                    label="Sanctioned At"
                    value={new Date(loan.sanctionedAt).toLocaleString('en-IN')}
                  />
                )}
              </dl>
            </section>

            {/* ---- Salary slip ---- */}
            <section className="mt-6">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Salary Slip
              </h3>
              {!slip ? (
                <p className="rounded-lg border border-dashed border-zinc-300 px-4 py-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                  No salary slip uploaded.
                </p>
              ) : slipLoading ? (
                <div className="flex items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 py-12 dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-zinc-200" />
                </div>
              ) : slipError ? (
                <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-4 text-center text-sm text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
                  {slipError}
                </p>
              ) : slipUrl ? (
                <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
                  {/* File info bar */}
                  <div className="flex items-center justify-between bg-zinc-50 px-4 py-2 dark:bg-zinc-900">
                    <span className="truncate text-xs text-zinc-600 dark:text-zinc-400">
                      {slip.originalName}{' '}
                      <span className="text-zinc-400 dark:text-zinc-500">
                        ({(slip.size / 1024).toFixed(0)} KB)
                      </span>
                    </span>
                    <a
                      href={slipUrl}
                      download={slip.originalName}
                      className="ml-3 flex-shrink-0 rounded-md bg-zinc-900 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
                    >
                      Download
                    </a>
                  </div>
                  {/* Preview */}
                  {isImage && (
                    <img
                      src={slipUrl}
                      alt="Salary Slip"
                      className="max-h-96 w-full object-contain bg-zinc-100 dark:bg-zinc-900"
                    />
                  )}
                  {isPdf && (
                    <iframe
                      src={slipUrl}
                      title="Salary Slip"
                      className="h-[420px] w-full bg-white"
                    />
                  )}
                  {!isImage && !isPdf && (
                    <div className="flex flex-col items-center gap-2 px-4 py-8 text-sm text-zinc-500">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                      <span>
                        Preview not available — use the download button above.
                      </span>
                    </div>
                  )}
                </div>
              ) : null}
            </section>

            {/* ---- Action buttons ---- */}
            {children && (
              <section className="mt-2">
                {children}
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tiny helper for key-value rows                                     */
/* ------------------------------------------------------------------ */
function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd className="mt-0.5 font-medium text-zinc-900 dark:text-zinc-50">
        {value}
      </dd>
    </div>
  );
}
