'use client';
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import SubDirectory from '@/components/SubDirectory';
import { Loader2 } from 'lucide-react';

export default function SundaySchoolPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [taggedMembers, setTaggedMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    
    // Fetch active families only
    const q = query(collection(db, 'members'), where('isPendingCreation', '==', false), where('status', '==', 'Active'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Added "as any" to prevent TypeScript property errors
      const allFamilies = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      let matches: any[] = [];

      allFamilies.forEach(family => {
        family.members?.forEach((member: any) => {
          if (member.tags && member.tags.length > 0) {
            // Find anyone with "Sunday School" in their custom tags
            const isSundaySchool = member.tags.some((t: string) => t.toLowerCase().includes('sunday school'));
            
            if (isSundaySchool) {
              matches.push({
                familyId: family.id,
                familyName: family.familyName,
                name: member.name,
                // fullFamilyData is required so the DirectoryCard can open properly
                fullFamilyData: { id: family.id, ...family } 
              });
            }
          }
        });
      });

      // Deduplicate individuals in case someone accidentally added them twice
      const uniqueMatches = matches.filter((ind, index, self) =>
        index === self.findIndex((m) => m.name.toLowerCase() === ind.name.toLowerCase())
      );

      setTaggedMembers(uniqueMatches.sort((a, b) => a.name.localeCompare(b.name)));
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  if (authLoading || isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">
        <Loader2 className="animate-spin mr-2" /> Loading records...
      </div>
    );
  }

  return (
    <SubDirectory 
      pageTitle="Sunday School" 
      pageDescription="Directory and Noticeboard for students and teachers. To add a member here, ensure they have the 'Sunday School' tag in their profile." 
      category="sunday-school" 
      members={taggedMembers} 
    />
  );
}