'use client';
import { useState, useEffect } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
// FIX: Imported `auth` from your firebase config
import { storage, auth } from '@/lib/firebase';
import { createSong } from '@/app/actions/dbActions';
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
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [useOCR, setUseOCR] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) router.push('/login');
    }, [user, authLoading, router]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (inputMethod === 'text' && !lyrics.trim()) return alert("Please enter the song lyrics.");
        if (inputMethod === 'image' && imageFiles.length === 0) return alert("Please upload at least one image.");

        setIsSubmitting(true);
        setSubmissionStatus('Initializing AI...');

        try {
            // FIX: Generate the secure ID token from Firebase to pass to our API
            const token = await auth.currentUser?.getIdToken();

            const authorName = userProfile?.name || user?.displayName || user?.email || 'Unknown Member';
            const imageUrls: string[] = [];
            
            // These will be overridden by AI if successful
            let finalTitle = title.trim();
            let finalLanguage = language;
            let finalAuthor = originalAuthor.trim();
            let extractedLyrics = lyrics;
            let finalTransliterationEng = '';
            let finalTransliterationMal = '';
            let finalMeaningEng = '';
            let finalMeaningMal = '';
            let finalStory = story;
            let aiCallSucceeded = false;

            if (inputMethod === 'image' && imageFiles.length > 0) {
                setSubmissionStatus('Uploading selected images...');
                for (const file of imageFiles) {
                    const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
                    const imageRef = ref(storage, `song_images/${uniqueSuffix}_${file.name}`);
                    const uploadSnapshot = await uploadBytes(imageRef, file);
                    imageUrls.push(await getDownloadURL(uploadSnapshot.ref));
                }

                if (useOCR) {
                    setSubmissionStatus('AI is extracting text, finding metadata, and generating phonetics... (10-15 seconds)');
                    try {
                        const apiRes = await fetch('/api/process-song', {
                            method: 'POST',
                            headers: { 
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}` // FIX: Passing the token
                            },
                            body: JSON.stringify({ inputMethod: 'image', payload: imageUrls, language, title, originalAuthor })
                        });

                        if (apiRes.ok) {
                            const aiData = await apiRes.json();
                            aiCallSucceeded = true;
                            finalTitle = aiData.title?.trim() || finalTitle || "Untitled Song";
                            finalLanguage = aiData.language || finalLanguage;
                            finalAuthor = aiData.originalAuthor?.trim() || finalAuthor || 'Unknown';
                            extractedLyrics = aiData.lyrics || '';
                            finalTransliterationEng = aiData.transliterationEnglish || '';
                            finalTransliterationMal = aiData.transliterationMalayalam || '';
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
                        headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}` // FIX: Passing the token
                        },
                        body: JSON.stringify({ inputMethod: 'text', payload: lyrics, language, title, originalAuthor })
                    });

                    if (apiRes.ok) {
                        const aiData = await apiRes.json();
                        aiCallSucceeded = true;
                        finalTitle = aiData.title?.trim() || finalTitle;
                        finalLanguage = aiData.language || finalLanguage;
                        finalAuthor = aiData.originalAuthor?.trim() || finalAuthor || 'Unknown';
                        extractedLyrics = aiData.lyrics || lyrics;
                        finalTransliterationEng = aiData.transliterationEnglish || '';
                        finalTransliterationMal = aiData.transliterationMalayalam || '';
                        finalMeaningEng = aiData.meaningEnglish || '';
                        finalMeaningMal = aiData.meaningMalayalam || '';
                        finalStory = aiData.story || finalStory;
                    }
                } catch (aiError) {
                    console.warn("AI Error", aiError);
                }
            }

            // Fallback for titles when the AI call never returns usable data
            if (!finalTitle || finalTitle.trim() === '') {
                if (aiCallSucceeded) {
                    finalTitle = 'Untitled Song';
                } else if (inputMethod === 'text') {
                    finalTitle = extractedLyrics.split('\n')[0].substring(0, 30) + '...';
                } else {
                    finalTitle = 'Untitled Song';
                }
            }
            if (finalLanguage === 'Auto-Detect') finalLanguage = 'Unknown';

            setSubmissionStatus('Saving to Songbook...');

            const newSongData = {
                title: finalTitle,
                language: finalLanguage,
                originalAuthor: finalAuthor || 'Unknown',
                lyrics: extractedLyrics,
                transliterationEnglish: finalTransliterationEng,
                transliterationMalayalam: finalTransliterationMal,
                meaningEnglish: finalMeaningEng,
                meaningMalayalam: finalMeaningMal,
                story: finalStory,
                imageUrls,
                imageUrl: imageUrls[0] || '',
                authorName,
                authorUid: user?.uid || '',
                authorEmail: user?.email || '',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            await createSong(newSongData, token);
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
                                    <label className="flex flex-col items-center justify-center w-full min-h-48 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition overflow-hidden relative px-3 py-3">
                                        {imagePreviews.length > 0 ? (
                                            <div className="grid grid-cols-2 gap-2 w-full">
                                                {imagePreviews.map((preview, index) => (
                                                    <div key={`${preview}-${index}`} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                                                        <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-32 object-contain p-2" />
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                <ImageIcon className="w-10 h-10 text-slate-400 mb-3" />
                                                <p className="mb-2 text-sm text-slate-500 font-bold">Click to upload one or more photos of the songbook</p>
                                            </div>
                                        )}
                                        <input required={inputMethod === 'image'} type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} />
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
