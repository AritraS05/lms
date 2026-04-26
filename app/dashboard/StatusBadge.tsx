import type { LoanStatus } from '@/lib/loan';

const STYLES: Record<LoanStatus, string> = {
  pending:
    'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200',
  sanctioned:
    'bg-blue-100 text-blue-900 dark:bg-blue-950/60 dark:text-blue-200',
  rejected: 'bg-red-100 text-red-900 dark:bg-red-950/60 dark:text-red-200',
  disbursed:
    'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200',
  closed: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100',
};

export default function StatusBadge({ status }: { status: LoanStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STYLES[status]}`}
    >
      {status}
    </span>
  );
}
