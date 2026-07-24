import { beforeEach, describe, expect, it, vi } from 'vitest';
import { userProfiles } from '@/tests/fixtures/data';

const mocks = vi.hoisted(() => ({
  cookies: vi.fn(),
  getAdminAuth: vi.fn(),
  getAdminDb: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: mocks.cookies,
}));

vi.mock('@/lib/firebase-admin', () => ({
  getAdminAuth: mocks.getAdminAuth,
  getAdminDb: mocks.getAdminDb,
}));

function createProfileDb(profiles: Record<string, any>) {
  return {
    collection: vi.fn(() => ({
      doc: vi.fn((uid: string) => ({
        get: vi.fn(async () => ({
          exists: Boolean(profiles[uid]),
          data: () => profiles[uid],
        })),
      })),
    })),
  };
}

describe('auth-session', () => {
  let adminAuth: {
    verifyIdToken: ReturnType<typeof vi.fn>;
    verifySessionCookie: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    adminAuth = {
      verifyIdToken: vi.fn(async (token: string) => ({ uid: token === 'admin-token' ? 'user-admin' : 'user-approved', email: `${token}@example.com` })),
      verifySessionCookie: vi.fn(async () => ({ uid: 'user-pending', email: 'pending-cookie@example.com' })),
    };

    mocks.getAdminAuth.mockReturnValue(adminAuth);
    mocks.getAdminDb.mockReturnValue(createProfileDb({
      'user-admin': userProfiles.admin,
      'user-approved': userProfiles.approved,
      'user-pending': userProfiles.pending,
    }));
    mocks.cookies.mockResolvedValue({ get: vi.fn(() => ({ value: 'session-cookie' })) });
  });

  it('prefers a valid Firebase ID token and resolves the Firestore profile', async () => {
    const { requireUser } = await import('@/lib/auth-session');

    const user = await requireUser('approved-token');

    expect(adminAuth.verifyIdToken).toHaveBeenCalledWith('approved-token', true);
    expect(adminAuth.verifySessionCookie).not.toHaveBeenCalled();
    expect(user).toMatchObject({
      uid: 'user-approved',
      email: 'approved-token@example.com',
      role: 'approved',
      profile: userProfiles.approved,
    });
  });

  it('falls back to the httpOnly session cookie when an ID token is stale', async () => {
    const { requireUser } = await import('@/lib/auth-session');
    adminAuth.verifyIdToken.mockRejectedValueOnce(new Error('revoked'));

    const user = await requireUser('stale-token');

    expect(adminAuth.verifySessionCookie).toHaveBeenCalledWith('session-cookie', true);
    expect(user).toMatchObject({ uid: 'user-pending', role: 'pending', profile: userProfiles.pending });
  });

  it('ignores empty string-like tokens and uses the cookie path', async () => {
    const { requireUser } = await import('@/lib/auth-session');

    await requireUser(' undefined ');

    expect(adminAuth.verifyIdToken).not.toHaveBeenCalled();
    expect(adminAuth.verifySessionCookie).toHaveBeenCalledWith('session-cookie', true);
  });

  it('throws Unauthorized when neither token nor cookie can resolve a user', async () => {
    const { requireUser } = await import('@/lib/auth-session');
    mocks.cookies.mockResolvedValueOnce({ get: vi.fn(() => undefined) });

    await expect(requireUser(null)).rejects.toThrow('Unauthorized');
  });

  it('defaults users without a Firestore profile to pending', async () => {
    const { requireUser } = await import('@/lib/auth-session');
    mocks.getAdminDb.mockReturnValueOnce(createProfileDb({}));

    const user = await requireUser('approved-token');

    expect(user).toMatchObject({ uid: 'user-approved', role: 'pending', profile: null });
  });

  it('allows admins and rejects non-admins for requireAdmin', async () => {
    const { requireAdmin } = await import('@/lib/auth-session');

    await expect(requireAdmin('admin-token')).resolves.toMatchObject({ role: 'admin' });
    await expect(requireAdmin('approved-token')).rejects.toThrow('Forbidden');
  });

  it('returns null for getSessionUserProfile when no valid session exists', async () => {
    const { getSessionUserProfile } = await import('@/lib/auth-session');
    adminAuth.verifySessionCookie.mockRejectedValueOnce(new Error('expired'));

    await expect(getSessionUserProfile()).resolves.toBeNull();
  });
});
