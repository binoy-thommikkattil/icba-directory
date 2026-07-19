'use client';
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import { logActivity } from '@/lib/logger';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
// ADDED Phone and Mail icons
import { ArrowLeft, CheckCircle, XCircle, UserPlus, Edit3, ShieldAlert, Loader2, Search, X, ArrowRight, MapPin, Phone, Mail } from 'lucide-react';

// --- THE DIFF VIEWER COMPONENT ---
const DiffViewer = ({ original, draft }: { original: any, draft: any }) => {
  if (!original || !draft) return null;

  const normalizeForComparison = (value: any) => {
    if (Array.isArray(value)) {
      return JSON.stringify(
        value
          .filter((item) => item !== null && item !== undefined && item !== '')
          .map((item) => String(item).trim())
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b))
      );
    }

    if (value && typeof value === 'object') {
      return JSON.stringify(value);
    }

    return value == null ? '' : String(value);
  };

  const hasValueChanged = (oldValue: any, newValue: any) => normalizeForComparison(oldValue) !== normalizeForComparison(newValue);

  const getTagDiff = (oldTags: any, newTags: any) => {
    const normalizeTagList = (value: any) =>
      (Array.isArray(value) ? value : [])
        .filter((tag) => tag !== null && tag !== undefined && tag !== '')
        .map((tag) => String(tag).trim())
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b));

    const oldList = normalizeTagList(oldTags);
    const newList = normalizeTagList(newTags);

    return {
      oldList,
      newList,
      removed: oldList.filter((tag) => !newList.includes(tag)),
      added: newList.filter((tag) => !oldList.includes(tag)),
      common: oldList.filter((tag) => newList.includes(tag)),
    };
  };

  const formatDisplayValue = (value: any) => {
    if (value === null || value === undefined || value === '') return '(Blank)';
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return String(value);
  };

  const renderValueRow = (oldValue: any, newValue: any) => (
    <div className="flex items-start gap-2 text-sm">
      <div className="flex-1 rounded-lg border border-red-100 bg-red-50 px-2.5 py-2 text-red-700 break-words">
        {formatDisplayValue(oldValue)}
      </div>
      <ArrowRight size={16} className="mt-2 text-slate-300 flex-shrink-0" />
      <div className="flex-1 rounded-lg border border-green-200 bg-green-50 px-2.5 py-2 text-green-800 font-semibold break-words">
        {formatDisplayValue(newValue)}
      </div>
    </div>
  );

  const getDifferences = () => {
    const diffs: any[] = [];

    // 1. Check standard text fields (ADDED MAP ADDRESSES)
    const fieldsToTrack = [
      { key: 'familyName', label: 'Primary Member (Family Name)' },
      { key: 'primaryMobile', label: 'Primary Mobile' },
      { key: 'currentAddress', label: 'Current Address' },
      { key: 'currentMapAddress', label: 'Current Map Address' },
      { key: 'nativeAddress', label: 'Native Address' },
      { key: 'nativeMapAddress', label: 'Native Map Address' },
      { key: 'homeAssembly', label: 'Home Assembly' },
      { key: 'commendedAssembly', label: 'Commended Assembly' },
      { key: 'notes', label: 'Additional Notes' },
      { key: 'status', label: 'Status' },
    ];

    fieldsToTrack.forEach(({ key, label }) => {
      if (hasValueChanged(original[key], draft[key])) {
        diffs.push({ label, oldVal: original[key], newVal: draft[key] });
      }
    });

    // 2. Check exact GPS Coordinate changes
    const oldCurrentLat = original.currentLat || original.currentCoordinates?.lat;
    const oldCurrentLng = original.currentLng || original.currentCoordinates?.lng;
    const newCurrentLat = draft.currentLat || draft.currentCoordinates?.lat;
    const newCurrentLng = draft.currentLng || draft.currentCoordinates?.lng;

    if (oldCurrentLat !== newCurrentLat || oldCurrentLng !== newCurrentLng) {
      diffs.push({
        label: 'Current GPS Coordinates',
        oldVal: oldCurrentLat ? `${oldCurrentLat.toFixed(4)}, ${oldCurrentLng.toFixed(4)}` : '(No Pin Set)',
        newVal: newCurrentLat ? `${newCurrentLat.toFixed(4)}, ${newCurrentLng.toFixed(4)}` : '(Pin Removed)'
      });
    }

    const oldNativeLat = original.nativeLat || original.nativeCoordinates?.lat;
    const oldNativeLng = original.nativeLng || original.nativeCoordinates?.lng;
    const newNativeLat = draft.nativeLat || draft.nativeCoordinates?.lat;
    const newNativeLng = draft.nativeLng || draft.nativeCoordinates?.lng;

    if (oldNativeLat !== newNativeLat || oldNativeLng !== newNativeLng) {
      diffs.push({
        label: 'Native GPS Coordinates',
        oldVal: oldNativeLat ? `${oldNativeLat.toFixed(4)}, ${oldNativeLng.toFixed(4)}` : '(No Pin Set)',
        newVal: newNativeLat ? `${newNativeLat.toFixed(4)}, ${newNativeLng.toFixed(4)}` : '(Pin Removed)'
      });
    }

    // 3. Check Photo changes
    if (hasValueChanged(original.photoUrl, draft.photoUrl)) {
      diffs.push({
        label: 'Family Photo',
        oldVal: original.photoUrl ? 'Has Existing Photo' : '(No Photo)',
        newVal: draft.photoUrl ? 'New Photo Uploaded' : '(Photo Removed)'
      });
    }

    // 4. Check Members Array and surface only changed member cards
    const originalMembers = Array.isArray(original.members) ? original.members : [];
    const draftMembers = Array.isArray(draft.members) ? draft.members : [];

    if (hasValueChanged(originalMembers, draftMembers)) {
      const memberDiffs: any[] = [];
      const maxLength = Math.max(originalMembers.length, draftMembers.length);

      for (let index = 0; index < maxLength; index += 1) {
        const oldMember = originalMembers[index];
        const newMember = draftMembers[index];
        const fieldDiffs: any[] = [];

        const trackedFields = [
          { key: 'name', label: 'Name' },
          { key: 'mobile', label: 'Mobile' },
          { key: 'bloodGroup', label: 'Blood Group' },
          { key: 'willingToDonate', label: 'Willing to Donate' },
          { key: 'relationship', label: 'Relationship' },
          { key: 'tags', label: 'Tags / Roles', isArray: true },
        ];

        trackedFields.forEach(({ key, label, isArray }) => {
          const oldValue = oldMember?.[key];
          const newValue = newMember?.[key];

          if (isArray) {
            const tagDiff = getTagDiff(oldValue, newValue);
            if (tagDiff.added.length > 0 || tagDiff.removed.length > 0) {
              fieldDiffs.push({
                label,
                kind: 'array',
                oldVal: tagDiff.removed,
                newVal: tagDiff.added,
                common: tagDiff.common,
              });
            }
            return;
          }

          if (hasValueChanged(oldValue, newValue)) {
            fieldDiffs.push({ label, kind: 'simple', oldVal: oldValue, newVal: newValue });
          }
        });

        if (fieldDiffs.length > 0) {
          memberDiffs.push({
            index,
            name: newMember?.name || oldMember?.name || `Member ${index + 1}`,
            changes: fieldDiffs,
          });
        }
      }

      if (memberDiffs.length > 0) {
        diffs.push({
          label: 'Family Members',
          isComplex: true,
          members: memberDiffs,
        });
      }
    }

    return diffs;
  };

  const changes = getDifferences();

  if (changes.length === 0) {
    return <p className="text-sm text-slate-500 italic p-4 bg-slate-50 rounded-lg border border-slate-200">No changes detected. The user may have clicked save without editing anything.</p>;
  }

  return (
    <div className="space-y-4 mt-2">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Proposed Changes</h3>
      {changes.map((change, idx) => (
        <div key={idx} className="p-3 border border-slate-200 rounded-xl bg-white shadow-sm">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">{change.label}</p>

          {change.isComplex ? (
            <div className="space-y-3">
              {change.members.map((member: any, memberIdx: number) => (
                <div key={`${member.name}-${memberIdx}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-800">{member.name}</p>
                    <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500 border border-slate-200">
                      Member {member.index + 1}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {member.changes.map((fieldChange: any) => (
                      <div key={fieldChange.label} className="rounded-lg border border-slate-200 bg-white p-2.5">
                        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">{fieldChange.label}</p>
                        {fieldChange.kind === 'array' ? (
                          <div className="grid gap-2 md:grid-cols-2">
                            <div className="rounded-lg border border-red-100 bg-red-50 p-2.5">
                              <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-red-700/80">Removed</p>
                              <div className="flex flex-wrap gap-1">
                                {fieldChange.oldVal.length > 0 ? fieldChange.oldVal.map((tag: string) => (
                                  <span key={tag} className="rounded-full border border-red-200 bg-white px-2 py-0.5 text-[11px] text-red-700">
                                    {tag}
                                  </span>
                                )) : <span className="text-[11px] text-slate-500">No tags removed</span>}
                              </div>
                            </div>
                            <div className="rounded-lg border border-green-200 bg-green-50 p-2.5">
                              <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-green-700/80">Added</p>
                              <div className="flex flex-wrap gap-1">
                                {fieldChange.newVal.length > 0 ? fieldChange.newVal.map((tag: string) => (
                                  <span key={tag} className="rounded-full border border-green-200 bg-white px-2 py-0.5 text-[11px] text-green-700">
                                    {tag}
                                  </span>
                                )) : <span className="text-[11px] text-slate-500">No new tags</span>}
                              </div>
                            </div>
                          </div>
                        ) : (
                          renderValueRow(fieldChange.oldVal, fieldChange.newVal)
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            renderValueRow(change.oldVal, change.newVal)
          )}
        </div>
      ))}
    </div>
  );
};

export default function ApprovalsPage() {
  const { user, role, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [pendingCreations, setPendingCreations] = useState<any[]>([]);
  const [pendingEdits, setPendingEdits] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [reviewItem, setReviewItem] = useState<{ type: 'edit' | 'creation', data: any } | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!user) router.push('/login');
      if (role !== 'admin') router.push('/dashboard');
    }
  }, [user, role, authLoading, router]);

  useEffect(() => {
    if (role !== 'admin') return;
    const unUsers = onSnapshot(query(collection(db, 'users'), where('role', '==', 'pending')), (snap) => setPendingUsers(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unCreations = onSnapshot(query(collection(db, 'members'), where('isPendingCreation', '==', true)), (snap) => setPendingCreations(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unEdits = onSnapshot(query(collection(db, 'members'), where('hasPendingEdit', '==', true)), (snap) => {
      setPendingEdits(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setIsLoading(false);
    });
    return () => { unUsers(); unCreations(); unEdits(); };
  }, [role]);

  // UPDATED: Logs correct contact info instead of just "u.email"
  const handleApproveUser = async (u: any) => {
    await updateDoc(doc(db, 'users', u.id), { role: 'approved' });
    await logActivity(userProfile, 'Approved User Access', `Granted directory access to ${u.phone || u.email || u.name}`);
  };

  // UPDATED: More generic alert and logs correct info
  const handleRejectUser = async (u: any) => {
    if (confirm("Deny access to this user?")) {
      await deleteDoc(doc(db, 'users', u.id));
      await logActivity(userProfile, 'Denied User Access', `Rejected access request for ${u.phone || u.email || u.name}`);
    }
  };

  const handleApproveCreation = async (family: any) => {
    await updateDoc(doc(db, 'members', family.id), { isPendingCreation: false });
    await logActivity(userProfile, 'Published Family', `Approved new profile for ${family.familyName}`);
    setReviewItem(null);
  };

  const handleRejectCreation = async (family: any) => {
    if (confirm("Delete this new family submission completely?")) {
      await deleteDoc(doc(db, 'members', family.id));
      await logActivity(userProfile, 'Deleted Family Submission', `Discarded new profile submission for ${family.familyName}`);
      setReviewItem(null);
    }
  };

  const handleApproveEdit = async (family: any) => {
    if (!family.draftData) return;
    await updateDoc(doc(db, 'members', family.id), { ...family.draftData, hasPendingEdit: false, draftData: null });
    await logActivity(userProfile, 'Merged Edit', `Approved profile updates for ${family.familyName}`);
    setReviewItem(null);
  };

  const handleRejectEdit = async (family: any) => {
    if (confirm("Discard these proposed changes?")) {
      await updateDoc(doc(db, 'members', family.id), { hasPendingEdit: false, draftData: null });
      await logActivity(userProfile, 'Discarded Edit', `Rejected profile updates for ${family.familyName}`);
      setReviewItem(null);
    }
  };

  if (authLoading || isLoading) return <div className="flex min-h-screen items-center justify-center font-bold text-slate-500"><Loader2 className="animate-spin mr-2" /> Loading...</div>;

  const activeData = reviewItem?.type === 'edit' ? reviewItem.data.draftData : reviewItem?.data;

  return (
    <div className="p-6 bg-slate-50 min-h-screen pb-24 relative">
      <Link href="/dashboard" className="mb-6 inline-flex items-center text-sm font-bold text-slate-500 hover:text-slate-800 transition">
        <ArrowLeft size={16} className="mr-1" /> Back to Dashboard
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-slate-900 mb-2">Admin Approvals</h1>
        <p className="text-slate-500 text-sm">Review access requests and directory updates.</p>
      </div>

      <section className="mb-10">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center"><ShieldAlert size={20} className="mr-2 text-amber-500" /> Account Access Requests</h2>
        {pendingUsers.length === 0 ? <p className="text-slate-500 text-sm bg-white p-6 rounded-2xl border border-slate-200 text-center">No pending access requests.</p> : (
          <div className="space-y-3">
            {pendingUsers.map(u => (
              <div key={u.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center gap-4">
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900 truncate">{u.name || 'Unknown Name'}</p>
                  
                  {/* UPDATED UI: Intelligently shows Phone or Mail with Icon */}
                  <div className="text-xs text-slate-500 mt-1">
                    {u.phone ? (
                      <span className="flex items-center"><Phone size={12} className="mr-1.5" /> {u.phone}</span>
                    ) : u.email ? (
                      <span className="flex items-center"><Mail size={12} className="mr-1.5" /> {u.email}</span>
                    ) : (
                      <span className="italic">No contact info</span>
                    )}
                  </div>

                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => handleApproveUser(u)} className="p-2 bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100"><CheckCircle size={18} /></button>
                  <button onClick={() => handleRejectUser(u)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><XCircle size={18} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center"><UserPlus size={20} className="mr-2 text-blue-500" /> New Family Submissions</h2>
        {pendingCreations.length === 0 ? <p className="text-slate-500 text-sm bg-white p-6 rounded-2xl border border-slate-200 text-center">No new families pending.</p> : (
          <div className="space-y-3">
            {pendingCreations.map(family => (
              <div key={family.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center gap-4">
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900 truncate">{family.familyName}</p>
                  <p className="text-sm text-slate-500 truncate">{family.members?.length || 0} members listed</p>
                </div>
                <button onClick={() => setReviewItem({ type: 'creation', data: family })} className="shrink-0 flex items-center justify-center bg-blue-50 text-blue-700 px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-blue-100 border border-blue-200">
                  <Search size={16} className="mr-1.5" /> Review
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center"><Edit3 size={20} className="mr-2 text-purple-500" /> Directory Edit Requests</h2>
        {pendingEdits.length === 0 ? <p className="text-slate-500 text-sm bg-white p-6 rounded-2xl border border-slate-200 text-center">No pending edits.</p> : (
          <div className="space-y-3">
            {pendingEdits.map(family => (
              <div key={family.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center gap-4">
                <div className="min-w-0 flex-1"><p className="font-bold text-slate-900 truncate">{family.familyName}</p><p className="text-sm text-slate-500 truncate">Proposed updates waiting for review.</p></div>
                <button onClick={() => setReviewItem({ type: 'edit', data: family })} className="shrink-0 flex items-center justify-center bg-indigo-50 text-indigo-700 px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-indigo-100 border border-indigo-200">
                  <Search size={16} className="mr-1.5" /> Review
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {reviewItem && activeData && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white">
              <h2 className="font-serif font-bold text-xl text-slate-900">
                {reviewItem.type === 'edit' ? 'Review Edit Request' : 'Review New Family'}
              </h2>
              <button onClick={() => setReviewItem(null)} className="p-2 text-slate-400 hover:text-slate-700 bg-slate-50 rounded-full"><X size={20} /></button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-slate-50 space-y-6">

              <div className="bg-white text-slate-700 p-4 rounded-xl border border-slate-200 text-sm font-medium flex items-center shadow-sm">
                <ShieldAlert size={18} className="mr-3 shrink-0 text-slate-400" />
                <span><span className="text-slate-500">Submitted by:</span> <strong className="text-slate-900">{activeData.submittedBy || 'Unknown Member'}</strong></span>
              </div>

              {reviewItem.type === 'edit' ? (
                <DiffViewer original={reviewItem.data} draft={activeData} />
              ) : (
                <>
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Contact Info</h3>
                    <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 text-sm">
                      <div className="flex border-b border-slate-100 pb-2"><span className="font-bold text-slate-700 w-1/3">Status</span><span className="text-slate-600">{activeData.status || 'Active'}</span></div>
                      <div className="flex border-b border-slate-100 pb-2"><span className="font-bold text-slate-700 w-1/3">Mobile</span><span className="text-slate-600">{activeData.primaryMobile || '-'}</span></div>

                      {/* Combines Manual Address + Map Address and checks for Lat/Lng */}
                      <div className="flex border-b border-slate-100 pb-2">
                        <span className="font-bold text-slate-700 w-1/3">Current Addr</span>
                        <span className="text-slate-600">
                          {[activeData.currentAddress, activeData.currentMapAddress].filter(Boolean).join(', ') || '-'}
                          {(activeData.currentLat || activeData.currentCoordinates) && <span className="text-teal-600 text-[10px] uppercase font-bold ml-2 block mt-0.5"><MapPin size={10} className="inline mr-1" /> GPS Pin Set</span>}
                        </span>
                      </div>
                      <div className="flex pb-1">
                        <span className="font-bold text-slate-700 w-1/3">Native Addr</span>
                        <span className="text-slate-600">
                          {[activeData.nativeAddress, activeData.nativeMapAddress].filter(Boolean).join(', ') || '-'}
                          {(activeData.nativeLat || activeData.nativeCoordinates) && <span className="text-teal-600 text-[10px] uppercase font-bold ml-2 block mt-0.5"><MapPin size={10} className="inline mr-1" /> GPS Pin Set</span>}
                        </span>
                      </div>

                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Members</h3>
                    <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 text-sm">
                      {activeData.members?.map((m: any, i: number) => (
                        <div key={i} className="pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                          <p className="font-bold text-slate-800 text-base">{m.name} {i === 0 && <span className="text-[10px] bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full ml-2 uppercase align-middle">Primary</span>}</p>
                          <p className="text-slate-500 mt-1">Mobile: {m.mobile || 'N/A'} • Blood: {m.bloodGroup || 'N/A'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="p-5 border-t border-slate-200 flex gap-3 bg-white">
              <button onClick={() => reviewItem.type === 'edit' ? handleRejectEdit(reviewItem.data) : handleRejectCreation(reviewItem.data)} className="flex-1 py-3 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition border border-red-100">
                {reviewItem.type === 'edit' ? 'Discard Changes' : 'Delete Submission'}
              </button>
              <button onClick={() => reviewItem.type === 'edit' ? handleApproveEdit(reviewItem.data) : handleApproveCreation(reviewItem.data)} className="flex-[2] py-3 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 transition shadow-sm">
                {reviewItem.type === 'edit' ? 'Approve & Merge' : 'Approve & Publish'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}