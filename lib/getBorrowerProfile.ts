import { cookies } from 'next/headers';
import { API_URL, AUTH_COOKIE } from './api';
import type { BorrowerProfile } from './borrower';

/**
 * Server-side helper to fetch the current borrower's profile.
 * Returns null when the user has not yet submitted personal details
 * (or is unauthenticated, or is not a borrower).
 */
export async function getBorrowerProfile(): Promise<BorrowerProfile | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;
  if (!token) return null;

  try {
    const res = await fetch(`${API_URL}/api/borrower/me`, {
      headers: { cookie: `${AUTH_COOKIE}=${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { profile: BorrowerProfile | null };
    return data.profile ?? null;
  } catch {
    return null;
  }
}
