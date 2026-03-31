'use client';
import { useAuth } from '@/lib/AuthContext';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function TopBar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

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
    <div className="w-full bg-white px-6 py-4 border-b border-slate-200 sticky top-0 z-50 flex items-center justify-between print:hidden">
      {/* Updated to use Next.js Link and point to the dashboard */}
      <Link href="/dashboard" className="text-2xl font-serif font-bold text-teal-700 tracking-tight hover:opacity-80 transition">
        ICBA Directory
      </Link>
      
      <div className="flex items-center space-x-4 text-sm">
        <span className="text-slate-500 hidden sm:inline whitespace-nowrap">Welcome back</span>
        <button onClick={logout} className="px-4 py-2 bg-slate-100 text-slate-800 font-medium rounded-lg hover:bg-slate-200 transition shadow-sm whitespace-nowrap">
          Logout
        </button>
      </div>
    </div>
  );
}