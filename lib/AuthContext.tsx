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
          
          // CRITICAL FIX: If they logged in via Phone OTP, they don't have an email yet.
          // We must NOT auto-create their document here, because Login.tsx is currently 
          // holding them at the "Enter your Full Name" prompt! 
          if (firebaseUser.phoneNumber && !firebaseUser.email) {
            // Do nothing. Let the Login page finish. The onSnapshot listener below 
            // will automatically trigger as soon as the Login page saves their name!
            setRole(null);
            setUserProfile(null);
          } else {
            // It's a Google Sign-In or Email Sign-Up. We can safely auto-create their profile.
            const newProfile = {
              email: firebaseUser.email || '',
              phone: firebaseUser.phoneNumber || '', // Captures phone if available
              name: firebaseUser.displayName || 'Unknown Member',
              role: 'pending', // Removed the dangerous 'admin' loophole. Everyone starts pending.
              createdAt: new Date().toISOString()
            };
            await setDoc(userDocRef, newProfile);
            setRole('pending');
            setUserProfile(newProfile);
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
            // Admin approved them! Update the app instantly.
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