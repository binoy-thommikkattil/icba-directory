'use client';
import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, History, Loader2 } from 'lucide-react';

export default function ActivityLogPage() {
  const { user, role, loading: authLoading } = useAuth();
  const router = useRouter();
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && role !== 'admin') router.push('/');
  }, [role, authLoading, router]);

  useEffect(() => {
    if (role !== 'admin') return;
    // Get the latest 100 activities
    const q = query(collection(db, 'activity_logs'), orderBy('timestamp', 'desc'), limit(100));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [role]);

  if (authLoading || isLoading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="animate-spin text-teal-600" size={32} /></div>;

  return (
    <div className="p-6 bg-slate-50 min-h-screen pb-24">
      <Link href="/" className="mb-6 inline-flex items-center text-sm font-bold text-slate-500 hover:text-slate-800 transition">
        <ArrowLeft size={16} className="mr-1" /> Back to Dashboard
      </Link>
      
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-slate-900 mb-2 flex items-center">
          <History size={28} className="text-indigo-500 mr-2" /> Activity Log
        </h1>
        <p className="text-slate-500 text-sm">System audit trail of member actions.</p>
      </div>

      <div className="space-y-3">
        {logs.length === 0 ? <p className="text-slate-500 text-center py-10 bg-white rounded-2xl border">No recent activity.</p> : (
          logs.map((log) => (
            <div key={log.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-start mb-1">
                <span className="font-bold text-slate-800">{log.userName}</span>
                <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-2">{log.userEmail}</p>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <p className="text-sm font-bold text-indigo-700 mb-0.5">{log.action}</p>
                <p className="text-sm text-slate-600 leading-snug">{log.details}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}