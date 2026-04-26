import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/getCurrentUser';
import { serverFetchJSON } from '@/lib/serverFetch';
import { formatINR2 } from '@/lib/loan';
import { userOf, type LoanWithUser } from '@/lib/ops';
import DashboardShell from '../DashboardShell';
import StatusBadge from '../StatusBadge';

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
          Collection — disbursed loans
        </h1>
        <span className="text-sm text-zinc-500 dark:text-zinc-400">
          {loans.length} loan{loans.length === 1 ? '' : 's'}
        </span>
      </div>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Click a loan to record a payment. Loans auto-close once fully repaid.
      </p>

      {loans.length === 0 ? (
        <p className="mt-8 rounded-md border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          No disbursed loans yet.
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
              {loans.map((loan) => {
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
    </DashboardShell>
  );
}
