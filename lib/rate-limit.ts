import { NextRequest, NextResponse } from 'next/server';

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 60;

const ipBuckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(request: NextRequest | Request) {
  const rscHeader = request.headers.get('RSC');
  const prefetchHeader = request.headers.get('Next-Router-Prefetch');
  // Server Actions post back to the page URL with a `Next-Action` header.
  // They are already authenticated at the action layer (requireUser/requireAdmin);
  // rate-limiting them here would throttle normal, authenticated user activity
  // (e.g. uploading a song fires several actions back-to-back).
  const nextAction = request.headers.get('Next-Action');
  const rscQuery = new URL(request.url).searchParams.get('_rsc');

  if (rscHeader || prefetchHeader || rscQuery || nextAction) {
    return null;
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const now = Date.now();
  const bucket = ipBuckets.get(ip);

  if (!bucket || bucket.resetAt <= now) {
    ipBuckets.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return null;
  }

  if (bucket.count >= RATE_LIMIT_MAX_REQUESTS) {
    return NextResponse.json({ error: 'Too many requests. Please try again shortly.' }, { status: 429 });
  }

  bucket.count += 1;
  return null;
}
