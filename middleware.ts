import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isAdminRequest } from '@/lib/admin';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (path === '/admin/login' || path === '/admin/login/') {
    const res = NextResponse.next();
    res.headers.set('x-admin-page', 'login');
    return res;
  }
  if (path.startsWith('/admin')) {
    const token = request.cookies.get('admin_token')?.value;
    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    const res = NextResponse.next();
    res.headers.set('x-admin-page', 'dashboard');
    return res;
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};