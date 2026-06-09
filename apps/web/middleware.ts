import { NextRequest, NextResponse } from 'next/server';

const protectedPrefixes = ['/buyer', '/supplier', '/admin', '/rfq', '/samples'];

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const protectedRoute = protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

  if (!protectedRoute) return NextResponse.next();

  const hasSession = Boolean(request.cookies.get('tdh_session')?.value);
  if (hasSession) return NextResponse.next();

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = '/login';
  loginUrl.searchParams.set('next', `${pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/buyer/:path*', '/supplier/:path*', '/admin/:path*', '/rfq/:path*', '/samples', '/samples/:path*'],
};
