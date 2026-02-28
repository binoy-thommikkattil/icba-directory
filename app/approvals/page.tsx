'use client';
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, XCircle, UserPlus, Edit3, ShieldAlert, Loader2 } from 'lucide-react';

export default function ApprovalsPage() {
  const { user, role, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [pendingCreations, setPendingCreations] = useState<any[]>([]);
  const [pendingEdits, setPendingEdits] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Security Check: Only admins can view this page
  useEffect(() => {
    if (!authLoading) {
      if (!user) router.push('/login');
      if (role !== 'admin') router.push('/');
    }
  }, [user, role, authLoading, router]);

  useEffect(() => {
    if (role !== 'admin') return;

    // 1. Listen for Pending User Accounts
    const qUsers = query(collection(db, 'users'), where('role', '==', 'pending'));
    const unUsers = onSnapshot(qUsers, (snap) => setPendingUsers(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

    // 2. Listen for Brand New Family Profiles
    const qCreations = query(collection(db, 'members'), where('isPendingCreation', '==', true));
    const unCreations = onSnapshot(qCreations, (snap) => setPendingCreations(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

    // 3. Listen for Edits to Existing Profiles
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
    // Overwrite the live data with the draft data, and clear the pending flags
    await updateDoc(doc(db, 'members', member.id), {
      ...member.draftData,
      hasPendingEdit: false,
      draftData: null
    });
  };
  const handleRejectEdit = async (id: string) => {
    if (confirm("Are you sure you want to discard these proposed changes?")) {
      // Clear the pending flags, keeping the original live data intact
      await updateDoc(doc(db, 'members', id), { hasPendingEdit: false, draftData: null });
    }
  };

  if (authLoading || isLoading) return <div className="flex min-h-screen items-center justify-center font-bold text-slate-500"><Loader2 className="animate-spin mr-2" /> Loading dashboard...</div>;

  return (
    <div className="p-6 bg-slate-50 min-h-screen pb-24">
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
              <div key={u.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <p className="font-bold text-slate-900">{u.name}</p>
                  <p className="text-sm text-slate-500">{u.email}</p>
                  <p className="text-xs text-slate-400 mt-1">Requested: {new Date(u.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleApproveUser(u.id)} className="flex-1 sm:flex-none flex items-center justify-center bg-teal-50 text-teal-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-teal-100 transition border border-teal-200">
                    <CheckCircle size={16} className="mr-1.5" /> Approve
                  </button>
                  <button onClick={() => handleRejectUser(u.id)} className="flex-1 sm:flex-none flex items-center justify-center bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-100 transition border border-red-200">
                    <XCircle size={16} className="mr-1.5" /> Deny
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
              <div key={family.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <p className="font-bold text-slate-900">{family.familyName} Family</p>
                  <p className="text-sm text-slate-500">{family.members?.length || 0} members listed</p>
                  <p className="text-xs text-slate-400 mt-1">Submitted by: {family.submittedBy || 'Unknown'}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleApproveCreation(family.id)} className="flex-1 sm:flex-none flex items-center justify-center bg-teal-50 text-teal-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-teal-100 transition border border-teal-200">
                    <CheckCircle size={16} className="mr-1.5" /> Publish
                  </button>
                  <button onClick={() => handleRejectCreation(family.id)} className="flex-1 sm:flex-none flex items-center justify-center bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-100 transition border border-red-200">
                    <XCircle size={16} className="mr-1.5" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SECTION 3: FAMILY EDITS */}
      <section>
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
          <Edit3 size={20} className="mr-2 text-purple-500" /> Directory Edit Requests
        </h2>
        {pendingEdits.length === 0 ? (
          <p className="text-slate-500 text-sm bg-white p-6 rounded-2xl border border-slate-200 text-center">No pending edits.</p>
        ) : (
          <div className="space-y-3">
            {pendingEdits.map(family => (
              <div key={family.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <p className="font-bold text-slate-900">{family.familyName} Family</p>
                  <p className="text-sm text-slate-500">Proposed updates waiting for review.</p>
                  <p className="text-xs text-slate-400 mt-1">Submitted by: {family.submittedBy || 'Member'}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleApproveEdit(family)} className="flex-1 sm:flex-none flex items-center justify-center bg-teal-50 text-teal-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-teal-100 transition border border-teal-200">
                    <CheckCircle size={16} className="mr-1.5" /> Merge Edit
                  </button>
                  <button onClick={() => handleRejectEdit(family.id)} className="flex-1 sm:flex-none flex items-center justify-center bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-100 transition border border-red-200">
                    <XCircle size={16} className="mr-1.5" /> Discard
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
}