import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { createAdminDbMock } from '@/tests/utils/adminDbMock';
import { families, songs, userProfiles } from '@/tests/fixtures/data';

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  requireAdmin: vi.fn(),
  getAdminDb: vi.fn(),
  getAdminAuth: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/auth-session', () => ({
  requireUser: mocks.requireUser,
  requireAdmin: mocks.requireAdmin,
}));

vi.mock('@/lib/firebase-admin', () => ({
  getAdminDb: mocks.getAdminDb,
  getAdminAuth: mocks.getAdminAuth,
}));

vi.mock('next/cache', () => ({
  revalidatePath: mocks.revalidatePath,
}));

describe('dbActions server workflows', () => {
  let state: ReturnType<typeof createAdminDbMock>['state'];
  let adminAuth: {
    revokeRefreshTokens: ReturnType<typeof vi.fn>;
    deleteUser: ReturnType<typeof vi.fn>;
  };

  const approvedUser = {
    uid: 'user-approved',
    email: 'approved@example.com',
    role: 'approved',
    profile: userProfiles.approved,
  };

  const adminUser = {
    uid: 'user-admin',
    email: 'admin@example.com',
    role: 'admin',
    profile: userProfiles.admin,
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-23T08:30:00.000Z'));

    const adminDb = createAdminDbMock({
      users: {
        'user-existing': { uid: 'user-existing', email: 'existing@example.com', name: 'Existing User', role: 'approved' },
        'user-pending': userProfiles.pending,
      },
      members: {
        [families.active.id]: families.active,
        [families.pendingCreation.id]: families.pendingCreation,
        [families.pendingEdit.id]: families.pendingEdit,
      },
      songs: {
        [songs.malayalam.id]: songs.malayalam,
      },
      meetings: {},
      prayer_points: {},
      activity_logs: {},
    });

    state = adminDb.state;
    adminAuth = {
      revokeRefreshTokens: vi.fn(async () => undefined),
      deleteUser: vi.fn(async () => undefined),
    };

    mocks.getAdminDb.mockReturnValue(adminDb.db);
    mocks.getAdminAuth.mockReturnValue(adminAuth);
    mocks.requireUser.mockResolvedValue(approvedUser);
    mocks.requireAdmin.mockResolvedValue(adminUser);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('creates non-admin family submissions as pending and sanitizes undefined values', async () => {
    const { createFamilySubmission } = await import('@/app/actions/dbActions');

    const result = await createFamilySubmission(
      {
        familyName: 'New Family',
        primaryMobile: '9876543210',
        nested: { keep: 'yes', removeMe: undefined },
        members: [{ name: 'New Parent', mobile: undefined, tags: ['Choir'] }],
      },
      'approved-token',
    );

    expect(result).toEqual({ id: 'members-4', success: true });
    expect(state.members['members-4']).toMatchObject({
      familyName: 'New Family',
      primaryMobile: '9876543210',
      nested: { keep: 'yes' },
      members: [{ name: 'New Parent', tags: ['Choir'] }],
      submittedBy: 'Approved Member',
      isPendingCreation: true,
      hasPendingEdit: false,
      draftData: null,
      createdBy: 'user-approved',
      createdAt: '2026-07-23T08:30:00.000Z',
    });
    expect(state.members['members-4'].nested).not.toHaveProperty('removeMe');
    expect(state.members['members-4'].members[0]).not.toHaveProperty('mobile');
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/dashboard');
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/directory');
  });

  it('creates admin family submissions directly in the directory', async () => {
    const { createFamilySubmission } = await import('@/app/actions/dbActions');
    mocks.requireUser.mockResolvedValue(adminUser);

    await createFamilySubmission({ familyName: 'Admin Family', submittedBy: 'Manual Submitter' }, 'admin-token');

    expect(state.members['members-4']).toMatchObject({
      familyName: 'Admin Family',
      submittedBy: 'Manual Submitter',
      isPendingCreation: false,
      createdBy: 'user-admin',
    });
  });

  it('stages non-admin edits into draftData instead of changing published fields', async () => {
    const { updateFamilySubmission } = await import('@/app/actions/dbActions');

    await updateFamilySubmission(families.active.id, { familyName: 'Draft Name', optional: undefined }, false, 'approved-token');

    expect(state.members[families.active.id].familyName).toBe(families.active.familyName);
    expect(state.members[families.active.id]).toMatchObject({
      hasPendingEdit: true,
      draftData: { familyName: 'Draft Name' },
      submittedBy: 'Approved Member',
      lastEdited: '2026-07-23T08:30:00.000Z',
    });
  });

  it('applies admin edits directly and clears pending state', async () => {
    const { updateFamilySubmission } = await import('@/app/actions/dbActions');
    mocks.requireUser.mockResolvedValue(adminUser);

    await updateFamilySubmission(families.pendingEdit.id, { familyName: 'Published Name' }, true, 'admin-token');

    expect(state.members[families.pendingEdit.id]).toMatchObject({
      familyName: 'Published Name',
      hasPendingEdit: false,
      draftData: null,
      lastEdited: '2026-07-23T08:30:00.000Z',
    });
  });

  it('approves and rejects account access with audit logs', async () => {
    const { approveUserAccess, rejectUserAccess } = await import('@/app/actions/dbActions');

    await approveUserAccess('user-pending', 'admin-token');
    await rejectUserAccess('user-rejected', 'Missing membership verification', 'admin-token');

    expect(state.users['user-pending'].role).toBe('approved');
    expect(state.users['user-rejected']).toBeUndefined();
    expect(Object.values(state.activity_logs)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ action: 'Approved User Access', userEmail: 'admin@example.com' }),
        expect.objectContaining({ action: 'Denied User Access', details: 'Missing membership verification' }),
      ]),
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/approvals');
  });

  it('approves and rejects family creation requests with audit logs', async () => {
    const { approveFamilyCreation, rejectFamilyCreation } = await import('@/app/actions/dbActions');

    await approveFamilyCreation(families.pendingCreation.id, 'admin-token');
    await rejectFamilyCreation('family-to-delete', 'admin-token');

    expect(state.members[families.pendingCreation.id].isPendingCreation).toBe(false);
    expect(state.members['family-to-delete']).toBeUndefined();
    expect(Object.values(state.activity_logs)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ action: 'Published Family' }),
        expect.objectContaining({ action: 'Deleted Family Submission' }),
      ]),
    );
  });

  it('merges or discards family edit requests through the approval queue', async () => {
    const { approveFamilyEdit, rejectFamilyEdit } = await import('@/app/actions/dbActions');

    await approveFamilyEdit(families.pendingEdit.id, families.pendingEdit.draftData, 'admin-token');
    await rejectFamilyEdit(families.active.id, 'admin-token');

    expect(state.members[families.pendingEdit.id]).toMatchObject({
      familyName: 'Edited Family Updated',
      status: 'Inactive',
      hasPendingEdit: false,
      draftData: null,
    });
    expect(state.members[families.active.id]).toMatchObject({ hasPendingEdit: false, draftData: null });
    expect(Object.values(state.activity_logs)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ action: 'Merged Edit' }),
        expect.objectContaining({ action: 'Discarded Edit' }),
      ]),
    );
  });

  it('deletes user accounts from Firestore and Firebase Auth', async () => {
    const { deleteUserAccount } = await import('@/app/actions/dbActions');

    await deleteUserAccount('user-pending', 'admin-token');

    expect(state.users['user-pending']).toBeUndefined();
    expect(adminAuth.revokeRefreshTokens).toHaveBeenCalledWith('user-pending');
    expect(adminAuth.deleteUser).toHaveBeenCalledWith('user-pending');
    expect(Object.values(state.activity_logs)).toEqual(
      expect.arrayContaining([expect.objectContaining({ action: 'Revoked User Access' })]),
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/manage-users');
  });

  it('upserts existing and new user profiles without elevating roles', async () => {
    const { upsertUserProfile } = await import('@/app/actions/dbActions');

    mocks.requireUser.mockResolvedValueOnce({
      uid: 'user-existing',
      email: 'existing-token@example.com',
      role: 'approved',
      profile: { name: 'Existing Profile' },
    });
    await upsertUserProfile({ name: 'Updated Existing' }, 'existing-token');

    mocks.requireUser.mockResolvedValueOnce({ uid: 'user-new', email: 'new@example.com', role: 'pending', profile: null });
    await upsertUserProfile({ phone: '+919999999999' }, 'new-token');

    expect(state.users['user-existing']).toMatchObject({
      email: 'existing-token@example.com',
      name: 'Updated Existing',
      role: 'approved',
      updatedAt: '2026-07-23T08:30:00.000Z',
    });
    expect(state.users['user-new']).toMatchObject({
      email: 'new@example.com',
      name: 'new@example.com',
      phone: '+919999999999',
      role: 'pending',
      createdAt: '2026-07-23T08:30:00.000Z',
    });
  });

  it('runs admin-only meeting and prayer mutations', async () => {
    const {
      createMeeting,
      updateMeeting,
      deleteMeeting,
      createPrayerPoint,
      updatePrayerPoint,
      deletePrayerPoint,
    } = await import('@/app/actions/dbActions');

    const meeting = await createMeeting({ title: 'Sunday Worship', time: '10 AM' }, 'admin-token');
    await updateMeeting(meeting.id, { time: '9:30 AM' }, 'admin-token');
    await deleteMeeting(meeting.id, 'admin-token');

    const prayer = await createPrayerPoint({ title: 'Youth Retreat', subpoints: ['Travel'] }, 'admin-token');
    await updatePrayerPoint(prayer.id, { subpoints: ['Travel', 'Teaching'] }, 'admin-token');
    await deletePrayerPoint(prayer.id, 'admin-token');

    expect(state.meetings[meeting.id]).toBeUndefined();
    expect(state.prayer_points[prayer.id]).toBeUndefined();
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/meetings');
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/prayer');
  });

  it('creates songs with the next song number and user provenance', async () => {
    const { createSong } = await import('@/app/actions/dbActions');

    const result = await createSong({ title: 'New Hymn', language: 'English' }, 'approved-token');

    expect(result).toEqual({ id: 'songs-2', success: true });
    expect(state.songs['songs-2']).toMatchObject({
      title: 'New Hymn',
      songNumber: 2,
      authorUid: 'user-approved',
      authorEmail: 'approved@example.com',
      createdAt: '2026-07-23T08:30:00.000Z',
      updatedAt: '2026-07-23T08:30:00.000Z',
    });
  });

  it('updates and deletes songs through admin authorization', async () => {
    const { updateSong, deleteSong } = await import('@/app/actions/dbActions');

    await updateSong(songs.malayalam.id, { title: 'Updated Song' }, 'admin-token');
    await deleteSong(songs.malayalam.id, 'admin-token');

    expect(state.songs[songs.malayalam.id]).toBeUndefined();
    expect(mocks.requireAdmin).toHaveBeenCalledWith('admin-token');
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/songbook');
  });
});
