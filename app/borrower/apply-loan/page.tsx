import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/getCurrentUser';
import { getBorrowerProfile } from '@/lib/getBorrowerProfile';
import { getActiveLoan, getMyLoans } from '@/lib/getMyLoans';
import Link from 'next/link';
import LoanApplyForm from './LoanApplyForm';

export default async function ApplyLoanPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role !== 'Borrower') redirect('/dashboard');

  const profile = await getBorrowerProfile();
  if (!profile || profile.status !== 'eligible') {
    redirect('/borrower/personal-details');
  }
  if (!profile.salarySlip) redirect('/borrower/salary-slip');

  const activeLoan = await getActiveLoan();
  if (activeLoan) redirect('/dashboard');

  const loans = await getMyLoans();
  const isFirstTime = loans.length === 0;

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16 dark:bg-black">
      <div className="w-full max-w-2xl rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        {!isFirstTime && (
          <Link
            href="/dashboard"
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to Dashboard
          </Link>
        )}
        {isFirstTime && (
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Step 4 of your application
          </p>
        )}
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {isFirstTime ? 'Configure your loan' : 'Apply for a new loan'}
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Pick your loan amount and tenure. Interest is fixed at 12% p.a. and
          calculated as Simple Interest.
        </p>

        <LoanApplyForm />
      </div>
    </div>
  );
}
