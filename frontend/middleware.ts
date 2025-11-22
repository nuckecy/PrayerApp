import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Middleware for Server-Side Route Protection
 *
 * Security Features:
 * - Server-side authentication checks (not bypassable)
 * - Role-based access control (RBAC)
 * - Admin route protection
 * - Author route protection
 * - Request size validation
 */

const MAX_REQUEST_SIZE = 100 * 1024; // 100KB limit

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Check request size to prevent DoS
  const contentLength = req.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > MAX_REQUEST_SIZE) {
    return new Response('Request payload too large', { status: 413 });
  }

  const supabase = createMiddlewareClient({ req, res });

  // Get current session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Protect admin routes
  if (req.nextUrl.pathname.startsWith('/admin')) {
    if (!session) {
      const redirectUrl = new URL('/auth/login', req.url);
      redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profile?.role !== 'super_admin') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  // Protect author routes
  if (req.nextUrl.pathname.startsWith('/author')) {
    if (!session) {
      const redirectUrl = new URL('/auth/login', req.url);
      redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Check if user is an active author
    const { data: author } = await supabase
      .from('authors')
      .select('id, status')
      .eq('user_id', session.user.id)
      .single();

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    // Allow if user is an active author OR is super_admin
    const isAuthorized =
      (author && author.status === 'active') ||
      profile?.role === 'super_admin';

    if (!isAuthorized) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  // Protect dashboard and other authenticated routes
  if (
    req.nextUrl.pathname.startsWith('/dashboard') ||
    req.nextUrl.pathname.startsWith('/goals') ||
    req.nextUrl.pathname.startsWith('/groups') ||
    req.nextUrl.pathname.startsWith('/profile')
  ) {
    if (!session) {
      const redirectUrl = new URL('/auth/login', req.url);
      redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Redirect authenticated users away from auth pages
  if (
    session &&
    (req.nextUrl.pathname.startsWith('/auth/login') ||
      req.nextUrl.pathname.startsWith('/auth/register'))
  ) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
