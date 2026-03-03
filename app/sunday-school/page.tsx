'use client';
import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import Link from 'next/link';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SundaySchoolPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [families, setFamilies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'members'), where('isPendingCreation', '==', false), where('status', '==', 'Active'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setFamilies(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  // Find anyone with "Sunday School" (or similar) in their custom tags
  const participants = useMemo(() => {
    let list: any[] = [];
    families.forEach(family => {
      family.members?.forEach((ind: any) => {
        if (ind.tags && ind.tags.length > 0) {
          const isSundaySchool = ind.tags.some((t: string) => t.toLowerCase().includes('sunday school'));
          if (isSundaySchool) {
            list.push({ ...ind, familyName: family.familyName });
          }
        }
      });
    });
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [families]);

  if (authLoading || isLoading || !user) return <div className="p-8 text-center text-slate-500">Loading records...</div>;

  return (
    <div className="p-6 min-h-screen bg-slate-50">
      <Link href="/" className="mb-6 inline-flex items-center text-sm font-bold text-slate-500 hover:text-slate-800 transition">
        <ArrowLeft size={16} className="mr-1" /> Back to Dashboard
      </Link>
      
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-slate-900 mb-2 flex items-center">
          <BookOpen size={28} className="text-indigo-500 mr-3" /> Sunday School
        </h1>
        <p className="text-slate-500 text-sm">Directory of students and teachers.</p>
      </div>

      <div className="space-y-4">
        {participants.length === 0 && (
          <p className="text-slate-500 text-center py-10 bg-white rounded-2xl border border-slate-200">No active Sunday School members found. Add tags like "Sunday School Student" to member profiles.</p>
        )}

        {participants.map((person, idx) => (
          <div key={idx} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-lg text-slate-900 mb-0.5">{person.name}</h3>
            <p className="text-sm text-slate-500 mb-3">{person.familyName}</p>
            
            <div className="flex flex-wrap gap-2">
              {person.tags.map((tag: string) => (
                <span key={tag} className="text-xs font-bold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md border border-indigo-100">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}