'use client';
import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import Link from 'next/link';
import { ArrowLeft, Save, Image as ImageIcon, Type, Loader2, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AddSongPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState('');

  // Form State
  const [title, setTitle] = useState('');
  const [language, setLanguage] = useState('Malayalam');
  const [story, setStory] = useState('');
  
  // Input Method State
  const [inputMethod, setInputMethod] = useState<'text' | 'image'>('text');
  const [lyrics, setLyrics] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [useOCR, setUseOCR] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return alert("Title is required.");
    if (inputMethod === 'text' && !lyrics.trim()) return alert("Please enter the song lyrics.");
    if (inputMethod === 'image' && !imageFile) return alert("Please upload an image.");

    setIsSubmitting(true);
    setSubmissionStatus('Preparing to save...');

    try {
      const authorName = userProfile?.name || user?.displayName || user?.email || 'Unknown Member';
      let imageUrl = '';
      let extractedLyrics = lyrics;
      let finalTransliteration = '';
      let finalMeaningEng = '';
      let finalMeaningMal = '';

      // 1. AUTO-CALCULATE THE NEXT SONG NUMBER
      setSubmissionStatus('Assigning Song Number...');
      const q = query(collection(db, 'songs'), orderBy('songNumber', 'desc'), limit(1));
      const snapshot = await getDocs(q);
      let nextSongNumber = 1;
      if (!snapshot.empty) {
        nextSongNumber = (snapshot.docs[0].data().songNumber || 0) + 1;
      }

      // 2. HANDLE IMAGE UPLOAD
      if (inputMethod === 'image' && imageFile) {
        setSubmissionStatus('Uploading high-quality image...');
        const imageRef = ref(storage, `song_images/${Date.now()}_${imageFile.name}`);
        const uploadSnapshot = await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(uploadSnapshot.ref);

        if (useOCR) {
          setSubmissionStatus('AI is extracting text and generating translations... (Takes 5-10 seconds)');
          // INNER TRY-CATCH: If AI fails, we don't break the whole save process!
          try {
            const apiRes = await fetch('/api/process-song', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ inputMethod: 'image', payload: imageUrl, language })
            });
            
            if (!apiRes.ok) {
              console.warn("AI extraction skipped or failed. Saving image only.");
            } else {
              const aiData = await apiRes.json();
              extractedLyrics = aiData.lyrics || '';
              finalTransliteration = aiData.transliterationEnglish || '';
              finalMeaningEng = aiData.meaningEnglish || '';
              finalMeaningMal = aiData.meaningMalayalam || '';
            }
          } catch (aiError) {
            console.warn("AI Network Error. Saving image only.", aiError);
          }
        }
      } 
      // 3. HANDLE TEXT UPLOAD (Only run AI if it's not English)
      else if (inputMethod === 'text' && language !== 'English') {
        setSubmissionStatus('AI is generating transliteration and meaning... (Takes 5-10 seconds)');
        // INNER TRY-CATCH: If AI fails, we don't break the whole save process!
        try {
          const apiRes = await fetch('/api/process-song', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ inputMethod: 'text', payload: lyrics, language })
          });
          
          if (!apiRes.ok) {
             console.warn("AI generation skipped or failed. Saving original text only.");
          } else {
            const aiData = await apiRes.json();
            extractedLyrics = aiData.lyrics || lyrics;
            finalTransliteration = aiData.transliterationEnglish || '';
            finalMeaningEng = aiData.meaningEnglish || '';
            finalMeaningMal = aiData.meaningMalayalam || '';
          }
        } catch (aiError) {
           console.warn("AI Network Error. Saving original text only.", aiError);
        }
      }

      setSubmissionStatus('Saving to Songbook...');

      // 4. SAVE EVERYTHING TO FIRESTORE
      const newSongData = {
        title,
        songNumber: nextSongNumber,
        language,
        lyrics: extractedLyrics, 
        transliterationEnglish: finalTransliteration,
        meaningEnglish: finalMeaningEng,
        meaningMalayalam: finalMeaningMal,
        story,
        imageUrl,
        authorName,
        authorUid: user?.uid || '',
        authorEmail: user?.email || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'songs'), newSongData);
      router.push('/songbook');

    } catch (error: any) {
      console.error("Detailed Error:", error);
      alert(`Error: ${error.message || "Something went wrong saving to the database."}`);
      setIsSubmitting(false);
    }
  };

  if (authLoading || !user) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="animate-spin text-sky-600" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 p-6 pb-24">
      <div className="max-w-2xl mx-auto">
        <Link href="/songbook" className="mb-6 inline-flex items-center text-sm font-bold text-slate-500 hover:text-slate-800 transition">
          <ArrowLeft size={16} className="mr-1" /> Back to Songbook
        </Link>

        <h1 className="text-3xl font-serif font-bold text-slate-900 mb-2">Add New Song</h1>
        <p className="text-slate-500 text-sm mb-8">Add a song to the assembly library. It will be assigned the next available song number automatically.</p>

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-6">
          
          {/* BASIC INFO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-1 md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Song Title *</label>
              <input required type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 transition" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Enna Ninne (What a Friend)" />
            </div>
            <div className="col-span-1 md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Original Language *</label>
              <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 transition font-medium" value={language} onChange={e => setLanguage(e.target.value)}>
                <option value="Malayalam">Malayalam</option>
                <option value="English">English</option>
                <option value="Tamil">Tamil</option>
                <option value="Kannada">Kannada</option>
                <option value="Hindi">Hindi</option>
              </select>
            </div>
          </div>

          {/* INPUT METHOD TOGGLE */}
          <div className="pt-4 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">How do you want to add the lyrics?</label>
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button type="button" onClick={() => setInputMethod('text')} className={`flex-1 flex items-center justify-center py-2.5 text-sm font-bold rounded-lg transition ${inputMethod === 'text' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                <Type size={16} className="mr-2" /> Paste Text
              </button>
              <button type="button" onClick={() => setInputMethod('image')} className={`flex-1 flex items-center justify-center py-2.5 text-sm font-bold rounded-lg transition ${inputMethod === 'image' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                <ImageIcon size={16} className="mr-2" /> Upload Image
              </button>
            </div>
          </div>

          {/* METHOD A: TEXT */}
          {inputMethod === 'text' && (
            <div className="animate-in fade-in slide-in-from-top-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Lyrics *</label>
              <textarea required={inputMethod === 'text'} rows={8} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 transition leading-relaxed" value={lyrics} onChange={e => setLyrics(e.target.value)} placeholder="Paste the lyrics here..." />
              {language !== 'English' && (
                <div className="mt-2 flex items-start text-xs text-sky-600 bg-sky-50 p-3 rounded-lg border border-sky-100">
                  <Info size={14} className="mr-2 shrink-0 mt-0.5" />
                  <p>When you save, our AI will automatically generate an English transliteration and meanings for this song!</p>
                </div>
              )}
            </div>
          )}

          {/* METHOD B: IMAGE */}
          {inputMethod === 'image' && (
            <div className="animate-in fade-in slide-in-from-top-2 space-y-4">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Songbook Photo *</label>
              
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition overflow-hidden relative">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-contain p-2" />
                  ) : (
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <ImageIcon className="w-10 h-10 text-slate-400 mb-3" />
                      <p className="mb-2 text-sm text-slate-500 font-bold">Click to upload or drag and drop</p>
                      <p className="text-xs text-slate-400">PNG, JPG or JPEG (Max. high resolution)</p>
                    </div>
                  )}
                  <input required={inputMethod === 'image'} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </label>
              </div>

              {/* OCR TOGGLE */}
              <label className="flex items-start p-4 bg-sky-50 border border-sky-100 rounded-xl cursor-pointer hover:bg-sky-100 transition group">
                <input type="checkbox" checked={useOCR} onChange={(e) => setUseOCR(e.target.checked)} className="mt-1 w-4 h-4 text-sky-600 rounded border-sky-300 focus:ring-sky-500" />
                <div className="ml-3">
                  <span className="block text-sm font-bold text-sky-900">Convert image to text (OCR)</span>
                  <span className="block text-xs text-sky-700 mt-1">AI will extract the lyrics from the photo and generate a transliteration & meaning. Uncheck this if the image font is unreadable.</span>
                </div>
              </label>
            </div>
          )}

          {/* STORY / HISTORY */}
          <div className="pt-4 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Story behind the song (Optional)</label>
            <textarea rows={3} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 transition" value={story} onChange={e => setStory(e.target.value)} placeholder="Who wrote it? What is the history of this hymn?" />
          </div>

          <button disabled={isSubmitting} type="submit" className="w-full bg-sky-600 text-white font-bold p-4 rounded-xl hover:bg-sky-700 transition shadow-sm flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed">
            {isSubmitting ? (
              <><Loader2 size={20} className="animate-spin mr-2" /> {submissionStatus}</>
            ) : (
              <><Save size={20} className="mr-2" /> Save to Songbook</>
            )}
          </button>

        </form>
      </div>
    </div>
  );
}