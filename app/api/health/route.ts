import { NextResponse } from 'next/server';

// Force dynamic so uptime monitors always hit the running function,
// not a cached response from the CDN edge.
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    commit: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
    region: process.env.VERCEL_REGION ?? null,
  });
}
