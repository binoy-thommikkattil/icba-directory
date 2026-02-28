'use client';
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, XCircle, UserPlus, Edit3, ShieldAlert, Loader2, Search, X } from 'lucide-react';

export default function ApprovalsPage() {
  const { user, role, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [pendingCreations, setPendingCreations] = useState<any[]>([]);
  const [pendingEdits, setPendingEdits] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // NEW: State to hold the specific edit we are currently reviewing
  const [reviewEdit, setReviewEdit] = useState<any | null>(null);

  // Security Check
  useEffect(() => {
    if (!authLoading) {
      if (!user) router.push('/login');
      if (role !== 'admin') router.push('/');
    }
  }, [user, role, authLoading, router]);

  useEffect(() => {
    if (role !== 'admin') return;

    const qUsers = query(collection(db, 'users'), where('role', '==', 'pending'));
    const unUsers = onSnapshot(qUsers, (snap) => setPendingUsers(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

    const qCreations = query(collection(db, 'members'), where('isPendingCreation', '==', true));
    const unCreations = onSnapshot(qCreations, (snap) => setPendingCreations(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

    const qEdits = query(collection(db, 'members'), where('hasPendingEdit', '==', true));
    const unEdits = onSnapshot(qEdits, (snap) => {
      setPendingEdits(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setIsLoading(false);
    });

    return () => { unUsers(); unCreations(); unEdits(); };
  }, [role]);

  // --- ACTIONS: USER ACCESS ---
  const handleApproveUser = async (id: string) => {
    await updateDoc(doc(db, 'users', id), { role: 'approved' });
  };
  const handleRejectUser = async (id: string) => {
    if (confirm("Are you sure you want to deny access to this email?")) {
      await deleteDoc(doc(db, 'users', id));
    }
  };

  // --- ACTIONS: NEW FAMILIES ---
  const handleApproveCreation = async (id: string) => {
    await updateDoc(doc(db, 'members', id), { isPendingCreation: false });
  };
  const handleRejectCreation = async (id: string) => {
    if (confirm("Are you sure you want to delete this new family submission?")) {
      await deleteDoc(doc(db, 'members', id));
    }
  };

  // --- ACTIONS: PROFILE EDITS ---
  const handleApproveEdit = async (member: any) => {
    if (!member.draftData) return;
    await updateDoc(doc(db, 'members', member.id), {
      ...member.draftData,
      hasPendingEdit: false,
      draftData: null
    });
    setReviewEdit(null); // Close modal on success
  };
  const handleRejectEdit = async (id: string) => {
    if (confirm("Are you sure you want to discard these proposed changes?")) {
      await updateDoc(doc(db, 'members', id), { hasPendingEdit: false, draftData: null });
      setReviewEdit(null); // Close modal on success
    }
  };

  if (authLoading || isLoading) return <div className="flex min-h-screen items-center justify-center font-bold text-slate-500"><Loader2 className="animate-spin mr-2" /> Loading dashboard...</div>;

  return (
    <div className="p-6 bg-slate-50 min-h-screen pb-24 relative">
      <Link href="/" className="mb-6 inline-flex items-center text-sm font-bold text-slate-500 hover:text-slate-800 transition">
        <ArrowLeft size={16} className="mr-1" /> Back to Dashboard
      </Link>
      
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-slate-900 mb-2">Admin Approvals</h1>
        <p className="text-slate-500 text-sm">Review access requests and directory updates.</p>
      </div>

      {/* SECTION 1: USER ACCOUNT ACCESS */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
          <ShieldAlert size={20} className="mr-2 text-amber-500" /> Account Access Requests
        </h2>
        {pendingUsers.length === 0 ? (
          <p className="text-slate-500 text-sm bg-white p-6 rounded-2xl border border-slate-200 text-center">No pending access requests.</p>
        ) : (
          <div className="space-y-3">
            {pendingUsers.map(u => (
              <div key={u.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap sm:flex-nowrap justify-between items-center gap-4">
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900 truncate">{u.name}</p>
                  <p className="text-sm text-slate-500 truncate">{u.email}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => handleApproveUser(u.id)} className="flex items-center justify-center bg-teal-50 text-teal-700 px-3 py-2 rounded-lg text-sm font-bold hover:bg-teal-100 transition border border-teal-200">
                    <CheckCircle size={16} className="mr-1 sm:mr-0 lg:mr-1" /> <span className="hidden sm:inline">Approve</span>
                  </button>
                  <button onClick={() => handleRejectUser(u.id)} className="flex items-center justify-center bg-red-50 text-red-600 px-3 py-2 rounded-lg text-sm font-bold hover:bg-red-100 transition border border-red-200">
                    <XCircle size={16} className="mr-1 sm:mr-0 lg:mr-1" /> <span className="hidden sm:inline">Deny</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SECTION 2: NEW FAMILY CREATIONS */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
          <UserPlus size={20} className="mr-2 text-blue-500" /> New Family Submissions
        </h2>
        {pendingCreations.length === 0 ? (
          <p className="text-slate-500 text-sm bg-white p-6 rounded-2xl border border-slate-200 text-center">No new families pending.</p>
        ) : (
          <div className="space-y-3">
            {pendingCreations.map(family => (
              <div key={family.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap sm:flex-nowrap justify-between items-center gap-4">
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900 truncate">{family.familyName} Family</p>
                  <p className="text-sm text-slate-500 truncate">{family.members?.length || 0} members listed</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => handleApproveCreation(family.id)} className="flex items-center justify-center bg-teal-50 text-teal-700 px-3 py-2 rounded-lg text-sm font-bold hover:bg-teal-100 transition border border-teal-200">
                    <CheckCircle size={16} className="mr-1 sm:mr-0 lg:mr-1" /> <span className="hidden sm:inline">Publish</span>
                  </button>
                  <button onClick={() => handleRejectCreation(family.id)} className="flex items-center justify-center bg-red-50 text-red-600 px-3 py-2 rounded-lg text-sm font-bold hover:bg-red-100 transition border border-red-200">
                    <XCircle size={16} className="mr-1 sm:mr-0 lg:mr-1" /> <span className="hidden sm:inline">Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SECTION 3: FAMILY EDITS (NOW WITH REVIEW BUTTON) */}
      <section>
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
          <Edit3 size={20} className="mr-2 text-purple-500" /> Directory Edit Requests
        </h2>
        {pendingEdits.length === 0 ? (
          <p className="text-slate-500 text-sm bg-white p-6 rounded-2xl border border-slate-200 text-center">No pending edits.</p>
        ) : (
          <div className="space-y-3">
            {pendingEdits.map(family => (
              <div key={family.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center gap-4">
                {/* min-w-0 prevents text from pushing buttons off screen */}
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900 truncate">{family.familyName} Family</p>
                  <p className="text-sm text-slate-500 truncate">Proposed updates waiting for review.</p>
                </div>
                {/* shrink-0 keeps the button perfectly sized */}
                <div className="shrink-0">
                  <button onClick={() => setReviewEdit(family)} className="flex items-center justify-center bg-indigo-50 text-indigo-700 px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-indigo-100 transition border border-indigo-200">
                    <Search size={16} className="mr-1.5" /> Review
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* --- REVIEW MODAL --- */}
      {reviewEdit && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white">
              <h2 className="font-serif font-bold text-xl text-slate-900">Review: {reviewEdit.familyName} Family</h2>
              <button onClick={() => setReviewEdit(null)} className="p-2 text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-full transition">
                <X size={20} />
              </button>
            </div>

            {/* Modal Content - Displaying the Draft Data */}
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50 space-y-6">
              <div className="bg-indigo-50 text-indigo-800 p-3 rounded-xl border border-indigo-100 text-sm font-medium flex items-center">
                <ShieldAlert size={18} className="mr-2 shrink-0" />
                You are viewing the proposed new details submitted by: {reviewEdit.draftData?.submittedBy || 'Member'}
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Proposed Contact Info</h3>
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 text-sm">
                  <div className="flex flex-col sm:flex-row sm:gap-4 border-b border-slate-100 pb-2">
                    <span className="font-bold text-slate-700 sm:w-1/3">Status</span>
                    <span className="text-slate-600">{reviewEdit.draftData?.status || 'Active'}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:gap-4 border-b border-slate-100 pb-2">
                    <span className="font-bold text-slate-700 sm:w-1/3">Primary Mobile</span>
                    <span className="text-slate-600">{reviewEdit.draftData?.primaryMobile || '-'}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:gap-4 border-b border-slate-100 pb-2">
                    <span className="font-bold text-slate-700 sm:w-1/3">Current Address</span>
                    <span className="text-slate-600">{reviewEdit.draftData?.currentAddress || '-'}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:gap-4 pb-1">
                    <span className="font-bold text-slate-700 sm:w-1/3">Native Address</span>
                    <span className="text-slate-600">{reviewEdit.draftData?.nativeAddress || '-'}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Proposed Members</h3>
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 text-sm">
                  {reviewEdit.draftData?.members?.map((m: any, i: number) => (
                    <div key={i} className="pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                      <p className="font-bold text-slate-800 text-base">{m.name}</p>
                      <p className="text-slate-500 mt-0.5">
                        {m.relationship || 'No relation'} • Blood: {m.bloodGroup || 'N/A'} {m.willingToDonate && '(Donor)'}
                      </p>
                      {m.tags && m.tags.length > 0 && (
                        <p className="text-slate-400 text-xs mt-1">Tags: {m.tags.join(', ')}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer / Action Buttons */}
            <div className="p-5 border-t border-slate-200 flex gap-3 bg-white">
              <button onClick={() => handleRejectEdit(reviewEdit.id)} className="flex-1 py-3 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition border border-red-100">
                Discard Changes
              </button>
              <button onClick={() => handleApproveEdit(reviewEdit)} className="flex-[2] py-3 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 transition shadow-sm">
                Approve & Merge Update
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}