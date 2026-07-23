import { cookies } from 'next/headers';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';

type UserProfile = {
  role?: 'admin' | 'approved' | 'pending' | string;
  email?: string;
  name?: string;
  [key: string]: unknown;
};

export interface AuthenticatedUser {
  uid: string;
  email: string | null;
  profile: UserProfile | null;
  role: 'admin' | 'approved' | 'pending' | string;
  [key: string]: unknown;
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

function normalizeToken(token?: string | null) {
  const trimmed = token?.trim();
  if (!trimmed || trimmed === 'undefined' || trimmed === 'null') return null;
  return trimmed;
}

async function loadProfile(decoded: DecodedIdToken): Promise<AuthenticatedUser> {
  const userDoc = await getAdminDb().collection('users').doc(decoded.uid).get();
  const profile = userDoc.exists ? (userDoc.data() as UserProfile) : null;
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
 * If token verification fails (stale/expired/revoked token), we still try the
 * session cookie before giving up. Throws Error("Unauthorized") only when both
 * paths fail.
 */
export async function requireUser(token?: string | null): Promise<AuthenticatedUser> {
  const normalizedToken = normalizeToken(token);

  if (normalizedToken) {
    try {
      const decoded = await decodeIdToken(normalizedToken);
      return await loadProfile(decoded);
    } catch (err) {
      // Token failed verification — fall through to cookie fallback rather
      // than immediately rejecting. This makes the app resilient to stale
      // client tokens (e.g. the client hasn't refreshed yet) as long as the
      // httpOnly session cookie is still valid.
      console.warn('ID token path failed, falling back to session cookie:', err);
    }
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
