'use client';
import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2, Lock } from 'lucide-react';

export default function EditSongPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const params = useParams();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [songNumber, setSongNumber] = useState('');
  const [language, setLanguage] = useState('');
  const [originalAuthor, setOriginalAuthor] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [transliteration, setTransliteration] = useState('');
  const [meaningEng, setMeaningEng] = useState('');
  const [meaningMal, setMeaningMal] = useState('');
  const [story, setStory] = useState('');

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
          const data = docSnap.data();
          setTitle(data.title || '');
          setSongNumber(data.songNumber?.toString() || '');
          setLanguage(data.language || 'English');
          setOriginalAuthor(data.originalAuthor || '');
          setLyrics(data.lyrics || '');
          setTransliteration(data.transliterationEnglish || '');
          setMeaningEng(data.meaningEnglish || '');
          setMeaningMal(data.meaningMalayalam || '');
          setStory(data.story || '');
        } else { router.push('/songbook'); }
      } catch (error) { console.error("Error fetching song:", error); } 
      finally { setIsLoading(false); }
    };
    fetchSong();
  }, [params.id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const authorName = userProfile?.name || user?.displayName || user?.email || 'Unknown Member';
      await updateDoc(doc(db, 'songs', params.id as string), {
        title, language, originalAuthor, lyrics, transliterationEnglish: transliteration,
        meaningEnglish: meaningEng, meaningMalayalam: meaningMal, story, authorName,
        updatedAt: new Date().toISOString()
      });
      router.push(`/songbook/${params.id}`);
    } catch (error) { alert("Failed to update song."); setIsSaving(false); }
  };

  if (authLoading || isLoading) return <div className="flex min-h-screen items-center justify-center text-slate-500"><Loader2 className="animate-spin mr-2" /> Loading Editor...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-6 pb-24">
      <div className="max-w-2xl mx-auto">
        <Link href={`/songbook/${params.id}`} className="mb-6 inline-flex items-center text-sm font-bold text-slate-500 hover:text-slate-800 transition"><ArrowLeft size={16} className="mr-1" /> Back to Song</Link>
        <h1 className="text-3xl font-serif font-bold text-slate-900 mb-2">Edit Song</h1>
        
        <form onSubmit={handleUpdate} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Song Number</label>
              <div className="flex items-center w-full p-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-bold">
                <Lock size={16} className="mr-2" /> {songNumber}
              </div>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Language</label>
              <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 transition font-medium" value={language} onChange={e => setLanguage(e.target.value)}>
                <option value="Malayalam">Malayalam</option>
                <option value="English">English</option>
                <option value="Tamil">Tamil</option>
                <option value="Kannada">Kannada</option>
                <option value="Hindi">Hindi</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Song Title</label>
              <input required type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 transition" value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Composer / Original Author</label>
              <input type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 transition" value={originalAuthor} onChange={e => setOriginalAuthor(e.target.value)} placeholder="e.g. Fanny Crosby" />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Original Lyrics</label>
            <textarea required rows={6} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 transition leading-relaxed" value={lyrics} onChange={e => setLyrics(e.target.value)} />
          </div>

          {language !== 'English' && (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex justify-between"><span>English Transliteration</span></label>
              <textarea rows={6} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 transition leading-relaxed" value={transliteration} onChange={e => setTransliteration(e.target.value)} />
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">English Meaning</label>
              <textarea rows={4} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 text-sm" value={meaningEng} onChange={e => setMeaningEng(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Malayalam Meaning</label>
              <textarea rows={4} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 text-sm" value={meaningMal} onChange={e => setMeaningMal(e.target.value)} />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Story / History</label>
            <textarea rows={3} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 transition" value={story} onChange={e => setStory(e.target.value)} />
          </div>

          <button disabled={isSaving} type="submit" className="w-full bg-sky-600 text-white font-bold p-4 rounded-xl hover:bg-sky-700 transition shadow-sm flex items-center justify-center disabled:opacity-70">
            {isSaving ? <Loader2 size={20} className="animate-spin" /> : <><Save size={20} className="mr-2" /> Update Song</>}
          </button>
        </form>
      </div>
    </div>
  );
}