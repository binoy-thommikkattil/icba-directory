import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('rateLimit', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-23T08:30:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows the first sixty normal requests per IP and blocks the sixty-first', async () => {
    const { rateLimit } = await import('@/lib/rate-limit');
    const makeRequest = () => new Request('https://example.com/api/process-song', { headers: { 'x-forwarded-for': '10.0.0.1' } });

    for (let index = 0; index < 60; index += 1) {
      expect(rateLimit(makeRequest())).toBeNull();
    }

    const response = rateLimit(makeRequest());
    expect(response?.status).toBe(429);
    await expect(response?.json()).resolves.toEqual({ error: 'Too many requests. Please try again shortly.' });
  });

  it('resets the bucket after the one-minute window', async () => {
    const { rateLimit } = await import('@/lib/rate-limit');
    const request = () => new Request('https://example.com/api/process-song', { headers: { 'x-forwarded-for': '10.0.0.2' } });

    for (let index = 0; index < 60; index += 1) rateLimit(request());
    expect(rateLimit(request())?.status).toBe(429);

    vi.setSystemTime(new Date('2026-07-23T08:31:01.000Z'));

    expect(rateLimit(request())).toBeNull();
  });

  it('bypasses RSC, prefetch, and server-action traffic', async () => {
    const { rateLimit } = await import('@/lib/rate-limit');

    expect(rateLimit(new Request('https://example.com/dashboard?_rsc=abc'))).toBeNull();
    expect(rateLimit(new Request('https://example.com/dashboard', { headers: { RSC: '1' } }))).toBeNull();
    expect(rateLimit(new Request('https://example.com/dashboard', { headers: { 'Next-Router-Prefetch': '1' } }))).toBeNull();
    expect(rateLimit(new Request('https://example.com/dashboard', { headers: { 'Next-Action': 'abc' } }))).toBeNull();
  });
});
