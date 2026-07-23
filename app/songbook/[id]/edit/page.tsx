'use client';
import { useState, useEffect, ChangeEvent } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from '@/lib/firebase';
import { updateSong } from '@/app/actions/dbActions';
import { useAuth } from '@/lib/AuthContext';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2, Lock, Image as ImageIcon, X } from 'lucide-react';

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
  
  // Phonetics and Translations
  const [transliterationEng, setTransliterationEng] = useState('');
  const [transliterationMal, setTransliterationMal] = useState('');
  const [meaningEng, setMeaningEng] = useState('');
  const [meaningMal, setMeaningMal] = useState('');
  const [story, setStory] = useState('');
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

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
          setTransliterationEng(data.transliterationEnglish || '');
          setTransliterationMal(data.transliterationMalayalam || '');
          setMeaningEng(data.meaningEnglish || '');
          setMeaningMal(data.meaningMalayalam || '');
          setStory(data.story || '');
          const parsedImages = Array.isArray(data.imageUrls)
            ? data.imageUrls.filter(Boolean)
            : (data.imageUrl ? [data.imageUrl] : []);
          setExistingImageUrls(parsedImages);
        } else { router.push('/songbook'); }
      } catch (error) { console.error("Error fetching song:", error); } 
      finally { setIsLoading(false); }
    };
    fetchSong();
  }, [params.id]);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) {
      setImageFiles([]);
      setImagePreviews([]);
      return;
    }

    setImageFiles(files);
    Promise.all(files.map(file => new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    }))).then((previews) => setImagePreviews(previews));
  };

  const removeExistingImage = (indexToRemove: number) => {
    setExistingImageUrls((current) => current.filter((_, index) => index !== indexToRemove));
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const authorName = userProfile?.name || user?.displayName || user?.email || 'Unknown Member';
      let nextImageUrls = existingImageUrls;

      if (imageFiles.length > 0) {
        nextImageUrls = [];
        for (const file of imageFiles) {
          const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
          const imageRef = ref(storage, `song_images/${uniqueSuffix}_${file.name}`);
          const uploadSnapshot = await uploadBytes(imageRef, file);
          nextImageUrls.push(await getDownloadURL(uploadSnapshot.ref));
        }
      }

      const token = await auth.currentUser?.getIdToken();
      await updateSong(params.id as string, {
        title, 
        language, 
        originalAuthor, 
        lyrics, 
        transliterationEnglish: transliterationEng,
        transliterationMalayalam: transliterationMal,
        meaningEnglish: meaningEng, 
        meaningMalayalam: meaningMal, 
        story, 
        imageUrls: nextImageUrls,
        imageUrl: nextImageUrls[0] || '',
        authorName,
        updatedAt: new Date().toISOString()
      }, token);
      router.push(`/songbook/${params.id}`);
    } catch (error) { 
        console.error('Failed to update song.', error);
        alert("Failed to update song."); 
        setIsSaving(false); 
    }
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
                <option value="Telugu">Telugu</option>
                <option value="Gujarati">Gujarati</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Song Title</label>
              <input required type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 transition" value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Composer / Original Author</label>
              <input type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 transition" value={originalAuthor} onChange={e => setOriginalAuthor(e.target.value)} placeholder="e.g. V Nagel" />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Original Lyrics</label>
            <textarea required rows={6} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 transition leading-relaxed" value={lyrics} onChange={e => setLyrics(e.target.value)} />
          </div>

          {language !== 'English' && (
            <div className="pt-4 border-t border-slate-100 grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">English Phonetics (Sing-along script)</label>
                <textarea rows={5} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 transition leading-relaxed" value={transliterationEng} onChange={e => setTransliterationEng(e.target.value)} />
              </div>
              
              {/* NEW: Malayalam Phonetics text box */}
              {language !== 'Malayalam' && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 text-sky-700">Malayalam Phonetics (Sing-along script)</label>
                  <textarea rows={5} className="w-full p-4 bg-sky-50 border border-sky-100 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 transition leading-relaxed" value={transliterationMal} onChange={e => setTransliterationMal(e.target.value)} />
                </div>
              )}
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

          <div className="pt-4 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Attached Images</label>
            {existingImageUrls.length > 0 && (
              <div className="grid grid-cols-2 gap-3 mb-3">
                {existingImageUrls.map((imageUrl, index) => (
                  <div key={`${imageUrl}-${index}`} className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                    <img src={imageUrl} alt={`Existing attachment ${index + 1}`} className="w-full h-28 object-contain p-2" />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(index)}
                      className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-slate-900/80 text-white shadow-sm transition hover:bg-red-600"
                      aria-label={`Remove image ${index + 1}`}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <label className="flex flex-col items-center justify-center w-full min-h-32 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition px-3 py-3">
              {imagePreviews.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 w-full">
                  {imagePreviews.map((preview, index) => (
                    <div key={`${preview}-${index}`} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                      <img src={preview} alt={`New preview ${index + 1}`} className="w-full h-24 object-contain p-2" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-3 text-center">
                  <ImageIcon className="w-8 h-8 text-slate-400 mb-2" />
                  <span className="text-sm font-bold text-slate-500">Choose new images to replace the current set</span>
                  <span className="text-xs text-slate-400 mt-1">Leave empty to keep the existing photos intact.</span>
                </div>
              )}
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} />
            </label>
          </div>

          <button disabled={isSaving} type="submit" className="w-full bg-sky-600 text-white font-bold p-4 rounded-xl hover:bg-sky-700 transition shadow-sm flex items-center justify-center disabled:opacity-70">
            {isSaving ? <Loader2 size={20} className="animate-spin" /> : <><Save size={20} className="mr-2" /> Update Song</>}
          </button>
        </form>
      </div>
    </div>
  );
}
