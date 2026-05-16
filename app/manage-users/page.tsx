'use client';
import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import { logActivity } from '@/lib/logger';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Users, Trash2, Loader2, ShieldCheck, Phone, Mail } from 'lucide-react';

export default function ManageUsersPage() {
  const { role, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && role !== 'admin') router.push('/dashboard');
  }, [role, authLoading, router]);

  useEffect(() => {
    if (role !== 'admin') return;
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [role]);

  const handleDeleteUser = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to revoke access for ${name}?`)) {
      await deleteDoc(doc(db, 'users', id));
      await logActivity(userProfile, 'Revoked User Access', `Deleted account for ${name}`);
    }
  };

  if (authLoading || isLoading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="animate-spin text-teal-600" size={32} /></div>;

  return (
    <div className="p-6 bg-slate-50 min-h-screen pb-24">
      <Link href="/dashboard" className="mb-6 inline-flex items-center text-sm font-bold text-slate-500 hover:text-slate-800 transition">
        <ArrowLeft size={16} className="mr-1" /> Back to Dashboard
      </Link>
      
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-slate-900 mb-2 flex items-center">
          <Users size={28} className="text-blue-500 mr-2" /> Manage Users
        </h1>
        <p className="text-slate-500 text-sm">Oversee all registered accounts and revoke access.</p>
      </div>

      <div className="space-y-3">
        {users.map((u) => (
          <div key={u.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-slate-900 truncate">{u.name || 'Unknown Name'}</span>
                {u.role === 'admin' && <ShieldCheck size={14} className="text-amber-500" />}
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${
                  u.role === 'admin' ? 'bg-amber-100 text-amber-700' : 
                  u.role === 'approved' ? 'bg-teal-100 text-teal-700' : 'bg-slate-200 text-slate-600'
                }`}>{u.role}</span>
              </div>
              
              {/* UPDATED CONTACT INFO LOGIC: Shows BOTH if they exist */}
              <div className="text-xs text-slate-500 mt-1.5 space-y-1">
                {u.phone && (
                  <span className="flex items-center"><Phone size={12} className="mr-1.5 text-slate-400" /> {u.phone}</span>
                )}
                {u.email && (
                  <span className="flex items-center"><Mail size={12} className="mr-1.5 text-slate-400" /> {u.email}</span>
                )}
                {!u.phone && !u.email && (
                  <span className="italic">No contact info provided</span>
                )}
              </div>

            </div>
            
            {u.role !== 'admin' && (
              <button onClick={() => handleDeleteUser(u.id, u.name)} className="shrink-0 p-2.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition">
                <Trash2 size={18} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}