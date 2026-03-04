'use client';
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import SubDirectory from '@/components/SubDirectory';
import { Loader2 } from 'lucide-react';

export default function BachelorsPage() {
    const [taggedMembers, setTaggedMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, 'members'), where('isPendingCreation', '==', false));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const allFamilies = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
            let matches: any[] = [];

            allFamilies.forEach(family => {
                if (family.status === 'Inactive') return;
                family.members?.forEach((member: any) => {
                    // Check if this member has the required tags
                    const hasTag = member.tags?.some((t: string) => {
                        const tag = t.toLowerCase();
                        return tag.includes('bachelor') || tag.includes('spinster');
                    });

                    if (hasTag) {
                        matches.push({
                            familyId: family.id,
                            familyName: family.familyName,
                            name: member.name,
                            fullFamilyData: { id: family.id, ...family } // Required for DirectoryCard
                        });
                    }
                });
            });

            // Deduplicate names
            const uniqueMatches = matches.filter((ind, index, self) =>
                index === self.findIndex((m) => m.name.toLowerCase() === ind.name.toLowerCase())
            );

            setTaggedMembers(uniqueMatches.sort((a, b) => a.name.localeCompare(b.name)));
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    if (loading) return <div className="flex min-h-screen items-center justify-center text-slate-500"><Loader2 className="animate-spin" /></div>;

    return (
        <SubDirectory
            pageTitle="Bachelors & Spinsters"
            pageDescription="Members currently tagged as 'bachelor' or 'spinster'."
            category="bachelors"
            members={taggedMembers}
        />
    );
}