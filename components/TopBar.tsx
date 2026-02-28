'use client';
import { useAuth } from '@/lib/AuthContext';

export default function TopBar() {
  const { user, logout } = useAuth();

  // Hide the entire top bar on the login page
  if (!user) return null;

  return (
    <div className="w-full bg-white px-6 py-4 border-b border-slate-200 sticky top-0 z-50 flex items-center justify-between print:hidden">
      <a href="/" className="text-2xl font-serif font-bold text-teal-700 tracking-tight hover:opacity-80 transition">
        ICBA Directory
      </a>
      
      <div className="flex items-center space-x-4 text-sm">
        <span className="text-slate-500 hidden sm:inline whitespace-nowrap">Welcome back</span>
        <button onClick={logout} className="px-4 py-2 bg-slate-100 text-slate-800 font-medium rounded-lg hover:bg-slate-200 transition shadow-sm whitespace-nowrap">
          Logout
        </button>
      </div>
    </div>
  );
}