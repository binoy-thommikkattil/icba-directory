'use client';
import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import Link from 'next/link';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { user, loading } = useAuth();

  // If they are already logged in, push them to the dashboard
  useEffect(() => {
    if (!loading && user) router.push('/');
  }, [user, loading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/');
    } catch (err) {
      setError('Invalid email or password.');
      setIsLoading(false);
    }
  };

  if (loading || user) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 relative z-10">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-lg border border-slate-100">
        
        <div className="text-center mb-8">
          <h1 className="text-4xl font-serif font-bold text-teal-700 mb-2">ICBA</h1>
          <p className="text-slate-500">Member Portal Login</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <input 
            type="email" 
            placeholder="Email Address"
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 outline-none transition" 
            onChange={e => setEmail(e.target.value)} required 
          />
          <input 
            type="password" 
            placeholder="Password"
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 outline-none transition" 
            onChange={e => setPassword(e.target.value)} required 
          />
          {error && <p className="text-red-500 text-sm font-medium text-center bg-red-50 p-3 rounded-lg">{error}</p>}
          
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-teal-700 text-white p-4 rounded-xl font-bold hover:bg-teal-800 transition disabled:opacity-70"
          >
            {isLoading ? 'Authenticating...' : 'Login'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-sm text-slate-500 mb-3">New to the church? Share your details here:</p>
          <Link href="/add-family" className="block w-full bg-slate-100 text-slate-700 p-3.5 rounded-xl font-bold hover:bg-slate-200 transition">
            Submit Family Details
          </Link>
        </div>
      </div>
    </div>
  );
}