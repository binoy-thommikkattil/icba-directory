'use client';
import { useState, useEffect, useMemo } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import Link from 'next/link';
import { ArrowLeft, Search, Plus, Music, Loader2, User } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SongbookHub() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [songs, setSongs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeLanguage, setActiveLanguage] = useState('All');
  
  const [viewMode, setViewMode] = useState<'songs' | 'authors'>('songs');
  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'songs'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedSongs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      
      fetchedSongs.sort((a: any, b: any) => {
        const titleA = (a.title || '').toLowerCase();
        const titleB = (b.title || '').toLowerCase();
        return titleA.localeCompare(titleB);
      });
      
      const visuallyNumberedSongs = fetchedSongs.map((song, index) => ({
        ...song,
        displayNumber: index + 1
      }));
      
      setSongs(visuallyNumberedSongs);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  // Dynamically generate the language filters based ONLY on songs that exist
  const availableLanguages = useMemo(() => {
    const uniqueLangs = new Set<string>();
    songs.forEach(song => {
      if (song.language && song.language.trim() !== '' && song.language !== 'Auto-Detect' && song.language !== 'Unknown') {
        uniqueLangs.add(song.language);
      }
    });
    return ['All', ...Array.from(uniqueLangs).sort()];
  }, [songs]);

  const authorsList = useMemo(() => {
    const authorsMap = new Map<string, number>();
    songs.forEach(song => {
      if (song.originalAuthor) {
        const count = authorsMap.get(song.originalAuthor) || 0;
        authorsMap.set(song.originalAuthor, count + 1);
      }
    });
    return Array.from(authorsMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [songs]);

  const filteredSongs = songs.filter(song => {
    const matchesSearch = 
      (song.displayNumber && song.displayNumber.toString().includes(searchTerm)) || 
      (song.title && song.title.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesLanguage = activeLanguage === 'All' || song.language === activeLanguage;
    const matchesAuthor = selectedAuthor ? song.originalAuthor === selectedAuthor : true;
    
    return matchesSearch && matchesLanguage && matchesAuthor;
  });

  // FIXED: Reset invisible filters when an author is clicked
  const handleAuthorClick = (authorName: string) => {
    setSelectedAuthor(authorName);
    setActiveLanguage('All'); // Clear hidden language filter
    setSearchTerm('');        // Clear hidden text search
    setViewMode('songs');
  };

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
            <p className="text-slate-500 text-sm">Library of assembly hymns & choruses</p>
          </div>
          <Link href="/songbook/add" className="bg-sky-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-sky-700 transition flex items-center shadow-md">
            <Plus size={16} className="mr-1.5" /> Add Song
          </Link>
        </div>

        <div className="flex bg-slate-200/60 p-1 rounded-xl mb-6">
          <button 
            onClick={() => { setViewMode('songs'); setSelectedAuthor(null); }} 
            className={`flex-1 flex items-center justify-center py-2.5 text-sm font-bold rounded-lg transition ${viewMode === 'songs' && !selectedAuthor ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Music size={16} className="mr-2" /> All Songs
          </button>
          <button 
            onClick={() => setViewMode('authors')} 
            className={`flex-1 flex items-center justify-center py-2.5 text-sm font-bold rounded-lg transition ${viewMode === 'authors' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <User size={16} className="mr-2" /> Authors Index
          </button>
        </div>

        {viewMode === 'authors' ? (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            {authorsList.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {authorsList.map((author, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => handleAuthorClick(author.name)}
                    className="w-full text-left p-4 hover:bg-sky-50 transition flex justify-between items-center group"
                  >
                    <span className="font-bold text-slate-800 group-hover:text-sky-700">{author.name}</span>
                    <span className="text-xs font-bold bg-slate-100 text-slate-500 px-3 py-1 rounded-full group-hover:bg-sky-200 group-hover:text-sky-800 transition">
                      {author.count} {author.count === 1 ? 'Song' : 'Songs'}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500">No authors found.</div>
            )}
          </div>
        ) : (
          <>
            <div className="relative mb-6">
              <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder={selectedAuthor ? `Search in ${selectedAuthor}'s songs...` : "Type a song number (e.g. 42) or title..."} 
                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-sm font-medium" 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
            </div>

            {selectedAuthor && (
              <div className="mb-6 flex items-center justify-between bg-sky-50 p-4 rounded-xl border border-sky-100">
                <span className="text-sky-800 font-medium text-sm flex items-center">
                  <User size={16} className="mr-2 opacity-70" /> Showing songs by <strong>&nbsp;{selectedAuthor}</strong>
                </span>
                <button onClick={() => setSelectedAuthor(null)} className="text-xs font-bold text-sky-600 hover:text-sky-800 bg-white px-3 py-1.5 rounded-lg shadow-sm">
                  Clear Filter
                </button>
              </div>
            )}

            {!selectedAuthor && (
              <div className="flex flex-wrap gap-2 mb-6">
                {availableLanguages.map(lang => (
                  <button
                    key={lang}
                    onClick={() => setActiveLanguage(lang)}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition shadow-sm ${
                      activeLanguage === lang 
                        ? 'bg-sky-600 text-white' 
                        : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-3">
              {filteredSongs.length > 0 ? (
                filteredSongs.map((song) => (
                  <Link href={`/songbook/${song.id}`} key={song.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:border-sky-400 transition flex items-center gap-4 group">
                    <div className="w-12 h-12 shrink-0 bg-sky-50 text-sky-600 font-bold text-lg rounded-xl flex items-center justify-center border border-sky-100">
                      {song.displayNumber}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-serif font-bold text-lg text-slate-900 truncate pr-4">{song.title}</h3>
                      </div>
                      <div className="flex justify-between items-center w-full">
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md uppercase tracking-wider">{song.language || 'Unknown'}</span>
                        {song.originalAuthor && (
                          <span className="text-xs font-medium text-slate-400 italic">
                            By {song.originalAuthor}
                          </span>
                        )}
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
          </>
        )}
      </div>
    </div>
  );
}