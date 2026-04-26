import { cookies } from 'next/headers';
import { API_URL, AUTH_COOKIE } from './api';

/**
 * Server-side helper for forwarding the auth cookie to the backend
 * and parsing the JSON response. Returns `null` on any failure so
 * pages can render a graceful empty state.
 */
export async function serverFetchJSON<T>(path: string): Promise<T | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;
  if (!token) return null;

  try {
    const res = await fetch(`${API_URL}${path}`, {
      headers: { cookie: `${AUTH_COOKIE}=${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}
