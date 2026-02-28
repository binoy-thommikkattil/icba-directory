'use client';
import { useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Users, Calendar, Heart, ShieldCheck, Loader2, PlusCircle, Droplet } from 'lucide-react';

export default function Dashboard() {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  // Security Check
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (role === 'pending') {
        router.push('/waiting-room');
      }
    }
  }, [user, role, loading, router]);

  if (loading || !user) return <div className="flex min-h-screen items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-teal-600" size={32} /></div>;

  return (
    <div className="min-h-screen bg-slate-50 p-6 pb-24">
      
      <header className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-slate-900 mb-1">Dashboard</h1>
      </header>

      {/* CORE MEMBER FEATURES */}
      <div className="grid grid-cols-1 gap-4 mb-6">
        <Link href="/directory" className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:border-teal-400 transition flex items-center gap-4 group">
          <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition">
            <Users size={24} />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 text-lg">Directory</h2>
            <p className="text-sm text-slate-500">Search families and members</p>
          </div>
        </Link>

        <Link href="/meetings" className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-400 transition flex items-center gap-4 group">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition">
            <Calendar size={24} />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 text-lg">Meetings</h2>
            <p className="text-sm text-slate-500">Service schedule and links</p>
          </div>
        </Link>

        <Link href="/prayer" className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:border-rose-400 transition flex items-center gap-4 group">
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition">
            <Heart size={24} />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 text-lg">Prayer Points</h2>
            <p className="text-sm text-slate-500">Current needs of the assembly</p>
          </div>
        </Link>

        {/* NEW BLOOD REGISTRY BUTTON */}
        <Link href="/blood-registry" className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:border-red-400 transition flex items-center gap-4 group">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition">
            <Droplet size={24} />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 text-lg">Blood Registry</h2>
            <p className="text-sm text-slate-500">Find willing donors in emergencies</p>
          </div>
        </Link>
      </div>

      {/* NEW: ADD FAMILY PROMPT FOR REGULAR USERS */}
      {role === 'approved' && (
        <div className="bg-teal-50 p-5 rounded-2xl border border-teal-100 flex items-center justify-between gap-4 shadow-sm animate-in fade-in slide-in-from-bottom-4">
          <div>
            <h3 className="text-sm font-bold text-teal-900">Missing your details?</h3>
            <p className="text-xs text-teal-700 mt-0.5">Add your profile to the directory.</p>
          </div>
          <Link href="/add-family" className="px-4 py-2.5 bg-teal-600 text-white text-sm font-bold rounded-xl hover:bg-teal-700 transition shrink-0 shadow-sm">
            Add Family
          </Link>
        </div>
      )}

      {/* ADMIN ONLY SECTION */}
      {role === 'admin' && (
        <div className="mt-8 animate-in fade-in slide-in-from-bottom-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">Admin Controls</h3>
          
          <div className="grid grid-cols-1 gap-4">
            <Link href="/approvals" className="bg-slate-800 p-5 rounded-2xl shadow-md border border-slate-700 hover:bg-slate-900 transition flex items-center gap-4 group">
              <div className="w-12 h-12 bg-slate-700 text-amber-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h2 className="font-bold text-white text-lg">Pending Approvals</h2>
                <p className="text-sm text-slate-400">Review users, new families & edits</p>
              </div>
            </Link>

            <Link href="/add-family" className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:border-teal-400 transition flex items-center gap-4 group">
              <div className="w-12 h-12 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center group-hover:bg-teal-50 group-hover:text-teal-600 transition">
                <PlusCircle size={24} />
              </div>
              <div>
                <h2 className="font-bold text-slate-800 text-lg">Add New Family</h2>
                <p className="text-sm text-slate-500">Directly bypass approval to add a family</p>
              </div>
            </Link>
          </div>
        </div>
      )}
      
    </div>
  );
}