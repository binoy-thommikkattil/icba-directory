import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextResponse } from 'next/server';

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  rateLimit: vi.fn(),
}));

vi.mock('@/lib/auth-session', () => ({
  requireUser: mocks.requireUser,
}));

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: mocks.rateLimit,
}));

function postRequest(body: Record<string, unknown>, headers: Record<string, string> = {}) {
  return new Request('https://example.com/api/process-song', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

describe('/api/process-song route', () => {
  const originalGeminiKey = process.env.GEMINI_API_KEY;

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    process.env.GEMINI_API_KEY = 'test-gemini-key';
    mocks.requireUser.mockResolvedValue({ uid: 'user-approved', role: 'approved' });
    mocks.rateLimit.mockReturnValue(null);
  });

  afterEach(() => {
    process.env.GEMINI_API_KEY = originalGeminiKey;
    vi.unstubAllGlobals();
  });

  it('returns rate limit responses before doing authenticated work', async () => {
    const { POST } = await import('@/app/api/process-song/route');
    mocks.rateLimit.mockReturnValueOnce(NextResponse.json({ error: 'Too many requests' }, { status: 429 }));

    const response = await POST(postRequest({ inputMethod: 'text', payload: 'lyrics', language: 'English' }));

    expect(response.status).toBe(429);
    expect(mocks.requireUser).not.toHaveBeenCalled();
  });

  it('requires an authenticated bearer token or session fallback', async () => {
    const { POST } = await import('@/app/api/process-song/route');
    mocks.requireUser.mockRejectedValueOnce(new Error('Unauthorized'));

    const response = await POST(postRequest({ inputMethod: 'text', payload: 'lyrics', language: 'English' }));

    expect(response.status).toBe(401);
    expect(mocks.requireUser).toHaveBeenCalledWith(null);
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' });
  });

  it('processes text lyrics through Gemini and normalizes required fields', async () => {
    const { POST } = await import('@/app/api/process-song/route');
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: JSON.stringify({ title: '  Aaradhikkum  ', language: ' Malayalam ', originalAuthor: '', lyrics: 'Clean lyrics' }) }] } }],
      }),
    } as Response);

    const response = await POST(postRequest(
      { inputMethod: 'text', payload: 'raw lyrics', language: 'Auto-Detect', title: '', originalAuthor: '' },
      { Authorization: 'Bearer approved-token' },
    ));

    expect(mocks.requireUser).toHaveBeenCalledWith('approved-token');
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('gemini-2.5-flash:generateContent?key=test-gemini-key'),
      expect.objectContaining({ method: 'POST' }),
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      title: 'Aaradhikkum',
      language: 'Malayalam',
      originalAuthor: 'Unknown',
      lyrics: 'Clean lyrics',
    });
  });

  it('validates image payloads before calling Gemini', async () => {
    const { POST } = await import('@/app/api/process-song/route');

    const response = await POST(postRequest({ inputMethod: 'image', payload: [], language: 'English' }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'No image provided' });
  });

  it('fetches image bytes and sends inline data to Gemini', async () => {
    const { POST } = await import('@/app/api/process-song/route');
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'image/png' }),
        arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: JSON.stringify({ title: 'Image Song', language: 'Hindi', originalAuthor: 'Unknown', lyrics: 'Lyrics from image' }) }] } }],
        }),
      } as Response);

    const response = await POST(postRequest({ inputMethod: 'image', payload: ['https://example.com/song.png'], language: 'Auto-Detect' }));

    expect(fetchMock).toHaveBeenNthCalledWith(1, 'https://example.com/song.png');
    const geminiBody = JSON.parse(String(fetchMock.mock.calls[1][1]?.body));
    expect(geminiBody.contents[0].parts).toEqual(
      expect.arrayContaining([expect.objectContaining({ inline_data: expect.objectContaining({ mime_type: 'image/png' }) })]),
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ title: 'Image Song', language: 'Hindi' });
  });

  it('returns a backend error for malformed AI JSON', async () => {
    const { POST } = await import('@/app/api/process-song/route');
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ candidates: [{ content: { parts: [{ text: 'not-json' }] } }] }),
    } as Response);

    const response = await POST(postRequest({ inputMethod: 'text', payload: 'lyrics', language: 'English' }));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: 'Failed to process song backend' });
  });
});
