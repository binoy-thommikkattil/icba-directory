'use client';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { Users, ClipboardCheck, Video, Heart, Droplet, BookOpen } from 'lucide-react';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <div className="flex h-screen items-center justify-center font-bold text-slate-500">Loading Dashboard...</div>;
  }

  const isAdmin = user.email?.toLowerCase().includes('admin');

  return (
    <main className="w-full p-6 min-h-[85vh] bg-slate-50">
      <div className="mb-8 mt-4 text-center">
        <h1 className="text-3xl font-serif font-bold text-slate-900">Welcome</h1>
        <p className="text-slate-500">ICBA Church Portal</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Link href="/directory" className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center hover:shadow-md hover:border-teal-400 transition group">
          <div className="w-14 h-14 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mb-4 group-hover:bg-teal-600 group-hover:text-white transition">
            <Users size={28} />
          </div>
          <h2 className="font-bold text-slate-800">Directory</h2>
          <p className="text-xs text-slate-500 mt-1">All Members</p>
        </Link>

        <Link href="/meetings" className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center hover:shadow-md hover:border-blue-400 transition group">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition">
            <Video size={28} />
          </div>
          <h2 className="font-bold text-slate-800">Meetings</h2>
          <p className="text-xs text-slate-500 mt-1">Zoom Links</p>
        </Link>

        <Link href="/prayer" className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center hover:shadow-md hover:border-rose-400 transition group">
          <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mb-4 group-hover:bg-rose-600 group-hover:text-white transition">
            <Heart size={28} />
          </div>
          <h2 className="font-bold text-slate-800">Prayer</h2>
          <p className="text-xs text-slate-500 mt-1">Current Needs</p>
        </Link>

        <Link href="/sunday-school" className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center hover:shadow-md hover:border-indigo-400 transition group">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition">
            <BookOpen size={28} />
          </div>
          <h2 className="font-bold text-slate-800">Sunday School</h2>
          <p className="text-xs text-slate-500 mt-1">Students & Staff</p>
        </Link>

        <Link href="/blood-registry" className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center hover:shadow-md hover:border-red-400 transition group">
          <div className="w-14 h-14 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-4 group-hover:bg-red-600 group-hover:text-white transition">
            <Droplet size={28} />
          </div>
          <h2 className="font-bold text-slate-800">Blood Registry</h2>
          <p className="text-xs text-slate-500 mt-1">Emergency Donors</p>
        </Link>

        {isAdmin && (
          <Link href="/admin" className="bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-700 flex flex-col items-center justify-center text-center hover:shadow-md hover:bg-slate-900 transition group">
            <div className="w-14 h-14 bg-slate-700 text-teal-400 rounded-full flex items-center justify-center mb-4">
              <ClipboardCheck size={28} />
            </div>
            <h2 className="font-bold text-white">Approvals</h2>
            <p className="text-xs text-slate-400 mt-1">Review Entries</p>
          </Link>
        )}
      </div>
    </main>
  );
}