import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/getCurrentUser';
import { serverFetchJSON } from '@/lib/serverFetch';
import { formatINR, formatINR2 } from '@/lib/loan';
import { userOf, type LoanWithUser } from '@/lib/ops';
import DashboardShell from '../DashboardShell';
import DisburseButton from './DisburseButton';

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
          {loans.map((loan) => {
            const u = userOf(loan);
            return (
              <li
                key={loan._id}
                className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-zinc-50">
                      {u?.name ?? 'Unknown'}{' '}
                      <span className="font-normal text-zinc-500 dark:text-zinc-400">
                        · {u?.email ?? '—'}
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      Sanctioned{' '}
                      {loan.sanctionedAt
                        ? new Date(loan.sanctionedAt).toLocaleString()
                        : '—'}
                    </p>
                  </div>
                  <dl className="grid grid-cols-3 gap-4 text-right text-sm">
                    <div>
                      <dt className="text-zinc-500 dark:text-zinc-400">
                        Principal
                      </dt>
                      <dd className="font-semibold text-zinc-900 dark:text-zinc-50">
                        {formatINR(loan.principal)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-zinc-500 dark:text-zinc-400">
                        Tenure
                      </dt>
                      <dd className="font-medium text-zinc-900 dark:text-zinc-50">
                        {loan.tenureDays}d
                      </dd>
                    </div>
                    <div>
                      <dt className="text-zinc-500 dark:text-zinc-400">
                        Repayment
                      </dt>
                      <dd className="font-medium text-zinc-900 dark:text-zinc-50">
                        {formatINR2(loan.totalRepayment)}
                      </dd>
                    </div>
                  </dl>
                </div>
                <div className="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-800">
                  <DisburseButton loanId={loan._id} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </DashboardShell>
  );
}
