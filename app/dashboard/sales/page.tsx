import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/getCurrentUser';
import { serverFetchJSON } from '@/lib/serverFetch';
import { STAGE_LABEL, type Lead } from '@/lib/ops';
import DashboardShell from '../DashboardShell';

const ALLOWED = new Set(['Admin', 'Sales']);

const STAGE_TONE: Record<string, string> = {
  'signed-up':
    'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100',
  'rejected-bre':
    'bg-red-100 text-red-900 dark:bg-red-950/60 dark:text-red-200',
  'eligible-no-slip':
    'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200',
  'slip-uploaded':
    'bg-sky-100 text-sky-900 dark:bg-sky-950/60 dark:text-sky-200',
  'loan-applied':
    'bg-indigo-100 text-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-200',
  'loan-closed':
    'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200',
};

export default async function SalesPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!ALLOWED.has(user.role)) redirect('/dashboard');

  const data = await serverFetchJSON<{ leads: Lead[] }>('/api/sales/leads');
  const leads = data?.leads ?? [];

  return (
    <DashboardShell user={user} current="/dashboard/sales">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Sales — leads
        </h1>
        <span className="text-sm text-zinc-500 dark:text-zinc-400">
          {leads.length} borrower{leads.length === 1 ? '' : 's'}
        </span>
      </div>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Pre-application stage. Each row shows where the borrower is in the
        funnel.
      </p>

      <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-900">
            <tr className="text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Salary</th>
              <th className="px-4 py-3">Stage</th>
              <th className="px-4 py-3">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {leads.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400"
                >
                  No leads yet.
                </td>
              </tr>
            )}
            {leads.map((lead) => (
              <tr
                key={lead._id}
                className="text-zinc-900 dark:text-zinc-100"
              >
                <td className="px-4 py-3 font-medium">
                  {lead.profile?.fullName ?? lead.name}
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                  {lead.email}
                </td>
                <td className="px-4 py-3">
                  {lead.profile?.monthlySalary
                    ? `₹${lead.profile.monthlySalary.toLocaleString('en-IN')}`
                    : '—'}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STAGE_TONE[lead.stage]}`}
                  >
                    {STAGE_LABEL[lead.stage]}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                  {new Date(lead.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardShell>
  );
}
