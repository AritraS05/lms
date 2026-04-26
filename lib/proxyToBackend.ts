import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { API_URL, AUTH_COOKIE } from './api';

/**
 * Reusable JSON-in / JSON-out proxy from a Next.js Route Handler to Express,
 * preserving auth cookie and forwarding the upstream status verbatim.
 */
export async function proxyJSON(
  path: string,
  init: { method: string; body?: unknown },
): Promise<Response> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${API_URL}${path}`, {
      method: init.method,
      headers: {
        'Content-Type': 'application/json',
        cookie: `${AUTH_COOKIE}=${token}`,
      },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    });
  } catch (err) {
    console.error(`[proxy ${init.method} ${path}] backend unreachable:`, err);
    return NextResponse.json(
      { message: `Cannot reach backend at ${API_URL}.` },
      { status: 502 },
    );
  }

  const text = await upstream.text();
  let data: unknown = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text || 'Backend returned a non-JSON response' };
  }
  return NextResponse.json(data, { status: upstream.status });
}
