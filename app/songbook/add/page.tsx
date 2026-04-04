'use client';
import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import Link from 'next/link';
import { ArrowLeft, Save, Image as ImageIcon, Type, Loader2, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AddSongPage() {
    const { user, userProfile, loading: authLoading } = useAuth();
    const router = useRouter();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionStatus, setSubmissionStatus] = useState('');

    // Form State - Defaults to Auto for AI Processing
    const [title, setTitle] = useState('');
    const [originalAuthor, setOriginalAuthor] = useState('');
    const [language, setLanguage] = useState('Auto-Detect');
    const [story, setStory] = useState('');

    // Input Method State (Moved to top of UI)
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
        if (inputMethod === 'text' && !lyrics.trim()) return alert("Please enter the song lyrics.");
        if (inputMethod === 'image' && !imageFile) return alert("Please upload an image.");

        setIsSubmitting(true);
        setSubmissionStatus('Initializing AI...');

        try {
            const authorName = userProfile?.name || user?.displayName || user?.email || 'Unknown Member';
            let imageUrl = '';
            
            // These will be overridden by AI if successful
            let finalTitle = title;
            let finalLanguage = language;
            let finalAuthor = originalAuthor;
            let extractedLyrics = lyrics;
            let finalTransliterationEng = '';
            let finalTransliterationMal = ''; // New field for Malayalam Phonetics
            let finalMeaningEng = '';
            let finalMeaningMal = '';
            let finalStory = story;

            setSubmissionStatus('Assigning Song Number...');
            const q = query(collection(db, 'songs'), orderBy('songNumber', 'desc'), limit(1));
            const snapshot = await getDocs(q);
            let nextSongNumber = 1;
            if (!snapshot.empty) {
                nextSongNumber = (snapshot.docs[0].data().songNumber || 0) + 1;
            }

            if (inputMethod === 'image' && imageFile) {
                setSubmissionStatus('Uploading high-quality image...');
                const imageRef = ref(storage, `song_images/${Date.now()}_${imageFile.name}`);
                const uploadSnapshot = await uploadBytes(imageRef, imageFile);
                imageUrl = await getDownloadURL(uploadSnapshot.ref);

                if (useOCR) {
                    setSubmissionStatus('AI is extracting text, finding metadata, and generating phonetics... (10-15 seconds)');
                    try {
                        const apiRes = await fetch('/api/process-song', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ inputMethod: 'image', payload: imageUrl, language, title, originalAuthor })
                        });

                        if (apiRes.ok) {
                            const aiData = await apiRes.json();
                            finalTitle = aiData.title || finalTitle || "Untitled Song";
                            finalLanguage = aiData.language || finalLanguage;
                            finalAuthor = aiData.originalAuthor || finalAuthor;
                            extractedLyrics = aiData.lyrics || '';
                            finalTransliterationEng = aiData.transliterationEnglish || '';
                            finalTransliterationMal = aiData.transliterationMalayalam || ''; // Catching Malayalam phonetics
                            finalMeaningEng = aiData.meaningEnglish || '';
                            finalMeaningMal = aiData.meaningMalayalam || '';
                            finalStory = aiData.story || finalStory;
                        }
                    } catch (aiError) {
                        console.warn("AI Error", aiError);
                    }
                }
            } 
            else if (inputMethod === 'text') {
                setSubmissionStatus('AI is formatting text, finding metadata, and generating phonetics... (10-15 seconds)');
                try {
                    const apiRes = await fetch('/api/process-song', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ inputMethod: 'text', payload: lyrics, language, title, originalAuthor })
                    });

                    if (apiRes.ok) {
                        const aiData = await apiRes.json();
                        finalTitle = aiData.title || finalTitle;
                        finalLanguage = aiData.language || finalLanguage;
                        finalAuthor = aiData.originalAuthor || finalAuthor;
                        extractedLyrics = aiData.lyrics || lyrics;
                        finalTransliterationEng = aiData.transliterationEnglish || '';
                        finalTransliterationMal = aiData.transliterationMalayalam || ''; // Catching Malayalam phonetics
                        finalMeaningEng = aiData.meaningEnglish || '';
                        finalMeaningMal = aiData.meaningMalayalam || '';
                        finalStory = aiData.story || finalStory;
                    }
                } catch (aiError) {
                    console.warn("AI Error", aiError);
                }
            }

            // Fallback if AI couldn't figure out the title
            if (!finalTitle || finalTitle.trim() === '') {
                finalTitle = extractedLyrics.split('\n')[0].substring(0, 30) + '...';
            }
            if (finalLanguage === 'Auto-Detect') finalLanguage = 'Unknown';

            setSubmissionStatus('Saving to Songbook...');

            const newSongData = {
                title: finalTitle,
                songNumber: nextSongNumber,
                language: finalLanguage,
                originalAuthor: finalAuthor,
                lyrics: extractedLyrics,
                transliterationEnglish: finalTransliterationEng,
                transliterationMalayalam: finalTransliterationMal, // NEW FIELD
                meaningEnglish: finalMeaningEng,
                meaningMalayalam: finalMeaningMal,
                story: finalStory,
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
                <p className="text-slate-500 text-sm mb-8 flex items-center">
                  <Sparkles size={16} className="text-amber-500 mr-2" /> 
                  Paste the lyrics. Our AI will automatically detect the language, title, and composer.
                </p>

                <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-6">

                    {/* 1. INPUT METHOD TOGGLE AT THE TOP */}
                    <div>
                        <div className="flex bg-slate-100 p-1 rounded-xl mb-4">
                            <button type="button" onClick={() => setInputMethod('text')} className={`flex-1 flex items-center justify-center py-2.5 text-sm font-bold rounded-lg transition ${inputMethod === 'text' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                                <Type size={16} className="mr-2" /> Paste Text
                            </button>
                            <button type="button" onClick={() => setInputMethod('image')} className={`flex-1 flex items-center justify-center py-2.5 text-sm font-bold rounded-lg transition ${inputMethod === 'image' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                                <ImageIcon size={16} className="mr-2" /> Upload Image
                            </button>
                        </div>

                        {/* METHOD A: TEXT */}
                        {inputMethod === 'text' && (
                            <div className="animate-in fade-in slide-in-from-top-2">
                                <textarea required={inputMethod === 'text'} rows={10} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 transition leading-relaxed font-medium" value={lyrics} onChange={e => setLyrics(e.target.value)} placeholder="Paste the raw song lyrics here..." />
                            </div>
                        )}

                        {/* METHOD B: IMAGE */}
                        {inputMethod === 'image' && (
                            <div className="animate-in fade-in slide-in-from-top-2 space-y-4">
                                <div className="flex items-center justify-center w-full">
                                    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition overflow-hidden relative">
                                        {imagePreview ? (
                                            <img src={imagePreview} alt="Preview" className="w-full h-full object-contain p-2" />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                <ImageIcon className="w-10 h-10 text-slate-400 mb-3" />
                                                <p className="mb-2 text-sm text-slate-500 font-bold">Click to upload photo of songbook</p>
                                            </div>
                                        )}
                                        <input required={inputMethod === 'image'} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                                    </label>
                                </div>
                                <label className="flex items-start p-4 bg-sky-50 border border-sky-100 rounded-xl cursor-pointer hover:bg-sky-100 transition group">
                                    <input type="checkbox" checked={useOCR} onChange={(e) => setUseOCR(e.target.checked)} className="mt-1 w-4 h-4 text-sky-600 rounded border-sky-300 focus:ring-sky-500" />
                                    <div className="ml-3">
                                        <span className="block text-sm font-bold text-sky-900">AI Transcription & Translation</span>
                                        <span className="block text-xs text-sky-700 mt-1">AI will extract lyrics, detect language, and generate phonetics.</span>
                                    </div>
                                </label>
                            </div>
                        )}
                    </div>

                    <div className="border-t border-slate-100 pt-6">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Manual Overrides (Optional)</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="col-span-1 md:col-span-2">
                              <input type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 transition" value={title} onChange={e => setTitle(e.target.value)} placeholder="Title (Leave blank to auto-generate)" />
                          </div>

                          <div className="col-span-1">
                              <input type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 transition" value={originalAuthor} onChange={e => setOriginalAuthor(e.target.value)} placeholder="Composer (Leave blank to auto-detect)" />
                          </div>

                          <div className="col-span-1">
                              <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 transition font-medium text-slate-600" value={language} onChange={e => setLanguage(e.target.value)}>
                                  <option value="Auto-Detect">Auto-Detect Language</option>
                                  <option value="Malayalam">Malayalam</option>
                                  <option value="English">English</option>
                                  <option value="Tamil">Tamil</option>
                                  <option value="Kannada">Kannada</option>
                                  <option value="Hindi">Hindi</option>
                                  <option value="Telugu">Telugu</option>
                                  <option value="Gujarati">Gujarati</option>
                              </select>
                          </div>
                      </div>
                    </div>

                    <button disabled={isSubmitting} type="submit" className="w-full bg-sky-600 text-white font-bold p-4 rounded-xl hover:bg-sky-700 transition shadow-sm flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed mt-4">
                        {isSubmitting ? (
                            <><Loader2 size={20} className="animate-spin mr-2" /> {submissionStatus}</>
                        ) : (
                            <><Sparkles size={20} className="mr-2" /> Process & Save Song</>
                        )}
                    </button>

                </form>
            </div>
        </div>
    );
}