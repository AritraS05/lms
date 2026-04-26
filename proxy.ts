import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/signup'];
const AUTH_COOKIE = process.env.AUTH_COOKIE_NAME ?? 'lms_token';

/**
 * Next.js 16 Proxy (formerly Middleware).
 *
 * Optimistic gate: if no auth cookie is present and the route is not public,
 * redirect to /login. Real session validation happens on the server
 * (getCurrentUser) before rendering protected pages.
 *
 * Note: we intentionally do NOT redirect cookie-bearing requests away from
 * /login or /signup. The proxy can only check cookie presence — it can't tell
 * a stale/invalid token from a live one. If we redirected here, a stale cookie
 * would cause /login → /dashboard → (auth fails) → /login → ... loops.
 * /login and /signup are always safe to render; if the user is genuinely
 * authenticated, they can navigate on from there.
 */
export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  const hasToken = Boolean(request.cookies.get(AUTH_COOKIE)?.value);

  if (!isPublic && !hasToken) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Run on every path except API route handlers, Next internals, and static assets.
  // /api/* must be excluded so unauthenticated signup/login POSTs aren't redirected.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
