'use client';
import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Edit2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PrayerPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [prayerPoints, setPrayerPoints] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Admin Form State
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
    const cleanSubpoints = subpoints.filter(s => s.trim() !== ''); // Remove empty rows
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
    <div className="p-6 min-h-screen bg-slate-50">
      <Link href="/" className="mb-6 inline-flex items-center text-sm font-bold text-slate-500 hover:text-slate-800 transition">
        <ArrowLeft size={16} className="mr-1" /> Back to Dashboard
      </Link>
      
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-slate-900 mb-1">Prayer Points</h1>
          <p className="text-slate-500 text-sm">Current needs of the assembly</p>
        </div>
        {isAdmin && !showForm && (
          <button onClick={() => setShowForm(true)} className="bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-teal-800 transition flex items-center">
            <Plus size={16} className="mr-1" /> Add
          </button>
        )}
      </div>

      {isAdmin && showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-5 rounded-2xl shadow-md border border-slate-200 mb-8 space-y-4 animate-in fade-in slide-in-from-top-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-bold text-slate-800">{editingId ? 'Edit Prayer Point' : 'New Prayer Point'}</h2>
            <button type="button" onClick={resetForm} className="text-slate-400 hover:text-red-500"><X size={20}/></button>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Main Topic / Title *</label>
            <input required type="text" placeholder="e.g. Upcoming Youth Retreat" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none font-medium text-slate-900" value={title} onChange={e => setTitle(e.target.value)} />
          </div>

          <div className="pt-2 border-t border-slate-100">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-bold text-slate-500">Sub-points (Details)</label>
              <button type="button" onClick={() => setSubpoints([...subpoints, ''])} className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded hover:bg-slate-200 font-bold flex items-center">
                <Plus size={12} className="mr-1"/> Add Row
              </button>
            </div>
            
            <div className="space-y-2">
              {subpoints.map((point, index) => (
                <div key={index} className="flex gap-2">
                  <input type="text" placeholder="Detail or specific need..." className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none text-sm" value={point} onChange={e => updateSubpoint(index, e.target.value)} />
                  <button type="button" onClick={() => removeSubpoint(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16}/></button>
                </div>
              ))}
            </div>
          </div>

          <button type="submit" className="w-full bg-slate-800 text-white font-bold p-3 rounded-xl hover:bg-slate-900 transition mt-4">
            {editingId ? 'Update Prayer Request' : 'Save Prayer Request'}
          </button>
        </form>
      )}

      <div className="space-y-4">
        {prayerPoints.length === 0 && !isLoading && (
          <p className="text-slate-500 text-center py-10 bg-white rounded-2xl border border-slate-200">No active prayer points.</p>
        )}
        
        {/* CHANGED: Map now includes 'index' to generate the numbers */}
        {prayerPoints.map((point, index) => (
          <div key={point.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative group">
            {isAdmin && (
              <div className="absolute top-4 right-4 flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition">
                <button onClick={() => handleEdit(point)} className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200"><Edit2 size={16}/></button>
                <button onClick={() => handleDelete(point.id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><Trash2 size={16}/></button>
              </div>
            )}
            
            <h2 className="font-bold text-lg text-slate-900 mb-3 pr-20 flex items-start">
              {/* CHANGED: Replaced CheckCircle with a numbered badge */}
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 text-white text-xs font-bold mr-3 shrink-0 mt-0.5 shadow-sm">
                {index + 1}
              </span>
              {point.title}
            </h2>
            
            {point.subpoints && point.subpoints.length > 0 && (
              <ul className="space-y-2 pl-9">
                {point.subpoints.map((sub: string, i: number) => (
                  <li key={i} className="text-slate-600 text-sm flex items-start">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 mr-3 shrink-0"></span>
                    <span className="leading-relaxed">{sub}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}