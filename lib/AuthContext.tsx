'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, User, signOut as firebaseSignOut } from 'firebase/auth';
// WE ADDED onSnapshot HERE
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
    let unsubscribeSnapshot: () => void; // Variable to hold our live database listener

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const userDocRef = doc(db, 'users', firebaseUser.uid);

        // 1. THE INITIAL CHECK (Exactly as you had it)
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setRole(userDoc.data().role);
          setUserProfile(userDoc.data());
        } else {
          // It's a brand new user, let's create their profile
          const isAutoAdmin = firebaseUser.email?.toLowerCase().includes('admin');
          const initialRole = isAutoAdmin ? 'admin' : 'pending';
          const newProfile = {
            email: firebaseUser.email,
            name: firebaseUser.displayName || 'Unknown Member',
            role: initialRole,
            createdAt: new Date().toISOString()
          };
          await setDoc(userDocRef, newProfile);
          setRole(initialRole);
          setUserProfile(newProfile);
        }
        setLoading(false);

        // 2. THE REAL-TIME WATCHER (The new upgrade!)
        // This actively listens to their document while they are using the app
        unsubscribeSnapshot = onSnapshot(userDocRef, (snap) => {
          if (!snap.exists()) {
            // THE AUTO-KICK: An admin just deleted their profile! Log them out instantly.
            firebaseSignOut(auth);
            setUser(null);
            setRole(null);
            setUserProfile(null);
          } else {
            // THE INSTANT UPDATE: If an admin changes their role, update the app instantly!
            setRole(snap.data().role);
            setUserProfile(snap.data());
          }
        });

      } else {
        // User is fully logged out
        setUser(null); 
        setRole(null); 
        setUserProfile(null);
        setLoading(false);
        if (unsubscribeSnapshot) unsubscribeSnapshot(); // Clean up the listener
      }
    });

    // Clean up both listeners when the app closes
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