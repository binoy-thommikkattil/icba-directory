'use client';
import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Edit2, X, Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PrayerPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [prayerPoints, setPrayerPoints] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isAdmin = user?.email?.toLowerCase().includes('admin');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [title, setTitle] = useState('');
  const [subpoints, setSubpoints] = useState<string[]>(['']);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'prayer_points'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPrayerPoints(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const resetForm = () => {
    setTitle(''); setSubpoints(['']);
    setEditingId(null); setShowForm(false);
  };

  const handleEdit = (point: any) => {
    setTitle(point.title);
    setSubpoints(point.subpoints && point.subpoints.length > 0 ? point.subpoints : ['']);
    setEditingId(point.id);
    setShowForm(true);
  };

  const updateSubpoint = (index: number, value: string) => {
    const newSubpoints = [...subpoints];
    newSubpoints[index] = value;
    setSubpoints(newSubpoints);
  };

  const removeSubpoint = (index: number) => {
    setSubpoints(subpoints.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSubpoints = subpoints.filter(s => s.trim() !== ''); 
    const payload = { title, subpoints: cleanSubpoints, updatedAt: new Date().toISOString() };
    
    try {
      if (editingId) {
        await updateDoc(doc(db, 'prayer_points', editingId), payload);
      } else {
        await addDoc(collection(db, 'prayer_points'), payload);
      }
      resetForm();
    } catch (error) {
      console.error("Error saving prayer point:", error);
      alert("Failed to save.");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this prayer point?")) {
      await deleteDoc(doc(db, 'prayer_points', id));
    }
  };

  if (authLoading || isLoading || !user) return <div className="p-8 text-center text-slate-500">Loading prayer points...</div>;

  return (
    <div className="p-6 min-h-screen bg-slate-50 pb-24">
      <Link href="/" className="mb-6 inline-flex items-center text-sm font-bold text-slate-500 hover:text-slate-800 transition">
        <ArrowLeft size={16} className="mr-1" /> Back to Dashboard
      </Link>
      
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-slate-900 mb-2 flex items-center">
            <Heart size={28} className="text-rose-500 mr-2" /> Prayer Points
          </h1>
          <p className="text-slate-500 text-sm">Current needs of the assembly</p>
        </div>
        {isAdmin && !showForm && (
          <button onClick={() => setShowForm(true)} className="bg-rose-50 text-rose-700 border border-rose-200 px-4 py-2 rounded-xl text-sm font-bold hover:bg-rose-100 transition flex items-center shadow-sm">
            <Plus size={16} className="mr-1" /> Add
          </button>
        )}
      </div>

      {isAdmin && showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-md border border-slate-200 mb-8 space-y-4 animate-in fade-in slide-in-from-top-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-bold text-slate-800 text-lg">{editingId ? 'Edit Prayer Point' : 'New Prayer Point'}</h2>
            <button type="button" onClick={resetForm} className="text-slate-400 hover:text-red-500 bg-slate-50 p-2 rounded-full"><X size={18}/></button>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Main Topic / Title *</label>
            <input required type="text" placeholder="e.g. Upcoming Youth Retreat" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-900 focus:border-rose-300 focus:ring-1 focus:ring-rose-300 transition" value={title} onChange={e => setTitle(e.target.value)} />
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4">
            <div className="flex justify-between items-center mb-3">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Specific Details (Optional)</label>
              <button type="button" onClick={() => setSubpoints([...subpoints, ''])} className="text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-200 font-bold flex items-center transition">
                <Plus size={14} className="mr-1"/> Add Row
              </button>
            </div>
            
            <div className="space-y-3">
              {subpoints.map((point, index) => (
                <div key={index} className="flex gap-2">
                  <input type="text" placeholder="Detail or specific need..." className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm focus:border-rose-300 transition" value={point} onChange={e => updateSubpoint(index, e.target.value)} />
                  <button type="button" onClick={() => removeSubpoint(index)} className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition"><Trash2 size={18}/></button>
                </div>
              ))}
            </div>
          </div>

          <button type="submit" className="w-full bg-rose-600 text-white font-bold p-3.5 rounded-xl hover:bg-rose-700 transition mt-6 shadow-sm">
            {editingId ? 'Update Prayer Request' : 'Save Prayer Request'}
          </button>
        </form>
      )}

      <div className="space-y-5">
        {prayerPoints.length === 0 && !isLoading && (
          <p className="text-slate-500 text-center py-12 bg-white rounded-3xl border border-slate-200 shadow-sm">No active prayer points at this time.</p>
        )}
        
        {prayerPoints.map((point, index) => (
          <div key={point.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 relative group hover:shadow-md hover:border-rose-100 transition duration-300">
            
            {isAdmin && (
              <div className="absolute top-5 right-5 flex gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition">
                <button onClick={() => handleEdit(point)} className="p-2 bg-slate-50 text-slate-500 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition"><Edit2 size={16}/></button>
                <button onClick={() => handleDelete(point.id)} className="p-2 bg-slate-50 text-slate-500 rounded-lg hover:bg-red-50 hover:text-red-600 transition"><Trash2 size={16}/></button>
              </div>
            )}
            
            <h2 className="font-bold text-lg text-slate-800 mb-4 pr-20 flex items-start">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-rose-50 text-rose-600 border border-rose-100 text-sm font-extrabold mr-3 shrink-0 shadow-sm">
                {index + 1}
              </span>
              <span className="mt-0.5 leading-snug">{point.title}</span>
            </h2>
            
            {point.subpoints && point.subpoints.length > 0 && (
              <div className="pl-11 pr-2">
                <ul className="space-y-3">
                  {point.subpoints.map((sub: string, i: number) => (
                    <li key={i} className="text-slate-600 text-[15px] flex items-start">
                      {/* Soft Rose colored bullet points */}
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-300 mt-2 mr-3 shrink-0"></span>
                      <span className="leading-relaxed">{sub}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}