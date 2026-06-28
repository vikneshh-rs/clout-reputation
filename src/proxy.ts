import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const COOKIE_NAME = 'cloutation_session';

// Lightweight, edge-safe JWT payload decoder
function decodeJwt(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    // Decode base64url encoded payload
    const payload = parts[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Block public self-registration
  if (pathname === '/register') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Get token from cookie
  const sessionCookie = request.cookies.get(COOKIE_NAME);
  const token = sessionCookie?.value;
  
  const payload = token ? decodeJwt(token) : null;
  const isExpired = payload?.exp ? Date.now() >= payload.exp * 1000 : true;
  const user = !isExpired ? payload : null;

  // 1. Protected Super Admin Routes
  if (pathname.startsWith('/dashboard/admin') || pathname.startsWith('/dashboard/super-admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/superadmin', request.url));
    }
    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/superadmin?error=access_denied', request.url));
    }
    if (pathname.startsWith('/dashboard/super-admin')) {
      const rest = pathname.substring('/dashboard/super-admin'.length);
      return NextResponse.redirect(new URL(`/dashboard/admin${rest}`, request.url));
    }
  }

  // 2. Protected Rep Routes
  if (pathname.startsWith('/dashboard/rep')) {
    if (!user) {
      return NextResponse.redirect(new URL('/reps', request.url));
    }
    if (user.role !== 'REP' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/reps?error=access_denied', request.url));
    }
  }

  // 3. Protected Business Owner/Manager Routes
  if (pathname.startsWith('/dashboard/business')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    if (user.role !== 'BUSINESS' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/login?error=access_denied', request.url));
    }
  }

  // 4. Guest Only Login / Auth Redirects
  if (pathname === '/login' || pathname === '/superadmin' || pathname === '/reps' || pathname === '/forgot-password' || pathname === '/reset-password') {
    if (user) {
      if (user.role === 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/dashboard/admin', request.url));
      } else if (user.role === 'REP') {
        return NextResponse.redirect(new URL('/dashboard/rep', request.url));
      } else if (user.role === 'BUSINESS') {
        return NextResponse.redirect(new URL('/dashboard/business', request.url));
      }
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/superadmin',
    '/reps',
  ],
};
