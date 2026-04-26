import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { API_URL, AUTH_COOKIE } from '@/lib/api';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${API_URL}/api/borrower/salary-slip/file`, {
      headers: { cookie: `${AUTH_COOKIE}=${token}` },
      cache: 'no-store',
    });
  } catch (err) {
    console.error('[borrower/salary-slip/file] backend unreachable:', err);
    return NextResponse.json(
      { message: 'Cannot reach backend' },
      { status: 502 },
    );
  }

  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text().catch(() => '');
    return NextResponse.json(
      { message: text || `Download failed (${upstream.status})` },
      { status: upstream.status || 502 },
    );
  }

  // Stream the file body through, preserving Content-Type and Content-Disposition.
  const headers = new Headers();
  const ct = upstream.headers.get('content-type');
  const cd = upstream.headers.get('content-disposition');
  if (ct) headers.set('content-type', ct);
  if (cd) headers.set('content-disposition', cd);

  return new Response(upstream.body, { status: 200, headers });
}
