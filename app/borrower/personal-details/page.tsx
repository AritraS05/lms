import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/getCurrentUser';
import { getBorrowerProfile } from '@/lib/getBorrowerProfile';
import PersonalDetailsForm from './PersonalDetailsForm';

export default async function PersonalDetailsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role !== 'Borrower') redirect('/dashboard');

  const profile = await getBorrowerProfile();
  if (profile?.status === 'eligible') redirect('/dashboard');

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16 dark:bg-black">
      <div className="w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Step 2 of your application
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Personal details &amp; eligibility
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          We run a quick eligibility check before continuing. All checks must
          pass.
        </p>

        <PersonalDetailsForm
          defaultName={user.name}
          previousProfile={
            profile?.status === 'rejected'
              ? {
                  fullName: profile.fullName,
                  pan: profile.pan,
                  dob: profile.dob,
                  monthlySalary: profile.monthlySalary,
                  employmentMode: profile.employmentMode,
                  rejectionReasons: profile.rejectionReasons,
                }
              : null
          }
        />
      </div>
    </div>
  );
}
