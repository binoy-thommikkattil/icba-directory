import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createSessionCookie: vi.fn(),
}));

vi.mock('@/lib/firebase-admin', () => ({
  getAdminAuth: () => ({ createSessionCookie: mocks.createSessionCookie }),
}));

describe('/api/session route', () => {
  beforeEach(() => {
    mocks.createSessionCookie.mockResolvedValue('session-cookie-value');
  });

  it('rejects session creation without an idToken', async () => {
    const { POST } = await import('@/app/api/session/route');

    const response = await POST(new Request('https://example.com/api/session', { method: 'POST', body: JSON.stringify({}) }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Missing idToken' });
  });

  it('creates a secure session cookie for a valid idToken', async () => {
    const { POST } = await import('@/app/api/session/route');

    const response = await POST(new Request('https://example.com/api/session', {
      method: 'POST',
      body: JSON.stringify({ idToken: 'firebase-id-token' }),
    }));

    expect(mocks.createSessionCookie).toHaveBeenCalledWith('firebase-id-token', { expiresIn: 432000000 });
    expect(response.status).toBe(200);
    expect(response.headers.get('set-cookie')).toContain('session=session-cookie-value');
    await expect(response.json()).resolves.toEqual({ ok: true });
  });

  it('clears the session cookie on logout', async () => {
    const { DELETE } = await import('@/app/api/session/route');

    const response = await DELETE();

    expect(response.status).toBe(200);
    expect(response.headers.get('set-cookie')).toContain('Max-Age=0');
    await expect(response.json()).resolves.toEqual({ ok: true });
  });
});
