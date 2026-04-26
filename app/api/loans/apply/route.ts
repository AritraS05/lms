import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { API_URL, AUTH_COOKIE } from '@/lib/api';

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  const body = await req.json();

  let upstream: Response;
  try {
    upstream = await fetch(`${API_URL}/api/loans/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: `${AUTH_COOKIE}=${token}`,
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.error('[loans/apply] backend unreachable:', err);
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
