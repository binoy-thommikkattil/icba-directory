'use client';
import { useState, useEffect } from 'react';
import DirectoryCard from '@/components/DirectoryCard';
import { Search, ArrowLeft, Users, Megaphone, Plus, Edit2, Trash2, X, Clock } from 'lucide-react';
import Link from 'next/link';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import { logActivity } from '@/lib/logger';

// Helper for exact IST Time
const formatIST = (isoString: string) => {
  if (!isoString) return 'N/A';
  return new Date(isoString).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  });
};

export default function SubDirectory({ pageTitle, members, pageDescription, category }: { pageTitle: string, members: any[], pageDescription: string, category: string }) {
  // 1. ADDED "role" TO useAuth
  const { userProfile, user, role } = useAuth();
  const [activeTab, setActiveTab] = useState<'notices' | 'members'>('notices');
  
  // Directory State
  const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Noticeboard State
  const [notices, setNotices] = useState<any[]>([]);
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<any | null>(null);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');

  // Fetch Notices for this specific category
  useEffect(() => {
    const q = query(collection(db, 'notices'), where('category', '==', category));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedNotices = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort newest first
      fetchedNotices.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setNotices(fetchedNotices);
    });
    return () => unsubscribe();
  }, [category]);

  // Filter Members locally
  const filteredMembers = members.filter(ind =>
    ind.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ind.familyName.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const selectedFamilyData = members.find(f => f.familyId === selectedFamilyId);

  // Notice Handlers
  const handleOpenNoticeModal = (notice: any = null) => {
    if (notice) {
      setEditingNotice(notice);
      setNoticeTitle(notice.title);
      setNoticeContent(notice.content);
    } else {
      setEditingNotice(null);
      setNoticeTitle('');
      setNoticeContent('');
    }
    setIsNoticeModalOpen(true);
  };

  const handleSaveNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    const authorName = userProfile?.name || user?.displayName || user?.email || 'Unknown Member';
    const activeUser = userProfile || user;

    try {
      if (editingNotice) {
        await updateDoc(doc(db, 'notices', editingNotice.id), {
          title: noticeTitle,
          content: noticeContent,
          updatedAt: new Date().toISOString()
        });
        await logActivity(activeUser, 'Edited Notice', `Updated notice "${noticeTitle}" in ${pageTitle}`);
      } else {
        await addDoc(collection(db, 'notices'), {
          category,
          title: noticeTitle,
          content: noticeContent,
          authorName,
          // 2. SAVING THE AUTHOR'S UID AND EMAIL FOR SECURITY CHECKS
          authorUid: user?.uid || '',
          authorEmail: user?.email || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        await logActivity(activeUser, 'Added Notice', `Posted new notice "${noticeTitle}" in ${pageTitle}`);
      }
      setIsNoticeModalOpen(false);
    } catch (error) {
      console.error("Error saving notice:", error);
      alert("Failed to save notice.");
    }
  };

  const handleDeleteNotice = async (id: string, title: string) => {
    if (!confirm("Are you sure you want to delete this notice? This cannot be undone.")) return;
    try {
      await deleteDoc(doc(db, 'notices', id));
      await logActivity(userProfile || user, 'Deleted Notice', `Deleted notice "${title}" from ${pageTitle}`);
    } catch (error) {
      console.error("Error deleting notice:", error);
    }
  };

  return (
    <main className="w-full relative overflow-hidden bg-slate-50 min-h-screen">
      
      {/* Notice Modal */}
      {isNoticeModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="font-bold text-lg text-slate-900">{editingNotice ? 'Edit Notice' : 'Post New Notice'}</h2>
              <button onClick={() => setIsNoticeModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-700 bg-white rounded-full"><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveNotice} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Subject / Title</label>
                <input required type="text" className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500" value={noticeTitle} onChange={e => setNoticeTitle(e.target.value)} placeholder="e.g. Youth Meeting this Saturday" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Notice Details</label>
                <textarea required rows={5} className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500" value={noticeContent} onChange={e => setNoticeContent(e.target.value)} placeholder="Enter the details here..." />
              </div>
              <button type="submit" className="w-full bg-teal-600 text-white font-bold p-3.5 rounded-xl hover:bg-teal-700 transition shadow-sm">
                {editingNotice ? 'Update Notice' : 'Post Notice'}
              </button>
            </form>
          </div>
        </div>
      )}

      {selectedFamilyId === null ? (
        <div className="p-6 pb-24 max-w-2xl mx-auto">
          <Link href="/" className="mb-6 inline-flex items-center text-sm font-bold text-slate-500 hover:text-slate-800 transition">
            <ArrowLeft size={16} className="mr-1" /> Back to Dashboard
          </Link>

          <h1 className="text-3xl font-serif font-bold text-slate-900 mb-2">{pageTitle}</h1>
          <p className="text-sm text-slate-500 mb-6">{pageDescription}</p>

          {/* THE TABS */}
          <div className="flex border-b border-slate-200 mb-6">
            <button 
              onClick={() => setActiveTab('notices')}
              className={`flex-1 py-3 text-sm font-bold border-b-2 flex justify-center items-center transition ${activeTab === 'notices' ? 'border-teal-600 text-teal-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              <Megaphone size={18} className="mr-2"/> Noticeboard
            </button>
            <button 
              onClick={() => setActiveTab('members')}
              className={`flex-1 py-3 text-sm font-bold border-b-2 flex justify-center items-center transition ${activeTab === 'members' ? 'border-teal-600 text-teal-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              <Users size={18} className="mr-2"/> Directory ({filteredMembers.length})
            </button>
          </div>

          {/* TAB CONTENT: NOTICEBOARD */}
          {activeTab === 'notices' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <button 
                onClick={() => handleOpenNoticeModal()} 
                className="w-full mb-6 bg-white border-2 border-dashed border-slate-300 text-slate-500 hover:text-teal-600 hover:border-teal-400 hover:bg-teal-50 p-4 rounded-xl font-bold flex items-center justify-center transition"
              >
                <Plus size={20} className="mr-2" /> Add New Notice
              </button>

              <div className="space-y-4">
                {notices.map((notice) => {
                  
                  // 3. SECURITY CHECK: Determine if they can edit/delete this post
                  const isOwner = user?.uid === notice.authorUid || user?.email === notice.authorEmail;
                  const canModify = role === 'admin' || isOwner;

                  return (
                    <div key={notice.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 relative group">
                      
                      {/* 4. ONLY SHOW BUTTONS IF THEY ARE OWNER OR ADMIN */}
                      {canModify && (
                        <div className="absolute top-4 right-4 flex gap-2">
                          <button onClick={() => handleOpenNoticeModal(notice)} className="p-1.5 bg-slate-100 text-slate-600 hover:text-teal-600 rounded-md"><Edit2 size={14}/></button>
                          <button onClick={() => handleDeleteNotice(notice.id, notice.title)} className="p-1.5 bg-slate-100 text-slate-600 hover:text-red-600 rounded-md"><Trash2 size={14}/></button>
                        </div>
                      )}

                      <h3 className="font-bold text-lg text-slate-900 mb-2 pr-16">{notice.title}</h3>
                      <p className="text-slate-600 text-sm whitespace-pre-wrap leading-relaxed mb-4">{notice.content}</p>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs text-slate-400">
                        <span className="font-medium text-slate-500">Posted by: {notice.authorName}</span>
                        <span className="flex items-center"><Clock size={12} className="mr-1" /> {formatIST(notice.updatedAt || notice.createdAt)}</span>
                      </div>
                    </div>
                  );
                })}
                {notices.length === 0 && (
                  <div className="text-center py-10 bg-white rounded-xl border border-slate-200">
                    <Megaphone size={32} className="text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm">No notices posted yet. Be the first!</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB CONTENT: MEMBERS */}
          {activeTab === 'members' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="relative mb-6">
                <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Search by name..."
                  className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 shadow-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                {filteredMembers.length > 0 ? (
                  filteredMembers.map((ind, index) => (
                    <button
                      key={`${ind.familyId}-${index}`}
                      onClick={() => setSelectedFamilyId(ind.familyId)}
                      className="w-full bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:border-teal-400 transition flex items-center gap-4 text-left"
                    >
                      <div className="w-10 h-10 shrink-0 bg-teal-50 text-teal-600 font-bold text-base rounded-full flex items-center justify-center border border-teal-100 uppercase">
                         {ind.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-serif font-bold text-lg text-slate-900 truncate">{ind.name}</h3>
                        <p className="text-xs text-slate-500 truncate">View {ind.familyName} Family</p>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-10 bg-white rounded-xl border border-slate-200">
                    <Users size={24} className="text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium text-sm">No members found matching this tag.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-3xl mx-auto md:p-8">
          <button onClick={() => setSelectedFamilyId(null)} className="m-4 px-4 py-2 flex items-center text-slate-600 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 transition">
            <ArrowLeft size={16} className="mr-2" /> Back to Noticeboard
          </button>
          <DirectoryCard {...selectedFamilyData?.fullFamilyData} />
        </div>
      )}
    </main>
  );
}