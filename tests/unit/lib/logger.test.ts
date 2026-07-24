import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { userProfiles } from '@/tests/fixtures/data';

const mocks = vi.hoisted(() => ({
  addDoc: vi.fn(),
  collection: vi.fn(),
}));

vi.mock('@/lib/firebase', () => ({ db: { app: 'test-db' } }));

vi.mock('firebase/firestore', () => ({
  addDoc: mocks.addDoc,
  collection: mocks.collection,
}));

describe('logActivity', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-23T08:30:00.000Z'));
    mocks.collection.mockReturnValue({ collectionName: 'activity_logs' });
    mocks.addDoc.mockResolvedValue({ id: 'log-1' });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('writes audit activity for known users', async () => {
    const { logActivity } = await import('@/lib/logger');

    await logActivity(userProfiles.approved, 'Viewed Directory', 'Opened family list');

    expect(mocks.collection).toHaveBeenCalledWith({ app: 'test-db' }, 'activity_logs');
    expect(mocks.addDoc).toHaveBeenCalledWith({ collectionName: 'activity_logs' }, {
      userName: 'Approved Member',
      userEmail: 'approved@example.com',
      action: 'Viewed Directory',
      details: 'Opened family list',
      timestamp: '2026-07-23T08:30:00.000Z',
    });
  });

  it('does nothing when no profile is available', async () => {
    const { logActivity } = await import('@/lib/logger');

    await logActivity(null, 'Ignored', 'No user');

    expect(mocks.addDoc).not.toHaveBeenCalled();
  });
});
