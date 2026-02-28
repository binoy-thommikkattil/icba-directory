'use client';
import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { BookOpen, Loader2 } from 'lucide-react';

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { user, role, loading: authLoading } = useAuth();

  useEffect(() => {
    if (user && !authLoading) {
      if (role === 'pending') router.push('/waiting-room');
      else router.push('/');
    }
  }, [user, role, authLoading, router]);

  const handleGoogleSignIn = async () => {
    setLoading(true); setError('');
    try { 
      await signInWithPopup(auth, new GoogleAuthProvider()); 
    } catch (err: any) { 
      setError('Google sign-in failed. Please try again.'); 
      setLoading(false); 
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      if (isSignUp) {
        // 1. Create the account in Firebase Auth
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        // 2. Set their name in Firebase Auth
        await updateProfile(cred.user, { displayName: name });
        // 3. Save their name to your Firestore users database!
        await setDoc(doc(db, 'users', cred.user.uid), {
          email: cred.user.email,
          name: name,
          role: 'pending',
          createdAt: new Date().toISOString()
        });
      } else {
        // Just log in normally
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(err.message.includes('auth/') ? 'Invalid email or password.' : 'Authentication failed.');
      setLoading(false);
    }
  };

  if (authLoading) return <div className="flex min-h-screen items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-teal-600" size={32} /></div>;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-slate-100 text-center">
        <div className="w-16 h-16 bg-teal-100 text-teal-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner"><BookOpen size={32} /></div>
        <h1 className="text-3xl font-serif font-bold text-slate-900 mb-2">ICBA Directory</h1>
        
        {error && <p className="text-red-500 text-sm mb-4 p-3 bg-red-50 rounded-lg border border-red-100">{error}</p>}

        <form onSubmit={handleEmailAuth} className="space-y-4 mb-6 text-left">
          {isSignUp && (
            <div className="animate-in fade-in slide-in-from-top-2">
              <label className="block text-xs font-bold text-slate-500 mb-1">Full Name</label>
              <input required type="text" placeholder="e.g. John Doe" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-teal-500 focus:bg-white transition" value={name} onChange={e => setName(e.target.value)} />
            </div>
          )}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Email</label>
            <input required type="email" placeholder="your@email.com" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-teal-500 focus:bg-white transition" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Password</label>
            <input required type="password" minLength={6} placeholder="••••••••" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-teal-500 focus:bg-white transition" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-slate-800 text-white p-3.5 rounded-xl font-bold hover:bg-slate-900 transition shadow-sm">
            {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : (isSignUp ? 'Create Account' : 'Sign In with Email')}
          </button>
        </form>

        <div className="relative flex py-2 items-center mb-6">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-bold uppercase tracking-wider">or</span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>

        <button onClick={handleGoogleSignIn} disabled={loading} className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 text-slate-700 p-3.5 rounded-xl font-bold hover:bg-slate-50 transition mb-6 shadow-sm">
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" /> Continue with Google
        </button>

        {/* THIS IS THE TOGGLE THAT REVEALS THE SIGN UP FORM */}
        <button onClick={() => setIsSignUp(!isSignUp)} type="button" className="text-sm font-bold text-teal-600 hover:text-teal-800 transition">
          {isSignUp ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
        </button>

      </div>
    </div>
  );
}