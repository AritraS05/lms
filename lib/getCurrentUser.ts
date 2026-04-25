import { cookies } from 'next/headers';
import { API_URL, AUTH_COOKIE, AuthUser } from './api';

/**
 * Server-side helper for fetching the authenticated user.
 * Returns null when unauthenticated (no cookie or token rejected).
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;
  if (!token) return null;

  try {
    const res = await fetch(`${API_URL}/api/auth/me`, {
      headers: {
        cookie: `${AUTH_COOKIE}=${token}`,
      },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { user: AuthUser };
    return data.user;
  } catch {
    return null;
  }
}
