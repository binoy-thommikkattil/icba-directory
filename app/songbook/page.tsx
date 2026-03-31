'use client';
import { useState, useEffect } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import Link from 'next/link';
import { ArrowLeft, Search, Plus, Music, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SongbookHub() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [songs, setSongs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeLanguage, setActiveLanguage] = useState('All');

  const languages = ['All', 'Malayalam', 'English', 'Tamil', 'Kannada', 'Hindi'];

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'songs'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedSongs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      
      // 1. Sort the songs alphabetically first
      fetchedSongs.sort((a: any, b: any) => {
        const titleA = (a.title || '').toLowerCase();
        const titleB = (b.title || '').toLowerCase();
        return titleA.localeCompare(titleB);
      });
      
      // 2. Assign a beautiful sequential number based on their alphabetical position
      const visuallyNumberedSongs = fetchedSongs.map((song, index) => ({
        ...song,
        displayNumber: index + 1
      }));
      
      setSongs(visuallyNumberedSongs);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const filteredSongs = songs.filter(song => {
    // 3. Update the search to filter by the new dynamic 'displayNumber'
    const matchesSearch = 
      (song.displayNumber && song.displayNumber.toString().includes(searchTerm)) || 
      (song.title && song.title.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesLanguage = activeLanguage === 'All' || song.language === activeLanguage;
    return matchesSearch && matchesLanguage;
  });

  if (authLoading || isLoading) return <div className="flex min-h-screen items-center justify-center text-slate-500"><Loader2 className="animate-spin mr-2" /> Loading Songbook...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-6 pb-24">
      <div className="max-w-3xl mx-auto">
        <Link href="/dashboard" className="mb-6 inline-flex items-center text-sm font-bold text-slate-500 hover:text-slate-800 transition">
          <ArrowLeft size={16} className="mr-1" /> Back to Dashboard
        </Link>
        
        <div className="flex justify-between items-end mb-6">
          <div>
            <h1 className="text-3xl font-serif font-bold text-slate-900 mb-2 flex items-center">
              <Music className="mr-3 text-sky-600" size={32} />
              Songbook
            </h1>
            <p className="text-slate-500 text-sm">Search by number or title</p>
          </div>
          <Link href="/songbook/add" className="bg-sky-50 text-sky-700 border border-sky-200 px-4 py-2 rounded-xl text-sm font-bold hover:bg-sky-100 transition flex items-center shadow-sm">
            <Plus size={16} className="mr-1" /> Add Song
          </Link>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
          <input type="text" placeholder="Type a song number (e.g. 42) or title..." className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-sm font-medium" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {languages.map(lang => (
            <button
              key={lang}
              onClick={() => setActiveLanguage(lang)}
              className={`px-4 py-2 rounded-full text-sm font-bold transition shadow-sm ${
                activeLanguage === lang 
                  ? 'bg-sky-600 text-white' 
                  : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filteredSongs.length > 0 ? (
            filteredSongs.map((song) => (
              <Link href={`/songbook/${song.id}`} key={song.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:border-sky-400 transition flex items-center gap-4 group">
                <div className="w-12 h-12 shrink-0 bg-sky-50 text-sky-600 font-bold text-lg rounded-xl flex items-center justify-center border border-sky-100">
                  {song.displayNumber}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-serif font-bold text-lg text-slate-900 truncate">{song.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md uppercase tracking-wider">{song.language || 'Unknown'}</span>
                    {song.originalAuthor && <span className="text-xs text-slate-400 truncate border-l border-slate-200 pl-2">By {song.originalAuthor}</span>}
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <Music size={32} className="text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium text-sm">No songs found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}