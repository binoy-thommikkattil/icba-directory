// Renamed from `middleware.ts` per Next.js 16 deprecation notice:
// https://nextjs.org/docs/messages/middleware-to-proxy
//
// The `proxy` file convention will remain supported through Next.js 17+;
// the legacy `middleware` name is scheduled for removal.
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';

const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://maps.googleapis.com https://www.google.com https://www.gstatic.com https://cdnjs.cloudflare.com https://static.cloudflareinsights.com https://apis.google.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
  "img-src 'self' data: https: blob:",
  "font-src 'self' https://fonts.gstatic.com data:",
  "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://*.gstatic.com https://maps.googleapis.com https://maps.gstatic.com https://www.googleapis.com https://firebase.googleapis.com https://securetoken.googleapis.com https://*.firebaseapp.com",
  "frame-src 'self' https://www.google.com https://www.gstatic.com https://*.firebaseapp.com https://accounts.google.com https://immanuel-assembly.com https://www.immanuel-assembly.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self' https://*.firebaseapp.com https://immanuel-assembly.com https://www.immanuel-assembly.com",
  "upgrade-insecure-requests"
].join('; ');

export function proxy(request: NextRequest) {
  const rateLimited = rateLimit(request);
  if (rateLimited) return rateLimited;

  const response = NextResponse.next();
  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  // Changed from DENY to SAMEORIGIN so Firebase Auth can inject its background iframe
  response.headers.set('X-Frame-Options', 'SAMEORIGIN'); 
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.json).*)'],
};