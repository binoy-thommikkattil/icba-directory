'use client';
import { useState, useEffect } from 'react';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Edit2, Trash2, Loader2, Music, BookOpen, ImageIcon, Clock, Info } from 'lucide-react';

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

  const [activeTab, setActiveTab] = useState<'lyrics' | 'meaning' | 'story' | 'image'>('lyrics');
  
  // UPDATED: Added Malayalam to the view toggle
  const [lyricsView, setLyricsView] = useState<'original' | 'english' | 'malayalam'>('original');
  const [meaningView, setMeaningView] = useState<'english' | 'malayalam'>('english');
  const [isLargeText, setIsLargeText] = useState(false); 

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

  const dynamicTextSize = isLargeText 
    ? 'text-2xl md:text-3xl leading-loose font-medium' 
    : 'text-lg md:text-xl leading-relaxed';
    
  const baseTextClasses = `font-sans whitespace-pre-wrap transition-all duration-300 text-slate-800 ${dynamicTextSize}`;

  return (
    <div className="min-h-screen bg-slate-50 p-6 pb-24">
      <div className="max-w-3xl mx-auto">
        
        <div className="flex justify-between items-center mb-6">
          <Link href="/songbook" className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-slate-800 transition">
            <ArrowLeft size={16} className="mr-1" /> Back to Songbook
          </Link>
          
          <div className="flex gap-2">
            <button 
              onClick={() => setIsLargeText(!isLargeText)} 
              className={`px-3 py-2 border rounded-lg transition shadow-sm flex items-end justify-center gap-0.5 ${isLargeText ? 'bg-sky-100 border-sky-300 text-sky-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-sky-50'}`}
              title={isLargeText ? "Make text smaller" : "Make text larger"}
            >
              <span className="text-xs font-bold leading-none">A</span>
              <span className="text-base font-bold leading-none">A</span>
            </button>

            <Link href={`/songbook/${song.id}/edit`} className="p-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-sky-50 hover:text-sky-600 hover:border-sky-200 transition shadow-sm">
              <Edit2 size={18} />
            </Link>
            {isAdmin && (
              <button onClick={handleDelete} className="p-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition shadow-sm">
                <Trash2 size={18} />
              </button>
            )}
          </div>
        </div>

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

        <div className="space-y-6">
          <div className="flex justify-center overflow-x-auto hide-scrollbar">
            <div className="inline-flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm whitespace-nowrap">
              <button onClick={() => setActiveTab('lyrics')} className={`flex items-center justify-center px-4 md:px-6 py-2.5 text-sm font-bold rounded-xl transition ${activeTab === 'lyrics' ? 'bg-sky-600 text-white shadow-inner' : 'text-slate-500 hover:text-slate-700'}`}>
                <Music size={16} className="mr-2"/> Lyrics
              </button>
              
              <button onClick={() => setActiveTab('meaning')} className={`flex items-center justify-center px-4 md:px-6 py-2.5 text-sm font-bold rounded-xl transition ${activeTab === 'meaning' ? 'bg-sky-600 text-white shadow-inner' : 'text-slate-500 hover:text-slate-700'}`}>
                <BookOpen size={16} className="mr-2"/> Meaning
              </button>

              {song.story && (
                <button onClick={() => setActiveTab('story')} className={`flex items-center justify-center px-4 md:px-6 py-2.5 text-sm font-bold rounded-xl transition ${activeTab === 'story' ? 'bg-sky-600 text-white shadow-inner' : 'text-slate-500 hover:text-slate-700'}`}>
                  <Info size={16} className="mr-2"/> Story
                </button>
              )}

              {(Array.isArray(song.imageUrls) ? song.imageUrls.length > 0 : Boolean(song.imageUrl)) && (
                <button onClick={() => setActiveTab('image')} className={`flex items-center justify-center px-4 md:px-6 py-2.5 text-sm font-bold rounded-xl transition ${activeTab === 'image' ? 'bg-sky-600 text-white shadow-inner' : 'text-slate-500 hover:text-slate-700'}`}>
                  <ImageIcon size={16} className="mr-2"/> Original Photos
                </button>
              )}
            </div>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 min-h-[400px]">
            
            {/* LYRICS TAB */}
            {activeTab === 'lyrics' && (
              <div className="animate-in fade-in slide-in-from-bottom-2">
                
                {/* UPDATED: 3-Way Toggle for Phonetics */}
                {!isEnglish && (song.transliterationEnglish || song.transliterationMalayalam) && (
                  <div className="flex bg-slate-100 p-1 rounded-xl mb-8 max-w-md mx-auto border border-slate-200">
                    <button onClick={() => setLyricsView('original')} className={`flex-1 flex items-center justify-center py-2 text-xs font-bold rounded-lg transition ${lyricsView === 'original' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                      Original Script
                    </button>
                    {song.transliterationEnglish && (
                      <button onClick={() => setLyricsView('english')} className={`flex-1 flex items-center justify-center py-2 text-xs font-bold rounded-lg transition ${lyricsView === 'english' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                        Eng Phonetics
                      </button>
                    )}
                    {song.transliterationMalayalam && !isMalayalam && (
                      <button onClick={() => setLyricsView('malayalam')} className={`flex-1 flex items-center justify-center py-2 text-xs font-bold rounded-lg transition ${lyricsView === 'malayalam' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                        Mal Phonetics
                      </button>
                    )}
                  </div>
                )}
                
                <div className={`${baseTextClasses} text-center`}>
                  {lyricsView === 'original' && song.lyrics}
                  {lyricsView === 'english' && (song.transliterationEnglish || song.lyrics)}
                  {lyricsView === 'malayalam' && (song.transliterationMalayalam || song.lyrics)}
                </div>
              </div>
            )}

            {/* MEANING TAB */}
            {activeTab === 'meaning' && (
              <div className="animate-in fade-in slide-in-from-bottom-2">
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
                          <div className="flex bg-slate-100 p-1 rounded-xl mb-8 max-w-sm mx-auto border border-slate-200">
                            <button onClick={() => setMeaningView('english')} className={`flex-1 flex items-center justify-center py-2 text-xs font-bold rounded-lg transition ${meaningView === 'english' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                              English
                            </button>
                            <button onClick={() => setMeaningView('malayalam')} className={`flex-1 flex items-center justify-center py-2 text-xs font-bold rounded-lg transition ${meaningView === 'malayalam' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                              Malayalam
                            </button>
                          </div>
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

            {/* STORY TAB */}
            {activeTab === 'story' && song.story && (
              <div className="animate-in fade-in slide-in-from-bottom-2">
                 <div className="bg-slate-50 p-6 md:p-8 rounded-2xl border border-slate-100 text-left">
                  <h3 className="text-lg font-serif font-bold text-slate-800 mb-4 flex items-center">
                    <Info size={20} className="mr-2 text-sky-500"/> The Story Behind the Song
                  </h3>
                  <div className={`${baseTextClasses} text-left`}>{song.story}</div>
                </div>
              </div>
            )}

            {/* IMAGE TAB */}
            {activeTab === 'image' && (
              <div className="animate-in fade-in slide-in-from-bottom-2">
                {(() => {
                  const imageList = Array.isArray(song.imageUrls)
                    ? song.imageUrls.filter(Boolean)
                    : (song.imageUrl ? [song.imageUrl] : []);

                  if (imageList.length === 0) return null;

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {imageList.map((imageUrl: string, index: number) => (
                        <img
                          key={`${imageUrl}-${index}`}
                          src={imageUrl}
                          alt={`Original sheet music ${index + 1} for ${song.title}`}
                          className="w-full h-auto rounded-2xl border border-slate-200 shadow-sm object-contain bg-slate-50"
                        />
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 mt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2 shadow-sm">
          <span className="font-medium text-slate-500">Last updated by: <span className="text-slate-700 font-bold">{song.authorName || 'Unknown'}</span></span>
          <span className="flex items-center"><Clock size={12} className="mr-1" /> {formatIST(song.updatedAt || song.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}