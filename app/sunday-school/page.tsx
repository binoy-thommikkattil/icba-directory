'use client';
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import SubDirectory from '@/components/SubDirectory';
// ADDED: ShieldAlert for the denied screen
import { Loader2, ShieldAlert } from 'lucide-react';

export default function SundaySchoolPage() {
  // 1. Pull in the user profile and role
  const { user, userProfile, role, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [taggedMembers, setTaggedMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // 2. New state to control page visibility
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    // Wait until we know who is logged in before checking access
    if (!user || authLoading) return;
    
    // Fetch active families only
    const q = query(collection(db, 'members'), where('isPendingCreation', '==', false), where('status', '==', 'Active'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Added "as any" to prevent TypeScript property errors
      const allFamilies = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      let matches: any[] = [];
      let userIsInDirectory = false;

      allFamilies.forEach(family => {
        // Check if the current user is the one who submitted this family profile
        const isMyFamily = family.submittedBy === userProfile?.name || family.authorEmail === user?.email;

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

              // 3. THE SECURITY CHECK: Do they match the name, or own the family?
              if (member.name?.toLowerCase() === userProfile?.name?.toLowerCase() || isMyFamily) {
                  userIsInDirectory = true;
              }
            }
          }
        });
      });

      // 4. DECISION: Grant access if they are an admin OR belong to this specific group
      if (role === 'admin' || userIsInDirectory) {
          setHasAccess(true);
      } else {
          setHasAccess(false);
      }

      // Deduplicate individuals in case someone accidentally added them twice
      const uniqueMatches = matches.filter((ind, index, self) =>
        index === self.findIndex((m) => m.name.toLowerCase() === ind.name.toLowerCase())
      );

      setTaggedMembers(uniqueMatches.sort((a, b) => a.name.localeCompare(b.name)));
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [user, authLoading, role, userProfile]);

  if (authLoading || isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">
        <Loader2 className="animate-spin mr-2" /> Loading records...
      </div>
    );
  }

  // 5. THE ACCESS DENIED SCREEN
  if (!hasAccess) {
      return (
          <div className="flex flex-col min-h-screen items-center justify-center p-6 text-center bg-slate-50 pb-20">
              <ShieldAlert size={56} className="text-slate-300 mb-4" />
              <h1 className="text-2xl font-serif font-bold text-slate-900 mb-2">Access Denied</h1>
              <p className="text-slate-500 mb-8 max-w-sm text-sm">
                  This directory is private. You must be an admin or a member of this group to view its contents and notices.
              </p>
              <button 
                  onClick={() => router.push('/')} 
                  className="px-6 py-3 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 transition shadow-sm"
              >
                  Return to Dashboard
              </button>
          </div>
      );
  }

  // 6. IF APPROVED, SHOW THE PAGE NORMALLY
  return (
    <SubDirectory 
      pageTitle="Sunday School" 
      pageDescription="Directory and Noticeboard for students and teachers. To add a member here, ensure they have the 'Sunday School' tag in their profile." 
      category="sunday-school" 
      members={taggedMembers} 
    />
  );
}