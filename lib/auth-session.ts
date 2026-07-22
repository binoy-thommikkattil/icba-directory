import { cookies } from 'next/headers';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';

export async function getSessionUser() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session')?.value;

  if (!sessionCookie) {
    return null;
  }

  try {
    return await getAdminAuth().verifySessionCookie(sessionCookie, true);
  } catch {
    return null;
  }
}

export async function getSessionUserProfile() {
  const decodedToken = await getSessionUser();
  if (!decodedToken) {
    return null;
  }

  const userDoc = await getAdminDb().collection('users').doc(decodedToken.uid).get();
  const profile = userDoc.exists ? userDoc.data() : null;

  return {
    ...decodedToken,
    profile,
    role: profile?.role ?? 'pending',
    email: decodedToken.email ?? profile?.email ?? null,
  };
}

export async function requireUser() {
  const user = await getSessionUserProfile();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== 'admin') {
    throw new Error('Forbidden');
  }
  return user;
}
