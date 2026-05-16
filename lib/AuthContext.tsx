'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, User, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  role: 'admin' | 'approved' | 'pending' | null;
  userProfile: any | null; 
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null, role: null, userProfile: null, loading: true, logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<'admin' | 'approved' | 'pending' | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeSnapshot: () => void; 

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const userDocRef = doc(db, 'users', firebaseUser.uid);

        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          setRole(userDoc.data().role);
          setUserProfile(userDoc.data());
        } else {
          // ==========================================
          // BRAND NEW USER ONBOARDING LOGIC
          // ==========================================
          // Check exactly HOW they are registering
          const providerId = firebaseUser.providerData[0]?.providerId;

          if (providerId === 'google.com') {
            // Google users bypass our manual Login form, so we MUST auto-create their profile here.
            const newProfile = {
              email: firebaseUser.email || '',
              phone: firebaseUser.phoneNumber || '', 
              name: firebaseUser.displayName || 'Unknown Member',
              role: 'pending',
              createdAt: new Date().toISOString()
            };
            await setDoc(userDocRef, newProfile);
            setRole('pending');
            setUserProfile(newProfile);
          } else {
            // Email/Password or Phone OTP user!
            // Do absolutely nothing here. Let the Login.tsx page finish executing its 
            // setDoc function so it can save the custom Name and Phone number they typed.
            // The real-time watcher below will trigger automatically once Login.tsx is done!
            setRole(null);
            setUserProfile(null);
          }
        }
        setLoading(false);

        // REAL-TIME WATCHER
        unsubscribeSnapshot = onSnapshot(userDocRef, (snap) => {
          if (!snap.exists()) {
            // Admin deleted their profile! Log them out instantly.
            firebaseSignOut(auth);
            setUser(null);
            setRole(null);
            setUserProfile(null);
          } else {
            // Admin approved them, OR Login.tsx just finished saving their name! Update instantly.
            setRole(snap.data().role);
            setUserProfile(snap.data());
          }
        });

      } else {
        setUser(null); 
        setRole(null); 
        setUserProfile(null);
        setLoading(false);
        if (unsubscribeSnapshot) unsubscribeSnapshot(); 
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  const logout = async () => {
    await firebaseSignOut(auth);
    setUser(null); setRole(null); setUserProfile(null);
  };

  return <AuthContext.Provider value={{ user, role, userProfile, loading, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}