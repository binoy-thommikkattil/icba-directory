import { NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin';

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 5;

function getCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}

export async function POST(request: Request) {
  try {
    const { idToken } = await request.json();
    if (!idToken) {
      return NextResponse.json({ error: 'Missing idToken' }, { status: 400 });
    }

    const sessionCookie = await getAdminAuth().createSessionCookie(idToken, {
      expiresIn: SESSION_MAX_AGE_SECONDS * 1000,
    });

    const response = NextResponse.json({ ok: true });
    response.cookies.set('session', sessionCookie, getCookieOptions());
    return response;
  } catch (err) {
    console.error('Failed to create session cookie:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    const isAuthError = /token|auth|credential|unauthorized/i.test(message);
    return NextResponse.json(
      { error: isAuthError ? 'Unauthorized' : 'Failed to create session' },
      { status: isAuthError ? 401 : 500 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set('session', '', { ...getCookieOptions(), maxAge: 0 });
  return response;
}
