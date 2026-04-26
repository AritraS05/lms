import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/getCurrentUser';
import { serverFetchJSON } from '@/lib/serverFetch';
import { type LoanWithUser } from '@/lib/ops';
import DashboardShell from '../DashboardShell';
import SanctionCard from './SanctionCard';

const ALLOWED = new Set(['Admin', 'Sanction']);

export default async function SanctionPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!ALLOWED.has(user.role)) redirect('/dashboard');

  const data = await serverFetchJSON<{ loans: LoanWithUser[] }>(
    '/api/sanction/loans',
  );
  const loans = data?.loans ?? [];

  return (
    <DashboardShell user={user} current="/dashboard/sanction">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Sanction — pending applications
        </h1>
        <span className="text-sm text-zinc-500 dark:text-zinc-400">
          {loans.length} pending
        </span>
      </div>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Review each application and either approve it or reject with a reason.
      </p>

      {loans.length === 0 ? (
        <p className="mt-8 rounded-md border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          Nothing waiting on sanction.
        </p>
      ) : (
        <ul className="mt-6 space-y-4">
          {loans.map((loan) => (
            <SanctionCard key={loan._id} loan={loan} />
          ))}
        </ul>
      )}
    </DashboardShell>
  );
}
