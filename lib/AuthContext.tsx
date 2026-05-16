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
        
        // --- THE FIX: We create a memory flag ---
        let hasProfileExisted = false; 

        if (userDoc.exists()) {
          hasProfileExisted = true; // The user has an established profile
          setRole(userDoc.data().role);
          setUserProfile(userDoc.data());
        } else {
          // New User Onboarding!
          const providerId = firebaseUser.providerData[0]?.providerId;

          if (providerId === 'google.com') {
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
            hasProfileExisted = true; // They now have an established profile
          } else {
            // They are logging in with Phone or Email and are currently staring at 
            // the "Enter your Name" prompt. We do nothing and let them finish!
            setRole(null);
            setUserProfile(null);
          }
        }
        setLoading(false);

        // REAL-TIME WATCHER
        unsubscribeSnapshot = onSnapshot(userDocRef, (snap) => {
          if (snap.exists()) {
            hasProfileExisted = true; // They successfully saved their name from the Login page!
            setRole(snap.data().role);
            setUserProfile(snap.data());
          } else {
            // SMART AUTO-KICK: Only sign them out if they HAD a profile and it was deleted!
            if (hasProfileExisted) {
              firebaseSignOut(auth);
              setUser(null);
              setRole(null);
              setUserProfile(null);
            }
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