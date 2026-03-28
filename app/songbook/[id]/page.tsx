'use client';
import { useState, useEffect } from 'react';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Edit2, Trash2, Loader2, Music, BookOpen, ImageIcon, Clock, Info } from 'lucide-react';

// Helper for exact IST Time
const formatIST = (isoString: string) => {
  if (!isoString) return 'N/A';
  return new Date(isoString).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  });
};

export default function ViewSongPage() {
  const { user, role, loading: authLoading } = useAuth();
  const params = useParams();
  const router = useRouter();
  
  const [song, setSong] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // LEVEL 1: Main Tabs
  const [activeTab, setActiveTab] = useState<'lyrics' | 'meaning' | 'image'>('lyrics');
  
  // LEVEL 2: Sub-Toggles
  const [lyricsView, setLyricsView] = useState<'original' | 'english'>('original');
  const [meaningView, setMeaningView] = useState<'english' | 'malayalam'>('english');

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchSong = async () => {
      if (!params.id) return;
      try {
        const docRef = doc(db, 'songs', params.id as string);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setSong({ id: docSnap.id, ...docSnap.data() });
        } else {
          alert("Song not found!");
          router.push('/songbook');
        }
      } catch (error) {
        console.error("Error fetching song:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSong();
  }, [params.id]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to permanently delete this song?")) return;
    try {
      await deleteDoc(doc(db, 'songs', song.id));
      router.push('/songbook');
    } catch (error) {
      console.error("Error deleting song:", error);
      alert("Failed to delete song.");
    }
  };

  if (authLoading || isLoading) return <div className="flex min-h-screen items-center justify-center text-slate-500"><Loader2 className="animate-spin mr-2" /> Loading Song...</div>;
  if (!song) return null;

  const isAdmin = role === 'admin';
  const isEnglish = song.language === 'English';

  return (
    <div className="min-h-screen bg-slate-50 p-6 pb-24">
      <div className="max-w-3xl mx-auto">
        
        {/* TOP BAR */}
        <div className="flex justify-between items-center mb-6">
          <Link href="/songbook" className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-slate-800 transition">
            <ArrowLeft size={16} className="mr-1" /> Back
          </Link>
          
          <div className="flex gap-2">
            {/* EVERYONE CAN EDIT */}
            <Link href={`/songbook/${song.id}/edit`} className="p-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-sky-50 hover:text-sky-600 hover:border-sky-200 transition shadow-sm">
              <Edit2 size={18} />
            </Link>
            {/* ONLY ADMIN CAN DELETE */}
            {isAdmin && (
              <button onClick={handleDelete} className="p-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition shadow-sm">
                <Trash2 size={18} />
              </button>
            )}
          </div>
        </div>

        {/* HEADER */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 mb-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-sky-50 text-sky-600 font-bold text-xl rounded-xl border border-sky-100 mb-4">
            {song.songNumber || '#'}
          </div>
          <h1 className="text-3xl font-serif font-bold text-slate-900 mb-2 leading-tight">{song.title}</h1>
          <span className="inline-block px-3 py-1 bg-slate-100 text-slate-500 font-bold text-xs uppercase tracking-widest rounded-full">
            {song.language}
          </span>
        </div>

        {/* THE TWO-LEVEL INTERFACE */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          
          {/* LEVEL 1: MAIN TABS */}
          <div className="flex border-b border-slate-100 bg-slate-50/50">
            <button onClick={() => setActiveTab('lyrics')} className={`flex-1 py-4 text-sm font-bold border-b-2 flex justify-center items-center transition ${activeTab === 'lyrics' ? 'border-sky-600 text-sky-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              <Music size={16} className="mr-2"/> Lyrics
            </button>
            <button onClick={() => setActiveTab('meaning')} className={`flex-1 py-4 text-sm font-bold border-b-2 flex justify-center items-center transition ${activeTab === 'meaning' ? 'border-sky-600 text-sky-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              <BookOpen size={16} className="mr-2"/> Meaning
            </button>
            {song.imageUrl && (
              <button onClick={() => setActiveTab('image')} className={`flex-1 py-4 text-sm font-bold border-b-2 flex justify-center items-center transition ${activeTab === 'image' ? 'border-sky-600 text-sky-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                <ImageIcon size={16} className="mr-2"/> Original
              </button>
            )}
          </div>

          <div className="p-6 md:p-8">
            
            {/* LYRICS TAB CONTENT */}
            {activeTab === 'lyrics' && (
              <div className="animate-in fade-in slide-in-from-bottom-2">
                {/* LEVEL 2: LYRICS TOGGLE (Hidden if English) */}
                {!isEnglish && song.transliterationEnglish && (
                  <div className="flex bg-slate-100 p-1 rounded-xl mb-6 max-w-sm mx-auto">
                    <button onClick={() => setLyricsView('original')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${lyricsView === 'original' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500'}`}>
                      {song.language} Script
                    </button>
                    <button onClick={() => setLyricsView('english')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${lyricsView === 'english' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500'}`}>
                      English Phonetics
                    </button>
                  </div>
                )}
                
                <div className="text-slate-700 text-lg leading-relaxed whitespace-pre-wrap font-medium text-center">
                  {lyricsView === 'original' ? song.lyrics : (song.transliterationEnglish || song.lyrics)}
                </div>
              </div>
            )}

            {/* MEANING TAB CONTENT */}
            {activeTab === 'meaning' && (
              <div className="animate-in fade-in slide-in-from-bottom-2">
                {/* LEVEL 2: MEANING TOGGLE */}
                {(song.meaningEnglish || song.meaningMalayalam) ? (
                  <>
                    <div className="flex bg-slate-100 p-1 rounded-xl mb-6 max-w-sm mx-auto">
                      <button onClick={() => setMeaningView('english')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${meaningView === 'english' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500'}`}>
                        English
                      </button>
                      <button onClick={() => setMeaningView('malayalam')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${meaningView === 'malayalam' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500'}`}>
                        Malayalam
                      </button>
                    </div>
                    <div className="text-slate-600 leading-relaxed text-center italic bg-slate-50 p-6 rounded-2xl border border-slate-100">
                      {meaningView === 'english' ? (song.meaningEnglish || "English meaning not available.") : (song.meaningMalayalam || "Malayalam meaning not available.")}
                    </div>
                  </>
                ) : (
                   <p className="text-center text-slate-400 italic py-10">No meaning generated for this song yet.</p>
                )}

                {/* STORY BEHIND THE SONG */}
                {song.story && (
                  <div className="mt-8 pt-8 border-t border-slate-100 text-left">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center">
                      <Info size={16} className="mr-2 text-sky-500"/> The Story Behind the Song
                    </h3>
                    <p className="text-slate-600 text-sm leading-relaxed">{song.story}</p>
                  </div>
                )}
              </div>
            )}

            {/* IMAGE TAB CONTENT */}
            {activeTab === 'image' && song.imageUrl && (
              <div className="animate-in fade-in slide-in-from-bottom-2">
                <img src={song.imageUrl} alt={`Original sheet music for ${song.title}`} className="w-full h-auto rounded-xl border border-slate-200" />
              </div>
            )}

          </div>

          {/* FOOTER (Audit Trail) */}
          <div className="bg-slate-50 border-t border-slate-100 p-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
            <span className="font-medium text-slate-500">Last updated by: <span className="text-slate-700 font-bold">{song.authorName || 'Unknown'}</span></span>
            <span className="flex items-center"><Clock size={12} className="mr-1" /> {formatIST(song.updatedAt || song.createdAt)}</span>
          </div>
          
        </div>
      </div>
    </div>
  );
}