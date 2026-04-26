import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/getCurrentUser';
import { getBorrowerProfile } from '@/lib/getBorrowerProfile';
import LogoutButton from './LogoutButton';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  // Borrower-specific guards: must have cleared every prior step.
  let borrowerProfile = null;
  if (user.role === 'Borrower') {
    borrowerProfile = await getBorrowerProfile();
    if (!borrowerProfile || borrowerProfile.status !== 'eligible') {
      redirect('/borrower/personal-details');
    }
    if (!borrowerProfile.salarySlip) {
      redirect('/borrower/salary-slip');
    }
  }

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            LMS Dashboard
          </h1>
          <LogoutButton />
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-6 py-10">
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

        {borrowerProfile && (
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
                <dt className="text-emerald-700 dark:text-emerald-300">
                  Salary
                </dt>
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
        )}

        <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
          Loan management modules will appear here next.
        </p>
      </main>
    </div>
  );
}
