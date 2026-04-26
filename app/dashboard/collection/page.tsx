import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/getCurrentUser';
import { serverFetchJSON } from '@/lib/serverFetch';
import { type LoanWithUser } from '@/lib/ops';
import DashboardShell from '../DashboardShell';
import CollectionTabs from './CollectionTabs';

const ALLOWED = new Set(['Admin', 'Collection']);

export default async function CollectionPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!ALLOWED.has(user.role)) redirect('/dashboard');

  const data = await serverFetchJSON<{ loans: LoanWithUser[] }>(
    '/api/collection/loans',
  );
  const loans = data?.loans ?? [];

  return (
    <DashboardShell user={user} current="/dashboard/collection">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Collection — disbursed & closed loans
        </h1>
        <span className="text-sm text-zinc-500 dark:text-zinc-400">
          {loans.length} loan{loans.length === 1 ? '' : 's'}
        </span>
      </div>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Click a loan to record a payment. Loans auto-close once fully repaid.
      </p>

      <CollectionTabs loans={loans} />
    </DashboardShell>
  );
}
