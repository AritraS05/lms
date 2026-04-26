import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { API_URL, AUTH_COOKIE } from '@/lib/api';

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  // Re-pack the multipart so fetch sets a fresh boundary header.
  const incoming = await req.formData();
  const file = incoming.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json(
      { message: 'No file in form (field name must be "file")' },
      { status: 400 },
    );
  }

  const outgoing = new FormData();
  outgoing.append('file', file, file.name);

  let upstream: Response;
  try {
    upstream = await fetch(`${API_URL}/api/borrower/salary-slip`, {
      method: 'POST',
      headers: { cookie: `${AUTH_COOKIE}=${token}` },
      body: outgoing,
    });
  } catch (err) {
    console.error('[borrower/salary-slip] backend unreachable:', err);
    return NextResponse.json(
      {
        message: `Cannot reach backend at ${API_URL}.`,
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

  return NextResponse.json(data, { status: upstream.status });
}
