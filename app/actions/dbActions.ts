'use server';

import { revalidatePath } from 'next/cache';
import { getAdminDb } from '@/lib/firebase-admin';
import { requireAdmin, requireUser } from '@/lib/auth-session';

const getDb = () => getAdminDb();

export async function createFamilySubmission(payload: any) {
  const user = await requireUser();
  const memberPayload = {
    ...payload,
    submittedBy: payload.submittedBy || user.profile?.name || user.email || 'Unknown User',
    isPendingCreation: user.role !== 'admin',
    hasPendingEdit: false,
    draftData: null,
    createdAt: new Date().toISOString(),
    createdBy: user.uid,
  };

  const docRef = await getDb().collection('members').add(memberPayload);
  revalidatePath('/dashboard');
  revalidatePath('/directory');
  return { id: docRef.id, success: true };
}

export async function updateFamilySubmission(familyId: string, formData: any, isAdmin: boolean) {
  const user = await requireUser();
  if (!isAdmin) {
    await getDb().collection('members').doc(familyId).update({
      hasPendingEdit: true,
      draftData: formData,
      lastEdited: new Date().toISOString(),
      submittedBy: formData.submittedBy || user.profile?.name || user.email || 'Unknown User',
    });
  } else {
    await getDb().collection('members').doc(familyId).update({
      ...formData,
      hasPendingEdit: false,
      draftData: null,
      lastEdited: new Date().toISOString(),
    });
  }

  revalidatePath('/directory');
  revalidatePath('/dashboard');
  return { success: true };
}

export async function approveUserAccess(userId: string) {
  const admin = await requireAdmin();
  await getDb().collection('users').doc(userId).update({ role: 'approved' });
  await getDb().collection('activity_logs').add({
    userName: admin.profile?.name || admin.email || 'Admin',
    userEmail: admin.email || 'No Email',
    action: 'Approved User Access',
    details: `Granted directory access to user ${userId}`,
    timestamp: new Date().toISOString(),
  });
  revalidatePath('/approvals');
  return { success: true };
}

export async function rejectUserAccess(userId: string, reason?: string) {
  const admin = await requireAdmin();
  await getDb().collection('users').doc(userId).delete();
  await getDb().collection('activity_logs').add({
    userName: admin.profile?.name || admin.email || 'Admin',
    userEmail: admin.email || 'No Email',
    action: 'Denied User Access',
    details: reason || 'Rejected access request',
    timestamp: new Date().toISOString(),
  });
  revalidatePath('/approvals');
  return { success: true };
}

export async function approveFamilyCreation(familyId: string) {
  const admin = await requireAdmin();
  await getDb().collection('members').doc(familyId).update({ isPendingCreation: false });
  await getDb().collection('activity_logs').add({
    userName: admin.profile?.name || admin.email || 'Admin',
    userEmail: admin.email || 'No Email',
    action: 'Published Family',
    details: `Approved new profile for ${familyId}`,
    timestamp: new Date().toISOString(),
  });
  revalidatePath('/approvals');
  return { success: true };
}

export async function rejectFamilyCreation(familyId: string) {
  const admin = await requireAdmin();
  await getDb().collection('members').doc(familyId).delete();
  await getDb().collection('activity_logs').add({
    userName: admin.profile?.name || admin.email || 'Admin',
    userEmail: admin.email || 'No Email',
    action: 'Deleted Family Submission',
    details: `Discarded new profile submission for ${familyId}`,
    timestamp: new Date().toISOString(),
  });
  revalidatePath('/approvals');
  return { success: true };
}

export async function approveFamilyEdit(familyId: string, draftData: any) {
  const admin = await requireAdmin();
  await getDb().collection('members').doc(familyId).update({
    ...draftData,
    hasPendingEdit: false,
    draftData: null,
    lastEdited: new Date().toISOString(),
  });
  await getDb().collection('activity_logs').add({
    userName: admin.profile?.name || admin.email || 'Admin',
    userEmail: admin.email || 'No Email',
    action: 'Merged Edit',
    details: `Approved profile updates for ${familyId}`,
    timestamp: new Date().toISOString(),
  });
  revalidatePath('/approvals');
  return { success: true };
}

