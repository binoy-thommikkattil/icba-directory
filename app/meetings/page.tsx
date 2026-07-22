'use client';
import { useState, useEffect } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { createMeeting, updateMeeting, deleteMeeting } from '@/app/actions/dbActions';
import { useAuth } from '@/lib/AuthContext';
import Link from 'next/link';
import { ArrowLeft, Video, MapPin, Plus, Trash2, Edit2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function MeetingsPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [meetings, setMeetings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Admin Form State
  const isAdmin = userProfile?.role === 'admin';
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [type, setType] = useState('Zoom'); // 'Zoom' or 'In-Person'
  const [linkOrLocation, setLinkOrLocation] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'meetings'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMeetings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const resetForm = () => {
    setTitle(''); setTime(''); setType('Zoom'); setLinkOrLocation('');
    setEditingId(null); setShowForm(false);
  };

  const handleEdit = (meeting: any) => {
    setTitle(meeting.title);
    setTime(meeting.time);
    setType(meeting.type);
    setLinkOrLocation(meeting.linkOrLocation);
    setEditingId(meeting.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { title, time, type, linkOrLocation, updatedAt: new Date().toISOString() };
    
    try {
      if (editingId) {
        await updateMeeting(editingId, payload);
      } else {
        await createMeeting(payload);
      }
      resetForm();
    } catch (error) {
      console.error("Error saving meeting:", error);
      alert("Failed to save meeting.");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this meeting?")) {
      await deleteMeeting(id);
    }
  };

  if (authLoading || isLoading || !user) return <div className="p-8 text-center text-slate-500">Loading meetings...</div>;

  return (
    <div className="p-6 min-h-screen bg-slate-50">
      <Link href="/dashboard" className="mb-6 inline-flex items-center text-sm font-bold text-slate-500 hover:text-slate-800 transition">
        <ArrowLeft size={16} className="mr-1" /> Back to Dashboard
      </Link>
      
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-slate-900 mb-1">Meetings</h1>
          <p className="text-slate-500 text-sm">Church service schedule</p>
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
            <h2 className="font-bold text-slate-800">{editingId ? 'Edit Meeting' : 'New Meeting'}</h2>
            <button type="button" onClick={resetForm} className="text-slate-400 hover:text-red-500"><X size={20}/></button>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Meeting Title</label>
            <input required type="text" placeholder="e.g. Sunday Worship" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none" value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Day & Time</label>
            <input required type="text" placeholder="e.g. Sunday at 10:00 AM" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none" value={time} onChange={e => setTime(e.target.value)} />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-500 mb-1">Meeting Type</label>
              <select className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none" value={type} onChange={e => setType(e.target.value)}>
                <option value="Zoom">Zoom Meeting</option>
                <option value="In-Person">In-Person</option>
              </select>
            </div>
            <div className="flex-[2]">
              <label className="block text-xs font-bold text-slate-500 mb-1">{type === 'Zoom' ? 'Zoom Link URL' : 'Location Name'}</label>
              <input required type="text" placeholder={type === 'Zoom' ? 'https://zoom.us/j/...' : 'e.g. Main Assembly Hall'} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none" value={linkOrLocation} onChange={e => setLinkOrLocation(e.target.value)} />
            </div>
          </div>
          <button type="submit" className="w-full bg-slate-800 text-white font-bold p-3 rounded-xl hover:bg-slate-900 transition mt-2">
            {editingId ? 'Update Meeting' : 'Save Meeting'}
          </button>
        </form>
      )}

      {/* MEETINGS LIST - REDESIGNED FOR COMPACT DENSITY */}
      <div className="space-y-3">
        {meetings.length === 0 && !isLoading && (
          <p className="text-slate-500 text-center py-10 bg-white rounded-2xl border border-slate-200">No meetings scheduled.</p>
        )}
        
        {meetings.map((meeting) => (
          <div key={meeting.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 relative group flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            
            {isAdmin && (
              <div className="absolute top-2 right-2 flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition">
                <button onClick={() => handleEdit(meeting)} className="p-1.5 bg-slate-100 text-slate-600 rounded-md hover:bg-slate-200"><Edit2 size={14}/></button>
                <button onClick={() => handleDelete(meeting.id)} className="p-1.5 bg-red-50 text-red-600 rounded-md hover:bg-red-100"><Trash2 size={14}/></button>
              </div>
            )}
            
            <div className="flex-1 pr-16 sm:pr-4">
              <h2 className="font-bold text-lg text-slate-900 leading-tight mb-0.5">{meeting.title}</h2>
              <p className="text-slate-500 text-sm font-medium">{meeting.time}</p>
            </div>
            
            <div className="shrink-0 w-full sm:w-auto mt-1 sm:mt-0">
              {meeting.type === 'Zoom' ? (
                <a href={meeting.linkOrLocation} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center w-full sm:w-auto bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-blue-700 transition shadow-sm">
                  <Video size={16} className="mr-2" /> Join Zoom
                </a>
              ) : (
                <div className="inline-flex items-center justify-center w-full sm:w-auto bg-slate-50 text-slate-700 px-4 py-2.5 rounded-lg text-sm font-bold border border-slate-200">
                  <MapPin size={16} className="mr-2 text-teal-700" /> {meeting.linkOrLocation}
                </div>
              )}
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}