'use client';
import { useState } from 'react';
import DirectoryCard from '@/components/DirectoryCard';
import { Search, ArrowLeft, Users } from 'lucide-react';
import Link from 'next/link';

// We pass the pre-filtered members and page title in as props
export default function SubDirectory({ pageTitle, members, pageDescription }: { pageTitle: string, members: any[], pageDescription: string }) {
  const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Apply search filter locally
  const filteredMembers = members.filter(ind =>
    ind.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ind.familyName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedFamilyData = members.find(f => f.familyId === selectedFamilyId);

  return (
    <main className="w-full relative overflow-hidden bg-slate-50 min-h-screen">
      {selectedFamilyId === null ? (
        <div className="p-6 pb-24 max-w-2xl mx-auto">
          <Link href="/" className="mb-6 inline-flex items-center text-sm font-bold text-slate-500 hover:text-slate-800 transition">
            <ArrowLeft size={16} className="mr-1" /> Back to Dashboard
          </Link>

          <h1 className="text-3xl font-serif font-bold text-slate-900 mb-2">{pageTitle}</h1>
          <p className="text-sm text-slate-500 mb-8">{pageDescription}</p>

          <div className="relative mb-6">
            <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by name..."
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            {filteredMembers.length > 0 ? (
              filteredMembers.map((ind, index) => (
                <button
                  key={`${ind.familyId}-${index}`}
                  onClick={() => setSelectedFamilyId(ind.familyId)}
                  className="w-full bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:border-teal-400 transition flex items-center gap-4 text-left"
                >
                  <div className="w-10 h-10 shrink-0 bg-teal-50 text-teal-600 font-bold text-base rounded-full flex items-center justify-center border border-teal-100 uppercase">
                     {ind.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-lg text-slate-900 truncate">{ind.name}</h3>
                    <p className="text-xs text-slate-500 truncate">Family: {ind.familyName}</p>
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-10 bg-white rounded-xl border border-slate-200">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users size={24} className="text-slate-400" />
                </div>
                <p className="text-slate-500 font-medium">No members found matching this tag.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-3xl mx-auto md:p-8">
          <button onClick={() => setSelectedFamilyId(null)} className="m-4 px-4 py-2 flex items-center text-slate-600 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50">
            <ArrowLeft size={16} className="mr-2" /> Back to List
          </button>
          {/* We pass the full family payload needed for the card render */}
          <DirectoryCard {...selectedFamilyData?.fullFamilyData} />
        </div>
      )}
    </main>
  );
}