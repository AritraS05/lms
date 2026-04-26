import { cookies } from 'next/headers';
import { API_URL, AUTH_COOKIE } from './api';
import { ACTIVE_LOAN_STATUSES, type Loan } from './loan';

/** All loans for the current user, newest first. */
export async function getMyLoans(): Promise<Loan[]> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;
  if (!token) return [];

  try {
    const res = await fetch(`${API_URL}/api/loans/me`, {
      headers: { cookie: `${AUTH_COOKIE}=${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { loans: Loan[] };
    return data.loans ?? [];
  } catch {
    return [];
  }
}

/** The single loan currently blocking a new application, if any. */
export async function getActiveLoan(): Promise<Loan | null> {
  const loans = await getMyLoans();
  return (
    loans.find((l) => ACTIVE_LOAN_STATUSES.includes(l.status)) ?? null
  );
}
