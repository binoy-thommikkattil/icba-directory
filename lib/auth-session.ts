import { cookies } from 'next/headers';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';

export interface AuthenticatedUser {
  uid: string;
  email: string | null;
  profile: any | null;
  role: 'admin' | 'approved' | 'pending' | string;
  [key: string]: any;
}

async function decodeSessionCookie() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session')?.value;
  if (!sessionCookie) return null;
  try {
    return await getAdminAuth().verifySessionCookie(sessionCookie, true);
  } catch {
    return null;
  }
}

async function decodeIdToken(token: string) {
  try {
    // Pass checkRevoked=true so tokens for deleted/disabled users are rejected
    // immediately (matches verifySessionCookie(..., true) behavior).
    return await getAdminAuth().verifyIdToken(token, true);
  } catch (err) {
    console.error('Firebase ID Token verification failed:', err);
    throw new Error('Unauthorized');
  }
}

async function loadProfile(decoded: any): Promise<AuthenticatedUser> {
  const userDoc = await getAdminDb().collection('users').doc(decoded.uid).get();
  const profile = userDoc.exists ? userDoc.data() : null;
  return {
    ...decoded,
    profile,
    role: profile?.role ?? 'pending',
    email: decoded.email ?? profile?.email ?? null,
  };
}

export async function getSessionUser() {
  return decodeSessionCookie();
}

export async function getSessionUserProfile(): Promise<AuthenticatedUser | null> {
  const decoded = await decodeSessionCookie();
  if (!decoded) return null;
  return loadProfile(decoded);
}

/**
 * Resolve the caller from either a Firebase ID token (preferred, passed from
 * client `await auth.currentUser?.getIdToken()`) or the session cookie fallback.
 * Throws Error("Unauthorized") if neither is valid.
 */
export async function requireUser(token?: string | null): Promise<AuthenticatedUser> {
  if (token && token.length > 0) {
    const decoded = await decodeIdToken(token);
    return loadProfile(decoded);
  }
  const user = await getSessionUserProfile();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

export async function requireAdmin(token?: string | null): Promise<AuthenticatedUser> {
  const user = await requireUser(token);
  if (user.role !== 'admin') {
    throw new Error('Forbidden');
  }
  return user;
}
