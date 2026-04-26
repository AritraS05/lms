import BackButton from '@/components/BackButton';
import { redirect, notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/getCurrentUser';
import { serverFetchJSON } from '@/lib/serverFetch';
import { formatINR2 } from '@/lib/loan';
import { userOf, type LoanWithUser, type Payment } from '@/lib/ops';
import DashboardShell from '../../DashboardShell';
import StatusBadge from '../../StatusBadge';
import RecordPaymentForm from './RecordPaymentForm';

const ALLOWED = new Set(['Admin', 'Collection']);

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!ALLOWED.has(user.role)) redirect('/dashboard');

  const data = await serverFetchJSON<{
    loan: LoanWithUser;
    payments: Payment[];
    outstanding: number;
  }>(`/api/collection/loans/${id}`);

  if (!data?.loan) notFound();
  const { loan, payments, outstanding } = data;
  const u = userOf(loan);

  return (
    <DashboardShell user={user} current="/dashboard/collection">
      <BackButton fallbackHref="/dashboard/collection">
        Back to disbursed loans
      </BackButton>

      <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              {u?.name ?? 'Borrower'}
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {u?.email ?? '—'}
            </p>
          </div>
          <StatusBadge status={loan.status} />
        </div>
        <dl className="mt-6 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <Stat label="Total repayment" value={formatINR2(loan.totalRepayment)} />
          <Stat label="Paid so far" value={formatINR2(loan.amountPaid)} />
          <Stat
            label="Outstanding"
            value={formatINR2(outstanding)}
            emphasis
          />
          <Stat label="Tenure" value={`${loan.tenureDays} days`} />
        </dl>
        <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">
          Disbursed{' '}
          {loan.disbursedAt
            ? new Date(loan.disbursedAt).toLocaleString()
            : '—'}
        </p>
      </div>

      {loan.status === 'disbursed' ? (
        <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            Record a payment
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            UTR must be unique across all payments. Amount cannot exceed{' '}
            {formatINR2(outstanding)}.
          </p>
          <RecordPaymentForm
            loanId={loan._id}
            outstanding={outstanding}
          />
        </div>
      ) : (
        <p className="mt-6 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200">
          Loan is fully repaid and closed. No further payments can be recorded.
        </p>
      )}

      <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          Payment history
        </h2>
        {payments.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
            No payments recorded yet.
          </p>
        ) : (
          <table className="mt-4 min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                <th className="py-2">UTR</th>
                <th className="py-2 text-right">Amount</th>
                <th className="py-2">Paid on</th>
                <th className="py-2">Recorded</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {payments.map((p) => (
                <tr key={p._id}>
                  <td className="py-2 font-mono text-xs text-zinc-900 dark:text-zinc-50">
                    {p.utr}
                  </td>
                  <td className="py-2 text-right font-medium text-zinc-900 dark:text-zinc-50">
                    {formatINR2(p.amount)}
                  </td>
                  <td className="py-2 text-zinc-600 dark:text-zinc-400">
                    {new Date(p.paidOn).toLocaleDateString()}
                  </td>
                  <td className="py-2 text-zinc-600 dark:text-zinc-400">
                    {new Date(p.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </DashboardShell>
  );
}

function Stat({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        {label}
      </dt>
      <dd
        className={`mt-1 ${
          emphasis
            ? 'text-lg font-semibold text-zinc-900 dark:text-zinc-50'
            : 'font-medium text-zinc-900 dark:text-zinc-50'
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
