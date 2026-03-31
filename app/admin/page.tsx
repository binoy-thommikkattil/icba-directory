'use client';
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, or } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Check, X } from 'lucide-react';

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [queue, setQueue] = useState<any[]>([]);

  // 1. STRICT ADMIN SECURITY CHECK
  useEffect(() => {
    if (!loading) {
      // If they aren't logged in, or their email doesn't include 'admin', kick them out
      if (!user || !user.email?.toLowerCase().includes('admin')) {
        router.push('/');
      }
    }
  }, [user, loading, router]);

  // 2. FETCH THE QUEUE (Both New Families & Edit Requests)
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'members'), 
      or(where('isPendingCreation', '==', true), where('hasPendingEdit', '==', true))
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setQueue(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user]);

  // 3. APPROVAL LOGIC
  const approveRequest = async (record: any) => {
    const docRef = doc(db, 'members', record.id);
    try {
      if (record.isPendingCreation) {
        // For new families, just flip the pending switch to false to make them live
        await updateDoc(docRef, { isPendingCreation: false });
      } else if (record.hasPendingEdit) {
        // For edits, overwrite the live data with the draftData, then clear the draft
        await updateDoc(docRef, { 
          ...record.draftData, 
          hasPendingEdit: false, 
          draftData: null 
        });
      }
    } catch (error) {
      console.error("Error approving:", error);
      alert("Failed to approve request.");
    }
  };

  // 4. DENIAL LOGIC
  const denyRequest = async (record: any) => {
    try {
      if (record.isPendingCreation) {
        // If it's a completely new, unapproved family, deleting it removes the spam
        await deleteDoc(doc(db, 'members', record.id));
      } else if (record.hasPendingEdit) {
        // If it's a bad edit to an existing family, just delete the draft and keep the old data live
        await updateDoc(doc(db, 'members', record.id), { 
          hasPendingEdit: false, 
          draftData: null 
        });
      }
    } catch (error) {
      console.error("Error denying:", error);
      alert("Failed to deny request.");
    }
  };

  if (loading || !user) return <div className="p-8 text-center text-slate-500">Verifying admin credentials...</div>;

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <Link href="/dashboard" className="mb-6 inline-flex items-center text-sm font-bold text-slate-500 hover:text-slate-800 transition">
        <ArrowLeft size={16} className="mr-1" /> Back to Dashboard
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-slate-900">Pending Approvals</h1>
        <p className="text-slate-500">Review new submissions and member edits.</p>
      </div>
      
      {queue.length === 0 ? (
        <div className="bg-white p-10 rounded-3xl shadow-sm border border-slate-200 text-center">
          <p className="text-slate-500 font-medium">You are all caught up! No pending requests.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {queue.map((req) => (
            <div key={req.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col">
              
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-serif font-bold text-2xl text-slate-900 mb-2">
                    {req.isPendingCreation ? req.familyName : req.draftData?.familyName || req.familyName}
                  </h3>
                  <div className="flex items-center gap-3">
                    {req.isPendingCreation ? (
                      <span className="bg-teal-50 text-teal-700 px-3 py-1 rounded-full text-xs font-bold border border-teal-200 uppercase tracking-wider">New Submission</span>
                    ) : (
                      <span className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-bold border border-amber-200 uppercase tracking-wider">Edit Request</span>
                    )}
                    <span className="text-xs text-slate-400 font-medium">Submitted by {req.submittedBy || 'Unknown'}</span>
                  </div>
                </div>
              </div>

              {/* Data Preview */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6 text-sm">
                <p className="mb-1"><span className="font-bold text-slate-700">Phone:</span> {req.isPendingCreation ? req.primaryMobile : req.draftData?.primaryMobile}</p>
                <p className="mb-1"><span className="font-bold text-slate-700">Address:</span> {req.isPendingCreation ? req.currentAddress : req.draftData?.currentAddress}</p>
                <p><span className="font-bold text-slate-700">Members:</span> {(req.isPendingCreation ? req.members : req.draftData?.members)?.length || 0} individuals listed</p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-auto">
                <button 
                  onClick={() => approveRequest(req)} 
                  className="flex-1 flex items-center justify-center bg-teal-600 text-white py-3 rounded-xl font-bold hover:bg-teal-700 transition"
                >
                  <Check size={18} className="mr-2" /> Approve
                </button>
                <button 
                  onClick={() => denyRequest(req)} 
                  className="flex-1 flex items-center justify-center bg-rose-100 text-rose-700 py-3 rounded-xl font-bold hover:bg-rose-200 transition"
                >
                  <X size={18} className="mr-2" /> Reject
                </button>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}