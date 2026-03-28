'use client';
import { useState, useEffect } from 'react';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Edit2, Trash2, Loader2, Music, BookOpen, ImageIcon, Clock, Info, User } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'lyrics' | 'meaning' | 'story' | 'image'>('lyrics');
  
  // LEVEL 2: Sub-Toggles & Text Size State
  const [lyricsView, setLyricsView] = useState<'original' | 'english'>('original');
  const [meaningView, setMeaningView] = useState<'english' | 'malayalam'>('english');
  const [isLargeText, setIsLargeText] = useState(false); // NEW: Font size toggle state

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
  const isMalayalam = song.language === 'Malayalam';

  // DYNAMIC TEXT SIZING CLASSES
  const dynamicTextSize = isLargeText 
    ? 'text-2xl md:text-3xl leading-loose font-medium' 
    : 'text-lg md:text-xl leading-relaxed';
    
  const baseTextClasses = `font-sans whitespace-pre-wrap transition-all duration-300 text-slate-800 ${dynamicTextSize}`;

  return (
    <div className="min-h-screen bg-slate-50 p-6 pb-24">
      <div className="max-w-3xl mx-auto">
        
        {/* TOP BAR */}
        <div className="flex justify-between items-center mb-6">
          <Link href="/songbook" className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-slate-800 transition">
            <ArrowLeft size={16} className="mr-1" /> Back to Songbook
          </Link>
          
          <div className="flex gap-2">
            {/* NEW: FONT SIZE TOGGLE BUTTON */}
            <button 
              onClick={() => setIsLargeText(!isLargeText)} 
              className={`px-3 py-2 border rounded-lg transition shadow-sm flex items-end justify-center gap-0.5 ${isLargeText ? 'bg-sky-100 border-sky-300 text-sky-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-sky-50'}`}
              title={isLargeText ? "Make text smaller" : "Make text larger"}
            >
              <span className="text-xs font-bold leading-none">A</span>
              <span className="text-base font-bold leading-none">A</span>
            </button>

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

        {/* 1. SLEEK, COMPACT HEADER DESIGN BASED ON FEEDBACK */}
        <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200 mb-6 flex items-center gap-3">
          <div className="shrink-0 w-12 h-12 bg-sky-50 text-sky-600 font-bold text-xl rounded-xl border border-sky-100 flex items-center justify-center">
            {song.songNumber || '#'}
          </div>
          <div className="flex-1">
            <h1 className="text-lg md:text-xl font-serif font-bold text-slate-900 leading-tight mb-0.5">{song.title}</h1>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{song.language}</span>
              {song.originalAuthor && <span className="text-xs text-slate-400 truncate border-l border-slate-200 pl-2">By {song.originalAuthor}</span>}
            </div>
          </div>
        </div>

        {/* 2. COMPLETELY REDESIGNED TAB CONTAINER */}
        <div className="space-y-6">
          
          {/* LEVEL 1: Centered Pill Toggle with horizontal scrolling for mobile */}
          <div className="flex justify-center overflow-x-auto hide-scrollbar">
            <div className="inline-flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm whitespace-nowrap">
              <button onClick={() => setActiveTab('lyrics')} className={`flex items-center justify-center px-4 md:px-6 py-2.5 text-sm font-bold rounded-xl transition ${activeTab === 'lyrics' ? 'bg-sky-600 text-white shadow-inner' : 'text-slate-500 hover:text-slate-700'}`}>
                <Music size={16} className="mr-2"/> Lyrics
              </button>
              
              <button onClick={() => setActiveTab('meaning')} className={`flex items-center justify-center px-4 md:px-6 py-2.5 text-sm font-bold rounded-xl transition ${activeTab === 'meaning' ? 'bg-sky-600 text-white shadow-inner' : 'text-slate-500 hover:text-slate-700'}`}>
                <BookOpen size={16} className="mr-2"/> Meaning
              </button>

              {/* NEW CONDITIONAL STORY TAB */}
              {song.story && (
                <button onClick={() => setActiveTab('story')} className={`flex items-center justify-center px-4 md:px-6 py-2.5 text-sm font-bold rounded-xl transition ${activeTab === 'story' ? 'bg-sky-600 text-white shadow-inner' : 'text-slate-500 hover:text-slate-700'}`}>
                  <Info size={16} className="mr-2"/> Story
                </button>
              )}

              {song.imageUrl && (
                <button onClick={() => setActiveTab('image')} className={`flex items-center justify-center px-4 md:px-6 py-2.5 text-sm font-bold rounded-xl transition ${activeTab === 'image' ? 'bg-sky-600 text-white shadow-inner' : 'text-slate-500 hover:text-slate-700'}`}>
                  <ImageIcon size={16} className="mr-2"/> Original Photo
                </button>
              )}
            </div>
          </div>

          {/* LEVEL 2: Sub-Toggles & Content Area */}
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 min-h-[400px]">
            
            {/* LYRICS TAB CONTENT */}
            {activeTab === 'lyrics' && (
              <div className="animate-in fade-in slide-in-from-bottom-2">
                
                {/* LEVEL 2 TOGGLE FOR LYRICS */}
                {!isEnglish && song.transliterationEnglish && (
                  <div className="flex bg-slate-100 p-1 rounded-xl mb-8 max-w-sm mx-auto border border-slate-200">
                    <button onClick={() => setLyricsView('original')} className={`flex-1 flex items-center justify-center py-2 text-xs font-bold rounded-lg transition ${lyricsView === 'original' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500'}`}>
                      Original Script
                    </button>
                    <button onClick={() => setLyricsView('english')} className={`flex-1 flex items-center justify-center py-2 text-xs font-bold rounded-lg transition ${lyricsView === 'english' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500'}`}>
                      English Phonetics
                    </button>
                  </div>
                )}
                
                {/* APPLIED DYNAMIC FONT CLASSES (Centered) */}
                <div className={`${baseTextClasses} text-center`}>
                  {lyricsView === 'original' ? song.lyrics : (song.transliterationEnglish || song.lyrics)}
                </div>
              </div>
            )}

            {/* MEANING TAB CONTENT */}
            {activeTab === 'meaning' && (
              <div className="animate-in fade-in slide-in-from-bottom-2">
                
                {/* 3. SMART LOGIC FOR MEANING TOGGLES */}
                {isMalayalam ? (
                  <div className={`${baseTextClasses} text-center italic !text-slate-600 bg-slate-50 p-6 rounded-2xl border border-slate-100`}>
                    {song.meaningEnglish || "English meaning not available for this Malayalam song."}
                  </div>
                ) : isEnglish ? (
                  <div className={`${baseTextClasses} text-center italic !text-slate-600 bg-slate-50 p-6 rounded-2xl border border-slate-100`}>
                    {song.meaningMalayalam || "Malayalam meaning not available for this English song."}
                  </div>
                ) : (
                   <>
                    {(song.meaningEnglish || song.meaningMalayalam) ? (
                        <>
                          {/* LEVEL 2 TOGGLE FOR MEANING */}
                          <div className="flex bg-slate-100 p-1 rounded-xl mb-8 max-w-sm mx-auto border border-slate-200">
                            <button onClick={() => setMeaningView('english')} className={`flex-1 flex items-center justify-center py-2 text-xs font-bold rounded-lg transition ${meaningView === 'english' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500'}`}>
                              English
                            </button>
                            <button onClick={() => setMeaningView('malayalam')} className={`flex-1 flex items-center justify-center py-2 text-xs font-bold rounded-lg transition ${meaningView === 'malayalam' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500'}`}>
                              Malayalam
                            </button>
                          </div>
                          {/* APPLIED DYNAMIC FONT CLASSES (Centered) */}
                          <div className={`${baseTextClasses} text-center italic !text-slate-600 bg-slate-50 p-6 rounded-2xl border border-slate-100`}>
                            {meaningView === 'english' ? (song.meaningEnglish || "English meaning not available.") : (song.meaningMalayalam || "Malayalam meaning not available.")}
                          </div>
                        </>
                      ) : (
                         <p className="text-center text-slate-400 italic py-10">No meaning generated for this song yet.</p>
                      )}
                    </>
                )}
              </div>
            )}

            {/* NEW STORY TAB CONTENT */}
            {activeTab === 'story' && song.story && (
              <div className="animate-in fade-in slide-in-from-bottom-2">
                 <div className="bg-slate-50 p-6 md:p-8 rounded-2xl border border-slate-100 text-left">
                  <h3 className="text-lg font-serif font-bold text-slate-800 mb-4 flex items-center">
                    <Info size={20} className="mr-2 text-sky-500"/> The Story Behind the Song
                  </h3>
                  {/* APPLIED DYNAMIC FONT CLASSES (Left Aligned) */}
                  <div className={`${baseTextClasses} text-left`}>{song.story}</div>
                </div>
              </div>
            )}

            {/* IMAGE TAB CONTENT */}
            {activeTab === 'image' && song.imageUrl && (
              <div className="animate-in fade-in slide-in-from-bottom-2">
                <img src={song.imageUrl} alt={`Original sheet music for ${song.title}`} className="w-full h-auto rounded-xl border border-slate-200 shadow-sm" />
              </div>
            )}
          </div>
        </div>

        {/* FOOTER (Audit Trail) */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 mt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2 shadow-sm">
          <span className="font-medium text-slate-500">Last updated by: <span className="text-slate-700 font-bold">{song.authorName || 'Unknown'}</span></span>
          <span className="flex items-center"><Clock size={12} className="mr-1" /> {formatIST(song.updatedAt || song.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}