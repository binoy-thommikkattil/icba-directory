'use client';
import { useAuth } from '@/lib/AuthContext';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { LogOut } from 'lucide-react';

export default function TopBar() {
  const { user, userProfile, logout } = useAuth();
  const pathname = usePathname();
  const firstName = user?.displayName?.split(' ')[0] || userProfile?.name?.split(' ')[0] || 'Member';

  // 1. THE WHITELIST: Define all the private directory-related base paths
  const directoryPaths = [
    '/dashboard',
    '/directory',
    '/meetings',
    '/prayer',
    '/songbook',
    '/youth',
    '/bachelors',
    '/sunday-school',
    '/blood-registry',
    '/add-family',
    '/edit-family',
    '/approvals',
    '/manage-users',
    '/activity-log'
  ];

  // 2. Check if the current URL starts with any of the approved directory paths
  // Using startsWith() automatically includes sub-pages like /songbook/123
  const isDirectoryPage = directoryPaths.some(path => pathname?.startsWith(path));

  // 3. Hide the top bar if the user is not logged in OR if they are NOT on a directory page
  if (!user || !isDirectoryPage) return null;

  return (
    <div className="w-full bg-white px-4 py-3 border-b border-slate-200 sticky top-0 z-50 flex items-center justify-between gap-3 print:hidden sm:px-6 sm:py-4">
      {/* Updated to use Next.js Link and point to the dashboard */}
      <Link href="/dashboard" className="text-xl font-serif font-bold text-teal-700 tracking-tight hover:opacity-80 transition sm:text-2xl">
        ICBA Directory
      </Link>

      <div className="ml-auto flex items-center gap-2 text-sm sm:gap-4">
        <span className="text-slate-500 whitespace-nowrap">
          Welcome <strong className="text-teal-700">{firstName}</strong>
        </span>
        <button
          onClick={logout}
          aria-label="Logout"
          title="Logout"
          className="inline-flex items-center justify-center rounded-lg bg-slate-100 p-2 text-slate-800 font-medium transition hover:bg-slate-200 shadow-sm sm:px-4 sm:py-2"
        >
          <LogOut className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </div>
  );
}