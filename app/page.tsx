import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/getCurrentUser';
import { getBorrowerProfile } from '@/lib/getBorrowerProfile';
import { getActiveLoan } from '@/lib/getMyLoans';

export default async function Home() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  // Borrowers must clear each step in order before reaching the dashboard.
  if (user.role === 'Borrower') {
    const profile = await getBorrowerProfile();
    if (!profile || profile.status !== 'eligible') {
      redirect('/borrower/personal-details');
    }
    if (!profile.salarySlip) {
      redirect('/borrower/salary-slip');
    }
    const activeLoan = await getActiveLoan();
    if (!activeLoan) {
      redirect('/borrower/apply-loan');
    }
  }

  redirect('/dashboard');
}
