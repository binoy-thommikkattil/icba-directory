'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, User, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  role: 'admin' | 'approved' | 'pending' | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<'admin' | 'approved' | 'pending' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        
        // 1. Check if user exists in our Firestore 'users' collection
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          // User exists, grab their assigned role
          setRole(userDoc.data().role as 'admin' | 'approved' | 'pending');
        } else {
          // 2. BRAND NEW USER! Save them to database as 'pending'
          // We will also automatically make anyone with 'admin' in their email an admin for safety
          const isAutoAdmin = firebaseUser.email?.toLowerCase().includes('admin');
          const initialRole = isAutoAdmin ? 'admin' : 'pending';
          
          await setDoc(userDocRef, {
            email: firebaseUser.email,
            name: firebaseUser.displayName || 'Unknown',
            photoURL: firebaseUser.photoURL || '',
            role: initialRole,
            createdAt: new Date().toISOString()
          });
          
          setRole(initialRole);
        }
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);