import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('getBase64ImageFromUrl', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('converts fetched image blobs into data URLs with dimensions', async () => {
    const { getBase64ImageFromUrl } = await import('@/lib/imageUtils');
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      blob: async () => new Blob(['image-bytes'], { type: 'image/jpeg' }),
    } as Response);

    vi.spyOn(window, 'Image').mockImplementation(function ImageMock(this: HTMLImageElement) {
      Object.defineProperty(this, 'width', { value: 640 });
      Object.defineProperty(this, 'height', { value: 480 });
      setTimeout(() => this.onload?.(new Event('load')));
      return this;
    } as unknown as typeof Image);

    const result = await getBase64ImageFromUrl('https://example.com/photo.jpg');

    expect(fetch).toHaveBeenCalledWith('https://example.com/photo.jpg', { mode: 'cors' });
    expect(result).toEqual({ dataUrl: expect.stringContaining('data:'), width: 640, height: 480 });
  });

  it('returns null and alerts when the image cannot be fetched', async () => {
    const { getBase64ImageFromUrl } = await import('@/lib/imageUtils');
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false, status: 403, statusText: 'Forbidden' } as Response);

    await expect(getBase64ImageFromUrl('https://example.com/private.jpg')).resolves.toBeNull();
    expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('PDF Image Fetch Failed'));
  });
});
