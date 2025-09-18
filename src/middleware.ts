import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJwtToken } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Get token from cookies
  const token = request.cookies.get('token')?.value;

  // Check if it's an admin route
  if (pathname.startsWith('/admin')) {
    // If no token, redirect to admin login
    if (!token) {
      return NextResponse.redirect(new URL('/auth/admin/login', request.url));
    }

    try {
      // Verify token and check role
      const decoded = await verifyJwtToken(token);
      if (!decoded || decoded.role !== 'admin') {
        return NextResponse.redirect(new URL('/auth/admin/login', request.url));
      }
    } catch (error) {
      return NextResponse.redirect(new URL('/auth/admin/login', request.url));
    }
  }

  // Check if it's a tradesman route
  if (pathname.startsWith('/tradesman')) {
    // If no token, redirect to login
    if (!token) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    try {
      // Verify token and check role
      const decoded = await verifyJwtToken(token);
      if (!decoded || decoded.role !== 'tradesman') {
        return NextResponse.redirect(new URL('/auth/login', request.url));
      }
    } catch (error) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }

  return NextResponse.next();
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    '/admin/:path*',
    '/tradesman/:path*',
  ],
}; 