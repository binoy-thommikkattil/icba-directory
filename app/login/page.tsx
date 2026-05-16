'use client';
import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  RecaptchaVerifier,
  signInWithPhoneNumber
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { BookOpen, Loader2, Phone, Mail } from 'lucide-react';

export default function Login() {
  // Global States
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { user, role, loading: authLoading } = useAuth();

  // Email States
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailPhone, setEmailPhone] = useState('');

  // Phone States
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);

  // Auto-Routing
  useEffect(() => {
    // ADDED 'role' check: Only route them away if their database role actually exists!
    if (user && !authLoading && role && !showNamePrompt) {
      if (role === 'pending') router.push('/waiting-room');
      else router.push('/dashboard');
    }
  }, [user, role, authLoading, showNamePrompt, router]);

  // Safely initialize Recaptcha when switching to Phone Login
  useEffect(() => {
    if (loginMethod === 'phone' && !(window as any).recaptchaVerifier) {
      try {
        (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible'
        });
      } catch (err) {
        console.error("Recaptcha Init Error:", err);
      }
    }
  }, [loginMethod]);

  // ============================
  // EMAIL & GOOGLE AUTH LOGIC
  // ============================
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
        if (!emailPhone.trim()) throw new Error("Mobile Number is required.");

        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: name });

        await setDoc(doc(db, 'users', cred.user.uid), {
          email: cred.user.email,
          name: name,
          phone: emailPhone,
          role: 'pending',
          createdAt: new Date().toISOString()
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(err.message.includes('auth/') ? 'Invalid email or password.' : err.message || 'Authentication failed.');
      setLoading(false);
    }
  };

  // ============================
  // PHONE AUTH LOGIC
  // ============================
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');

    try {
      // 1. Strip all non-numeric characters from the input
      let cleanNumber = phoneNumber.replace(/\D/g, '');

      // 2. Format to exactly 12 digits (91 + 10 digit number)
      if (cleanNumber.length === 10) {
        cleanNumber = `91${cleanNumber}`;
      } else if (cleanNumber.length === 11 && cleanNumber.startsWith('0')) {
        cleanNumber = `91${cleanNumber.substring(1)}`;
      }

      const formattedPhone = `+${cleanNumber}`;

      // 3. Strict pre-flight validation
      if (formattedPhone.length !== 13) {
        throw new Error(`Invalid format. Expected 10 digits, but got ${cleanNumber.replace('91', '').length}.`);
      }

      console.log("Attempting to send OTP to:", formattedPhone);

      // 4. Send to Firebase
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, (window as any).recaptchaVerifier);

      setConfirmationResult(confirmation);
      setShowOtpInput(true);

    } catch (err: any) {
      console.error("Firebase Phone Auth Error:", err);

      // Provide hyper-specific error messages to help you debug
      if (err.code === 'auth/operation-not-allowed') {
        setError('Phone Auth is not enabled! Go to Firebase Console -> Authentication -> Sign-in Method and enable Phone.');
      } else if (err.code === 'auth/invalid-phone-number') {
        setError('Firebase rejected the phone format. Ensure it is a valid Indian number.');
      } else if (err.message && err.message.includes('reCAPTCHA')) {
        setError('reCAPTCHA verification failed. Refresh the page and try again.');
      } else {
        setError(err.message || 'Failed to send OTP.');
      }

      // Reset recaptcha if it fails so the user can try again
      if ((window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier.render().then((widgetId: any) => {
          (window as any).grecaptcha.reset(widgetId);
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const result = await confirmationResult.confirm(otp);
      const verifiedUser = result.user;

      const userDoc = await getDoc(doc(db, 'users', verifiedUser.uid));

      if (userDoc.exists()) {
        setLoading(false);
      } else {
        setShowOtpInput(false);
        setShowNamePrompt(true);
        setLoading(false);
      }
    } catch (err: any) {
      setError('Invalid OTP code. Please try again.');
      setLoading(false);
    }
  };

  const handleSavePhoneUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      if (!name.trim()) throw new Error("Name is required");

      await setDoc(doc(db, 'users', auth.currentUser!.uid), {
        name: name,
        phone: auth.currentUser!.phoneNumber,
        role: 'pending',
        createdAt: new Date().toISOString()
      });

      setShowNamePrompt(false);
    } catch (err: any) {
      setError(err.message || 'Failed to save profile.');
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

        {/* LOGIN METHOD TOGGLE */}
        {!showNamePrompt && (
          <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
            <button onClick={() => { setLoginMethod('email'); setError(''); }} type="button" className={`flex-1 flex items-center justify-center py-2.5 text-sm font-bold rounded-lg transition ${loginMethod === 'email' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              <Mail size={16} className="mr-2" /> Email
            </button>
            <button onClick={() => { setLoginMethod('phone'); setError(''); }} type="button" className={`flex-1 flex items-center justify-center py-2.5 text-sm font-bold rounded-lg transition ${loginMethod === 'phone' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              <Phone size={16} className="mr-2" /> Phone
            </button>
          </div>
        )}

        {/* MANDATORY RECAPTCHA CONTAINER */}
        <div id="recaptcha-container"></div>

        {/* ==============================
            EMAIL FORM
        ============================== */}
        {loginMethod === 'email' && !showNamePrompt && (
          <>
            <form onSubmit={handleEmailAuth} className="space-y-4 mb-6 text-left">
              {isSignUp && (
                <div className="animate-in fade-in slide-in-from-top-2 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Full Name</label>
                    <input required type="text" placeholder="e.g. John Mark" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-teal-500 focus:bg-white transition" value={name} onChange={e => setName(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Mobile Number</label>
                    <input required type="tel" placeholder="9876543210" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-teal-500 focus:bg-white transition" value={emailPhone} onChange={e => setEmailPhone(e.target.value)} />
                  </div>
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
              <button type="submit" disabled={loading} className="w-full bg-slate-800 text-white p-3.5 rounded-xl font-bold hover:bg-slate-900 transition shadow-sm flex justify-center items-center">
                {loading ? <Loader2 className="animate-spin" size={20} /> : (isSignUp ? 'Create Account' : 'Sign In with Email')}
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

            <button onClick={() => setIsSignUp(!isSignUp)} type="button" className="text-sm font-bold text-teal-600 hover:text-teal-800 transition">
              {isSignUp ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
            </button>
          </>
        )}

        {/* ==============================
            PHONE FORM
        ============================== */}
        {loginMethod === 'phone' && (
          <div className="text-left animate-in fade-in slide-in-from-right-4">

            {!showOtpInput && !showNamePrompt && (
              <form onSubmit={handleSendOTP} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">10-Digit Mobile Number</label>

                  {/* UPDATED UI: Hardcoded +91 visually inside the input box */}
                  <div className="relative">
                    <span className="absolute left-4 top-3.5 text-slate-500 font-bold border-r border-slate-200 pr-3">+91</span>
                    <input
                      required
                      type="tel"
                      placeholder="98765 43210"
                      className="w-full pl-16 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-teal-500 focus:bg-white transition font-medium tracking-wide"
                      value={phoneNumber}
                      onChange={e => setPhoneNumber(e.target.value)}
                    />
                  </div>

                </div>
                <button type="submit" disabled={loading} className="w-full bg-slate-800 text-white p-3.5 rounded-xl font-bold hover:bg-slate-900 transition shadow-sm flex justify-center items-center">
                  {loading ? <Loader2 className="animate-spin" size={20} /> : 'Send OTP via SMS'}
                </button>
              </form>
            )}

            {showOtpInput && !showNamePrompt && (
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 text-center">Enter the 6-digit code</label>
                  <input required type="text" placeholder="------" maxLength={6} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-teal-500 focus:bg-white transition text-center text-2xl font-bold tracking-widest" value={otp} onChange={e => setOtp(e.target.value)} />
                </div>
                <button type="submit" disabled={loading} className="w-full bg-teal-600 text-white p-3.5 rounded-xl font-bold hover:bg-teal-700 transition shadow-sm flex justify-center items-center">
                  {loading ? <Loader2 className="animate-spin" size={20} /> : 'Verify Code'}
                </button>
                <button type="button" onClick={() => { setShowOtpInput(false); setOtp(''); }} className="w-full text-center text-sm font-bold text-slate-500 mt-2 hover:text-slate-800">
                  Change Phone Number
                </button>
              </form>
            )}

            {showNamePrompt && (
              <form onSubmit={handleSavePhoneUser} className="space-y-4 animate-in zoom-in-95">
                <div className="bg-teal-50 border border-teal-100 p-4 rounded-xl text-center mb-6">
                  <span className="text-2xl mb-2 block">🎉</span>
                  <h3 className="font-bold text-teal-800">Phone Verified!</h3>
                  <p className="text-xs text-teal-600 mt-1">Please provide your name so the admins can approve your directory access.</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Full Name</label>
                  <input required type="text" placeholder="e.g. John Mark" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-teal-500 focus:bg-white transition" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <button type="submit" disabled={loading} className="w-full bg-slate-800 text-white p-3.5 rounded-xl font-bold hover:bg-slate-900 transition shadow-sm flex justify-center items-center">
                  {loading ? <Loader2 className="animate-spin" size={20} /> : 'Request Access'}
                </button>
              </form>
            )}
          </div>
        )}

      </div>
    </div>
  );
}