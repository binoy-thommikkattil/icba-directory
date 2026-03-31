'use client';
import { useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { ShieldAlert, PlusCircle, LogOut, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function WaitingRoom() {
  const { user, role, loading, logout } = useAuth();
  const router = useRouter();

  // Redirect users if they shouldn't be here
  useEffect(() => {
    if (!loading) {
      if (!user) router.push('/login');
      // If they are already approved or an admin, send them straight to the directory!
      if (role === 'admin' || role === 'approved') router.push('/dashboard');
    }
  }, [user, role, loading, router]);

  if (loading || !user) return <div className="flex min-h-screen items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-teal-600" size={32} /></div>;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-slate-100 text-center animate-in fade-in slide-in-from-bottom-4">
        
        <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
          <ShieldAlert size={32} />
        </div>
        
        <h1 className="text-2xl font-serif font-bold text-slate-900 mb-3">Pending Verification</h1>
        <p className="text-slate-600 mb-6 text-sm leading-relaxed">
          Your account has been securely created with <strong className="text-slate-800">{user.email}</strong>. 
          For the privacy of our assembly, a church administrator must verify your account before you can view the directory.
        </p>

        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 mb-8 text-left">
          <h2 className="font-bold text-slate-800 text-sm mb-2 flex items-center"><PlusCircle size={16} className="mr-1.5 text-teal-600"/> New to the Directory?</h2>
          <p className="text-xs text-slate-500 mb-4 leading-relaxed">If you haven't submitted your family's contact information yet, please do so now so the admin can verify and approve your account.</p>
          <Link href="/add-family" className="w-full flex items-center justify-center bg-teal-700 text-white py-3 px-4 rounded-xl font-bold hover:bg-teal-800 transition shadow-sm text-sm">
            Submit Family Details
          </Link>
        </div>

        <button onClick={logout} className="text-sm font-bold text-slate-500 hover:text-slate-800 flex items-center justify-center w-full transition p-2">
          <LogOut size={16} className="mr-2" /> Sign out for now
        </button>
        
      </div>
    </div>
  );
}