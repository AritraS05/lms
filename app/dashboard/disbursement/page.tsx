import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/getCurrentUser';
import { serverFetchJSON } from '@/lib/serverFetch';
import { type LoanWithUser } from '@/lib/ops';
import DashboardShell from '../DashboardShell';
import DisbursementCard from './DisbursementCard';

const ALLOWED = new Set(['Admin', 'Disbursement']);

export default async function DisbursementPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!ALLOWED.has(user.role)) redirect('/dashboard');

  const data = await serverFetchJSON<{ loans: LoanWithUser[] }>(
    '/api/disbursement/loans',
  );
  const loans = data?.loans ?? [];

  return (
    <DashboardShell user={user} current="/dashboard/disbursement">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Disbursement — sanctioned loans
        </h1>
        <span className="text-sm text-zinc-500 dark:text-zinc-400">
          {loans.length} ready
        </span>
      </div>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Mark a loan as disbursed once the funds have actually been released.
      </p>

      {loans.length === 0 ? (
        <p className="mt-8 rounded-md border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          Nothing sanctioned awaiting disbursement.
        </p>
      ) : (
        <ul className="mt-6 space-y-4">
          {loans.map((loan) => (
            <DisbursementCard key={loan._id} loan={loan} />
          ))}
        </ul>
      )}
    </DashboardShell>
  );
}
