import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/getCurrentUser';
import { getBorrowerProfile } from '@/lib/getBorrowerProfile';
import { getActiveLoan } from '@/lib/getMyLoans';
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

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16 dark:bg-black">
      <div className="w-full max-w-2xl rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Step 4 of your application
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Configure your loan
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
