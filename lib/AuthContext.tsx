'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, User, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';

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

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        
        let hasProfileExisted = false; 

        // THE FIX: AuthContext no longer creates profiles. It just passively watches.
        unsubscribeSnapshot = onSnapshot(userDocRef, (snap) => {
          if (snap.exists()) {
            hasProfileExisted = true; 
            setRole(snap.data().role);
            setUserProfile(snap.data());
            setLoading(false); 
          } else {
            // Profile doesn't exist yet.
            if (hasProfileExisted) {
              // It existed but disappeared. Admin deleted them! Auto-kick.
              firebaseSignOut(auth);
              setUser(null); setRole(null); setUserProfile(null);
            } else {
              // They are a brand new user currently typing their name on the Login page.
              // Just sit back and let Login.tsx finish its job!
              setRole(null);
              setUserProfile(null);
              setLoading(false); 
            }
          }
        });

      } else {
        setUser(null); setRole(null); setUserProfile(null);
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