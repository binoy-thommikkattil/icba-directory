'use client';
import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import Link from 'next/link';
import { ArrowLeft, Droplet, Phone, MessageCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function BloodRegistryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [families, setFamilies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterGroup, setFilterGroup] = useState<string>('All');

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    // Only pull active families to ensure the phone numbers are current
    const q = query(collection(db, 'members'), where('isPendingCreation', '==', false), where('status', '==', 'Active'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setFamilies(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  // Extract all individuals who have a blood group AND explicitly checked "willing to donate"
  const donors = useMemo(() => {
    let list: any[] = [];
    families.forEach(family => {
      family.members?.forEach((ind: any) => {
        if (ind.bloodGroup && ind.willingToDonate) {
          list.push({ ...ind, familyName: family.familyName, primaryMobile: family.primaryMobile });
        }
      });
    });
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [families]);

  // Unique blood groups for the filter buttons
  const availableGroups = useMemo(() => {
    const groups = new Set(donors.map(d => d.bloodGroup));
    return ['All', ...Array.from(groups).sort()];
  }, [donors]);

  const filteredDonors = filterGroup === 'All' ? donors : donors.filter(d => d.bloodGroup === filterGroup);

  if (authLoading || isLoading || !user) return <div className="p-8 text-center text-slate-500">Loading registry...</div>;

  return (
    <div className="p-6 min-h-screen bg-slate-50">
      <Link href="/dashboard" className="mb-6 inline-flex items-center text-sm font-bold text-slate-500 hover:text-slate-800 transition">
        <ArrowLeft size={16} className="mr-1" /> Back to Dashboard
      </Link>

      <div className="mb-6">
        <h1 className="text-3xl font-serif font-bold text-slate-900 mb-2 flex items-center">
          <Droplet size={28} className="text-red-500 mr-2" /> Blood Registry
        </h1>
        <p className="text-slate-500 text-sm">Members actively willing to donate in emergencies.</p>
      </div>

      {/* OVAL FILTER BUTTONS */}
      <div className="flex flex-wrap gap-2 mb-6">
        {availableGroups.map(group => (
          <button
            key={group as string}
            onClick={() => setFilterGroup(group as string)}
            className={`px-4 py-2 rounded-full text-sm font-bold border transition ${filterGroup === group
                ? 'bg-red-500 text-white border-red-600 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:border-red-300'
              }`}
          >
            {group as string}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredDonors.length === 0 && (
          <p className="text-slate-500 text-center py-10 bg-white rounded-2xl border border-slate-200">No donors found for this selection.</p>
        )}

        {filteredDonors.map((donor, idx) => {
          const rawPhone = donor.mobile || donor.primaryMobile;
          const sanitizedPhone = rawPhone?.replace(/\D/g, '');

          return (
            <div key={idx} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg text-slate-900">{donor.name}</h3>
                  <p className="text-sm text-slate-500 font-medium">{donor.familyName}</p>
                </div>
                <span className="bg-red-50 text-red-600 font-bold px-3 py-1 rounded-full border border-red-100 text-sm">
                  {donor.bloodGroup}
                </span>
              </div>

              {donor.primaryMobile && (
                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <a href={`tel:${sanitizedPhone}`} className="flex-1 flex justify-center items-center bg-slate-100 text-slate-700 py-2.5 rounded-xl font-bold hover:bg-slate-200 transition">
                    <Phone size={16} className="mr-2" /> Call
                  </a>
                  <a href={`https://wa.me/${sanitizedPhone}`} target="_blank" rel="noopener noreferrer" className="flex-1 flex justify-center items-center bg-green-50 text-green-700 border border-green-200 py-2.5 rounded-xl font-bold hover:bg-green-100 transition">
                    <MessageCircle size={16} className="mr-2" /> WhatsApp
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}