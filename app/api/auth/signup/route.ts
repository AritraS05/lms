import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { API_URL, AUTH_COOKIE } from '@/lib/api';

const ONE_WEEK_SECONDS = 7 * 24 * 60 * 60;

export async function POST(req: Request) {
  const body = await req.json();

  let upstream: Response;
  try {
    upstream = await fetch(`${API_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.error('[auth/signup] backend unreachable:', err);
    return NextResponse.json(
      {
        message: `Cannot reach backend at ${API_URL}. Make sure 'npm run dev' is up and MongoDB is running.`,
      },
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

  if (!upstream.ok) {
    return NextResponse.json(data, { status: upstream.status });
  }

  const ok = data as { user: unknown; token: string };
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE, ok.token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: ONE_WEEK_SECONDS,
  });

  return NextResponse.json({ user: ok.user });
}