export async function rejectFamilyEdit(familyId: string) {
  const admin = await requireAdmin();
  await getDb().collection('members').doc(familyId).update({ hasPendingEdit: false, draftData: null });
  await getDb().collection('activity_logs').add({
    userName: admin.profile?.name || admin.email || 'Admin',
    userEmail: admin.email || 'No Email',
    action: 'Discarded Edit',
    details: `Rejected profile updates for ${familyId}`,
    timestamp: new Date().toISOString(),
  });
  revalidatePath('/approvals');
  return { success: true };
}

export async function deleteUserAccount(userId: string) {
  const admin = await requireAdmin();
  await getDb().collection('users').doc(userId).delete();
  await getDb().collection('activity_logs').add({
    userName: admin.profile?.name || admin.email || 'Admin',
    userEmail: admin.email || 'No Email',
    action: 'Revoked User Access',
    details: `Deleted account for ${userId}`,
    timestamp: new Date().toISOString(),
  });
  revalidatePath('/manage-users');
  return { success: true };
}

export async function upsertUserProfile(profile: { name?: string; email?: string; phone?: string }) {
  const user = await requireUser();
  const userRef = getDb().collection('users').doc(user.uid);
  const existing = await userRef.get();

  const nextProfile = {
    uid: user.uid,
    email: profile.email || user.email || existing.data()?.email || '',
    name: profile.name || existing.data()?.name || user.profile?.name || user.email || 'Unknown User',
    phone: profile.phone || existing.data()?.phone || '',
    role: existing.data()?.role || 'pending',
    updatedAt: new Date().toISOString(),
    ...(existing.exists ? {} : { createdAt: new Date().toISOString() }),
  };

  await userRef.set(nextProfile, { merge: true });
  revalidatePath('/dashboard');
  return { success: true };
}

export async function createMeeting(payload: any) {
  const admin = await requireAdmin();
  const docRef = await getDb().collection('meetings').add({
    ...payload,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: admin.uid,
  });
  revalidatePath('/meetings');
  return { id: docRef.id, success: true };
}

export async function updateMeeting(meetingId: string, payload: any) {
  const admin = await requireAdmin();
  await getDb().collection('meetings').doc(meetingId).update({
    ...payload,
    updatedAt: new Date().toISOString(),
    updatedBy: admin.uid,
  });
  revalidatePath('/meetings');
  return { success: true };
}

export async function deleteMeeting(meetingId: string) {
  const admin = await requireAdmin();
  await getDb().collection('meetings').doc(meetingId).delete();
  revalidatePath('/meetings');
  return { success: true };
}

export async function createPrayerPoint(payload: any) {
  const admin = await requireAdmin();
  const docRef = await getDb().collection('prayer_points').add({
    ...payload,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: admin.uid,
  });
  revalidatePath('/prayer');
  return { id: docRef.id, success: true };
}

export async function updatePrayerPoint(prayerId: string, payload: any) {
  const admin = await requireAdmin();
  await getDb().collection('prayer_points').doc(prayerId).update({
    ...payload,
    updatedAt: new Date().toISOString(),
    updatedBy: admin.uid,
  });
  revalidatePath('/prayer');
  return { success: true };
}

export async function deletePrayerPoint(prayerId: string) {
  const admin = await requireAdmin();
  await getDb().collection('prayer_points').doc(prayerId).delete();
  revalidatePath('/prayer');
  return { success: true };
}

export async function createSong(payload: any) {
  const user = await requireUser();
  const songsRef = getDb().collection('songs');
  const latestSnap = await songsRef.orderBy('songNumber', 'desc').limit(1).get();
  const nextSongNumber = latestSnap.empty ? 1 : (latestSnap.docs[0].data().songNumber || 0) + 1;

  const docRef = await songsRef.add({
    ...payload,
    songNumber: nextSongNumber,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    authorUid: user.uid,
    authorEmail: user.email || payload.authorEmail || '',
  });
  revalidatePath('/songbook');
  return { id: docRef.id, success: true };
}

export async function updateSong(songId: string, payload: any) {
  const user = await requireUser();
  await getDb().collection('songs').doc(songId).update({
    ...payload,
    updatedAt: new Date().toISOString(),
    updatedBy: user.uid,
  });
  revalidatePath('/songbook');
  return { success: true };
}

export async function deleteSong(songId: string) {
  const admin = await requireAdmin();
  await getDb().collection('songs').doc(songId).delete();
  revalidatePath('/songbook');
  return { success: true };
}
