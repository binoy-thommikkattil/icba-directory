'use client';
import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { BookOpen, ShieldCheck, Loader2 } from 'lucide-react';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { user, role, loading: authLoading } = useAuth();

  // If already logged in, redirect based on their role
  useEffect(() => {
    if (user && !authLoading) {
      if (role === 'pending') {
        router.push('/waiting-room'); // We will build this next!
      } else {
        router.push('/'); // Admins and Approved go to dashboard
      }
    }
  }, [user, role, authLoading, router]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // The useEffect above will handle the routing once AuthContext updates
    } catch (err: any) {
      setError('Failed to sign in with Google. Please try again.');
      setLoading(false);
    }
  };

  if (authLoading) return <div className="flex min-h-screen items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-teal-600" size={32} /></div>;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-slate-100 text-center">
        
        <div className="w-16 h-16 bg-teal-100 text-teal-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
          <BookOpen size={32} />
        </div>
        
        <h1 className="text-3xl font-serif font-bold text-slate-900 mb-2">ICBA Directory</h1>
        <p className="text-slate-500 mb-8 text-sm">A secure portal for our assembly members.</p>

        {error && <p className="text-red-500 text-sm mb-4 p-3 bg-red-50 rounded-lg border border-red-100">{error}</p>}

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white border border-slate-300 text-slate-700 p-4 rounded-xl font-bold hover:bg-slate-50 transition shadow-sm disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Sign in with Google
            </>
          )}
        </button>

        <div className="mt-8 flex items-start gap-3 text-left p-4 bg-slate-50 rounded-xl border border-slate-200">
          <ShieldCheck size={24} className="text-teal-600 shrink-0" />
          <p className="text-xs text-slate-500 leading-relaxed">
            For security, new accounts require admin verification. If you do not have an active family profile, you will be prompted to create one after signing in.
          </p>
        </div>

      </div>
    </div>
  );
}