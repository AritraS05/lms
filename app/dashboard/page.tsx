import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/getCurrentUser';
import { getBorrowerProfile } from '@/lib/getBorrowerProfile';
import { getMyLoans } from '@/lib/getMyLoans';
import { ROLE_TO_MODULE } from '@/lib/ops';
import { ACTIVE_LOAN_STATUSES, formatINR, formatINR2 } from '@/lib/loan';
import type { Loan } from '@/lib/loan';
import DashboardShell from './DashboardShell';
import StatusBadge from './StatusBadge';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  // Executives: route them to their single module.
  const moduleHref = ROLE_TO_MODULE[user.role];
  if (moduleHref) redirect(moduleHref);

  // Admin: 4-module overview.
  if (user.role === 'Admin') {
    return (
      <DashboardShell user={user} current="/dashboard">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Operations dashboard
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Admins can access every module. Executives only see their own.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ModuleCard
            href="/dashboard/sales"
            title="Sales"
            description="Pre-application leads — registered borrowers who haven't applied yet."
            tone="sky"
          />
          <ModuleCard
            href="/dashboard/sanction"
            title="Sanction"
            description="Review pending applications. Approve or reject with a reason."
            tone="amber"
          />
          <ModuleCard
            href="/dashboard/disbursement"
            title="Disbursement"
            description="Mark sanctioned loans as disbursed once funds are released."
            tone="violet"
          />
          <ModuleCard
            href="/dashboard/collection"
            title="Collection"
            description="Track active loans. Record repayments — auto-closes when fully paid."
            tone="emerald"
          />
        </div>
      </DashboardShell>
    );
  }

  // Borrower: existing application dashboard with full step guards.
  if (user.role !== 'Borrower') {
    redirect('/login');
  }

  const borrowerProfile = await getBorrowerProfile();
  if (!borrowerProfile || borrowerProfile.status !== 'eligible') {
    redirect('/borrower/personal-details');
  }
  if (!borrowerProfile.salarySlip) {
    redirect('/borrower/salary-slip');
  }
  const loans: Loan[] = await getMyLoans();
  if (loans.length === 0) redirect('/borrower/apply-loan');
  const activeLoan =
    loans.find((l) => ACTIVE_LOAN_STATUSES.includes(l.status)) ?? null;

  return (
    <DashboardShell user={user}>
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Welcome, {user.name}
        </h2>
        <dl className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-zinc-500 dark:text-zinc-400">Email</dt>
            <dd className="mt-1 font-medium text-zinc-900 dark:text-zinc-50">
              {user.email}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500 dark:text-zinc-400">Role</dt>
            <dd className="mt-1">
              <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100">
                {user.role}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500 dark:text-zinc-400">Member since</dt>
            <dd className="mt-1 font-medium text-zinc-900 dark:text-zinc-50">
              {new Date(user.createdAt).toLocaleDateString()}
            </dd>
          </div>
        </dl>
      </div>

      <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-900/60 dark:bg-emerald-950/40">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
            Eligibility check passed
          </h3>
          <span className="inline-flex items-center rounded-full bg-emerald-200 px-2.5 py-0.5 text-xs font-medium text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100">
            Eligible
          </span>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-emerald-700 dark:text-emerald-300">Name</dt>
            <dd className="mt-1 font-medium text-emerald-950 dark:text-emerald-50">
              {borrowerProfile.fullName}
            </dd>
          </div>
          <div>
            <dt className="text-emerald-700 dark:text-emerald-300">PAN</dt>
            <dd className="mt-1 font-mono font-medium text-emerald-950 dark:text-emerald-50">
              {borrowerProfile.pan}
            </dd>
          </div>
          <div>
            <dt className="text-emerald-700 dark:text-emerald-300">Salary</dt>
            <dd className="mt-1 font-medium text-emerald-950 dark:text-emerald-50">
              ₹{borrowerProfile.monthlySalary.toLocaleString('en-IN')}
            </dd>
          </div>
          <div>
            <dt className="text-emerald-700 dark:text-emerald-300">
              Employment
            </dt>
            <dd className="mt-1 font-medium text-emerald-950 dark:text-emerald-50">
              {borrowerProfile.employmentMode}
            </dd>
          </div>
        </dl>

        {borrowerProfile.salarySlip && (
          <div className="mt-4 flex items-center justify-between rounded-md border border-emerald-200 bg-white px-4 py-3 dark:border-emerald-900/60 dark:bg-emerald-950/60">
            <div className="text-sm">
              <p className="font-medium text-emerald-900 dark:text-emerald-100">
                Salary slip on file
              </p>
              <p className="text-emerald-700 dark:text-emerald-300">
                {borrowerProfile.salarySlip.originalName} ·{' '}
                {(borrowerProfile.salarySlip.size / 1024).toFixed(0)} KB
              </p>
            </div>
            <a
              href="/api/borrower/salary-slip/file"
              target="_blank"
              rel="noreferrer"
              className="rounded-md border border-emerald-300 bg-white px-3 py-1.5 text-xs font-medium text-emerald-900 hover:bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-100 dark:hover:bg-emerald-900"
            >
              View
            </a>
          </div>
        )}
      </div>

      {activeLoan && <BorrowerLoanCard loan={activeLoan} />}

      {loans.length > 1 && (
        <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Loan history
          </h3>
          <ul className="mt-4 divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
            {loans
              .filter((l) => l._id !== activeLoan?._id)
              .map((l) => (
                <li
                  key={l._id}
                  className="flex items-center justify-between py-3"
                >
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-zinc-50">
                      {formatINR(l.principal)} · {l.tenureDays} days
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Applied {new Date(l.appliedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <StatusBadge status={l.status} />
                </li>
              ))}
          </ul>
        </div>
      )}
    </DashboardShell>
  );
}

function BorrowerLoanCard({ loan }: { loan: Loan }) {
  return (
    <div className="mt-6 rounded-xl border border-indigo-200 bg-indigo-50 p-6 shadow-sm dark:border-indigo-900/60 dark:bg-indigo-950/40">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Active loan application
        </h3>
        <StatusBadge status={loan.status} />
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-zinc-500 dark:text-zinc-400">Principal</dt>
          <dd className="mt-1 font-medium text-zinc-900 dark:text-zinc-50">
            {formatINR(loan.principal)}
          </dd>
        </div>
        <div>
          <dt className="text-zinc-500 dark:text-zinc-400">Tenure</dt>
          <dd className="mt-1 font-medium text-zinc-900 dark:text-zinc-50">
            {loan.tenureDays} days
          </dd>
        </div>
        <div>
          <dt className="text-zinc-500 dark:text-zinc-400">
            Interest @ {loan.interestRatePct}%
          </dt>
          <dd className="mt-1 font-medium text-zinc-900 dark:text-zinc-50">
            {formatINR2(loan.interestAmount)}
          </dd>
        </div>
        <div>
          <dt className="text-zinc-500 dark:text-zinc-400">Total repayment</dt>
          <dd className="mt-1 font-semibold text-zinc-900 dark:text-zinc-50">
            {formatINR2(loan.totalRepayment)}
          </dd>
        </div>
      </dl>
      <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">
        Applied on {new Date(loan.appliedAt).toLocaleString()}
      </p>
    </div>
  );
}

function ModuleCard({
  href,
  title,
  description,
  tone,
}: {
  href: string;
  title: string;
  description: string;
  tone: 'sky' | 'amber' | 'violet' | 'emerald';
}) {
  const TONES: Record<string, string> = {
    sky: 'bg-sky-50 border-sky-200 dark:bg-sky-950/40 dark:border-sky-900/60',
    amber:
      'bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-900/60',
    violet:
      'bg-violet-50 border-violet-200 dark:bg-violet-950/40 dark:border-violet-900/60',
    emerald:
      'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900/60',
  };
  return (
    <Link
      href={href}
      className={`block rounded-xl border p-5 transition-shadow hover:shadow-md ${TONES[tone]}`}
    >
      <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
        {title}
      </h3>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        {description}
      </p>
      <span className="mt-4 inline-block text-xs font-medium text-zinc-900 dark:text-zinc-50">
        Open module →
      </span>
    </Link>
  );
}
