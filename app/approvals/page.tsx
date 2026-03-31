'use client';
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import { logActivity } from '@/lib/logger';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, XCircle, UserPlus, Edit3, ShieldAlert, Loader2, Search, X, ArrowRight } from 'lucide-react';

// --- NEW: THE DIFF VIEWER COMPONENT ---
// This intelligently compares the live database record with the proposed draft
const DiffViewer = ({ original, draft }: { original: any, draft: any }) => {
  if (!original || !draft) return null;

  const getDifferences = () => {
    const diffs = [];
    
    // 1. Check standard text fields
    const fieldsToTrack = [
      { key: 'familyName', label: 'Primary Member (Family Name)' },
      { key: 'primaryMobile', label: 'Primary Mobile' },
      { key: 'currentAddress', label: 'Current Address' },
      { key: 'nativeAddress', label: 'Native Address' },
      { key: 'homeAssembly', label: 'Home Assembly' },
      { key: 'commendedAssembly', label: 'Commended Assembly' },
      { key: 'notes', label: 'Additional Notes' },
      { key: 'status', label: 'Status' },
    ];

    fieldsToTrack.forEach(({ key, label }) => {
      if (original[key] !== draft[key]) {
        diffs.push({ label, oldVal: original[key], newVal: draft[key] });
      }
    });

    // 2. Check Photo changes
    if (original.photoUrl !== draft.photoUrl) {
      diffs.push({
        label: 'Family Photo',
        oldVal: original.photoUrl ? 'Has Existing Photo' : '(No Photo)',
        newVal: draft.photoUrl ? 'New Photo Uploaded' : '(Photo Removed)'
      });
    }

    // 3. Check Members Array
    const oldMembersStr = JSON.stringify(original.members || []);
    const newMembersStr = JSON.stringify(draft.members || []);
    
    if (oldMembersStr !== newMembersStr) {
      diffs.push({
        label: 'Family Members',
        isComplex: true,
        oldVal: original.members || [],
        newVal: draft.members || []
      });
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
            <div className="space-y-2">
              <div className="bg-red-50 p-2.5 rounded-lg border border-red-100">
                <span className="text-[10px] font-bold text-red-800 uppercase tracking-wider block mb-1.5 opacity-80">Previous Members:</span>
                <ul className="text-sm text-red-700 list-disc list-inside">
                  {change.oldVal.map((m: any, i: number) => (
                    <li key={i}>{m.name} {m.mobile ? `(${m.mobile})` : ''} • {m.bloodGroup || 'No BG'}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-green-50 p-2.5 rounded-lg border border-green-200 shadow-sm">
                <span className="text-[10px] font-bold text-green-800 uppercase tracking-wider block mb-1.5 opacity-80">Proposed Members:</span>
                <ul className="text-sm text-green-800 list-disc list-inside font-medium">
                  {change.newVal.map((m: any, i: number) => (
                    <li key={i}>{m.name} {m.mobile ? `(${m.mobile})` : ''} • {m.bloodGroup || 'No BG'}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-sm">
              <div className="flex-1 bg-red-50 text-red-700 p-2.5 rounded-lg border border-red-100 line-through truncate opacity-70">
                {change.oldVal || '(Blank)'}
              </div>
              <ArrowRight size={16} className="text-slate-300 flex-shrink-0" />
              <div className="flex-1 bg-green-50 text-green-800 font-bold p-2.5 rounded-lg border border-green-200 shadow-sm truncate">
                {change.newVal || '(Blank)'}
              </div>
            </div>
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

  const handleApproveUser = async (u: any) => {
    await updateDoc(doc(db, 'users', u.id), { role: 'approved' });
    await logActivity(userProfile, 'Approved User Access', `Granted directory access to ${u.email}`);
  };

  const handleRejectUser = async (u: any) => {
    if (confirm("Deny access to this email?")) {
      await deleteDoc(doc(db, 'users', u.id));
      await logActivity(userProfile, 'Denied User Access', `Rejected access request for ${u.email}`);
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

      {/* 1. USERS */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center"><ShieldAlert size={20} className="mr-2 text-amber-500" /> Account Access Requests</h2>
        {pendingUsers.length === 0 ? <p className="text-slate-500 text-sm bg-white p-6 rounded-2xl border border-slate-200 text-center">No pending access requests.</p> : (
          <div className="space-y-3">
            {pendingUsers.map(u => (
              <div key={u.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center gap-4">
                <div className="min-w-0 flex-1"><p className="font-bold text-slate-900 truncate">{u.name}</p><p className="text-sm text-slate-500 truncate">{u.email}</p></div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => handleApproveUser(u)} className="p-2 bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100"><CheckCircle size={18} /></button>
                  <button onClick={() => handleRejectUser(u)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><XCircle size={18} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 2. CREATIONS */}
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

      {/* 3. EDITS */}
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

      {/* UNIFIED REVIEW MODAL */}
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

              {/* SMART RENDER: If it's an edit, show the DiffViewer. If it's a new creation, show the standard data block */}
              {reviewItem.type === 'edit' ? (
                <DiffViewer original={reviewItem.data} draft={activeData} />
              ) : (
                <>
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Contact Info</h3>
                    <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 text-sm">
                      <div className="flex border-b border-slate-100 pb-2"><span className="font-bold text-slate-700 w-1/3">Status</span><span className="text-slate-600">{activeData.status || 'Active'}</span></div>
                      <div className="flex border-b border-slate-100 pb-2"><span className="font-bold text-slate-700 w-1/3">Mobile</span><span className="text-slate-600">{activeData.primaryMobile || '-'}</span></div>
                      <div className="flex border-b border-slate-100 pb-2"><span className="font-bold text-slate-700 w-1/3">Current Addr</span><span className="text-slate-600">{activeData.currentAddress || '-'}</span></div>
                      <div className="flex pb-1"><span className="font-bold text-slate-700 w-1/3">Native Addr</span><span className="text-slate-600">{activeData.nativeAddress || '-'}</span></div>
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