'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Users as UsersIcon, Calendar, ShieldCheck, Loader2, PlusCircle, Droplet, History, BookOpen, Music } from 'lucide-react';
// ADDED: where and onSnapshot for our access scanner
import { collection, query, where, onSnapshot, writeBatch, doc } from 'firebase/firestore';
import { read, utils as xlsxUtils } from 'xlsx';
import { db } from '@/lib/firebase';

const normalizeHeader = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '');

const parseCsvText = (text: string) => {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentValue = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        currentValue += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      currentRow.push(currentValue);
      currentValue = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && text[i + 1] === '\n') {
        i++;
      }
      currentRow.push(currentValue);
      rows.push(currentRow);
      currentRow = [];
      currentValue = '';
      continue;
    }

    currentValue += char;
  }

  if (currentValue !== '' || currentRow.length > 0) {
    currentRow.push(currentValue);
    rows.push(currentRow);
  }

  return rows.filter(row => row.some(cell => cell.trim() !== ''));
};

const parseBoolean = (value: string) => {
  const normalized = value?.trim().toLowerCase();
  return normalized === 'yes' || normalized === 'true' || normalized === 'y' || normalized === '1';
};

const parseTags = (value: string) => {
  return value
    .split(',')
    .map(tag => tag.trim())
    .filter(Boolean);
};

const parseRowsFromFile = async (file: File, buffer: ArrayBuffer) => {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension === 'xlsx' || extension === 'xls') {
    const workbook = read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = xlsxUtils.sheet_to_json<string[]>(worksheet, { header: 1, defval: '' }) as string[][];
    return rows.filter(row => row.some(cell => String(cell).trim() !== ''));
  }

  const text = new TextDecoder().decode(buffer);
  return parseCsvText(text);
};

type ImportFamily = {
  familyName: string;
  status: string;
  primaryMobile: string;
  currentAddress: string;
  nativeAddress: string;
  homeAssembly: string;
  commendedAssembly: string;
  notes: string;
  isPendingCreation: boolean;
  members: Array<{
    name: string;
    mobile: string;
    tags: string[];
    bloodGroup: string;
    willingToDonate: boolean;
  }>;
};

export default function Dashboard() {
  // ADDED: userProfile so we can match their name
  const { user, role, userProfile, loading } = useAuth();
  const router = useRouter();

  // NEW STATE: Visibility toggles for the three private buttons
  const [showYouth, setShowYouth] = useState(false);
  const [showBachelors, setShowBachelors] = useState(false);
  const [showSundaySchool, setShowSundaySchool] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) router.push('/login');
      else if (role === 'pending') router.push('/waiting-room');
    }
  }, [user, role, loading, router]);

  // NEW EFFECT: The Access Scanner
  useEffect(() => {
    // If they are an admin, show everything immediately and skip the database check
    if (role === 'admin') {
      setShowYouth(true);
      setShowBachelors(true);
      setShowSundaySchool(true);
      return;
    }

    // If they aren't loaded yet, do nothing
    if (!userProfile) return;

    const q = query(collection(db, 'members'), where('isPendingCreation', '==', false), where('status', '==', 'Active'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let inYouth = false;
      let inBachelors = false;
      let inSundaySchool = false;

      snapshot.docs.forEach(doc => {
        const family = doc.data();
        const isMyFamily = family.submittedBy === userProfile?.name || family.authorEmail === user?.email;

        family.members?.forEach((member: { name?: string; tags?: string[] }) => {
          // Check if this specific member in the loop matches our logged-in user OR if they own the family
          const isMatch = member.name?.toLowerCase() === userProfile?.name?.toLowerCase() || isMyFamily;

          if (isMatch && member.tags) {
            const tags = member.tags.map((t: string) => t.toLowerCase());

            if (tags.some((t: string) => t.includes('youth') || t.includes('young family'))) inYouth = true;
            if (tags.some((t: string) => t.includes('bachelor') || t.includes('spinster') || t.includes('unmarried'))) inBachelors = true;
            if (tags.some((t: string) => t.includes('sunday school'))) inSundaySchool = true;
          }
        });
      });

      setShowYouth(inYouth);
      setShowBachelors(inBachelors);
      setShowSundaySchool(inSundaySchool);
    });

    return () => unsubscribe();
  }, [role, userProfile, user]);

  if (loading || !user) return <div className="flex min-h-screen items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-teal-600" size={32} /></div>;

  const handleBulkUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!confirm(`Are you sure you want to bulk import from ${file.name}?`)) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const parsedRows = await parseRowsFromFile(file, buffer);
        if (parsedRows.length < 2) {
          throw new Error('The selected file does not contain any import rows.');
        }

        const headers = parsedRows[0].map(header => String(header).trim());
        const headerMap = headers.reduce<Record<string, number>>((acc, header, index) => {
          acc[normalizeHeader(header)] = index;
          return acc;
        }, {});

        const getCellValue = (row: string[], key: string) => {
          const index = headerMap[normalizeHeader(key)];
          if (index === undefined) return '';
          return String(row[index] || '').trim();
        };

        const families: ImportFamily[] = [];

        for (const row of parsedRows.slice(1)) {
          const familyName = getCellValue(row as string[], 'Family Name');
          if (!familyName) continue;

          let family = families.find(item => item.familyName === familyName);
          if (!family) {
            family = {
              familyName,
              status: getCellValue(row as string[], 'Status') || 'Active',
              primaryMobile: getCellValue(row as string[], 'Mobile Number') || getCellValue(row as string[], 'Mobile') || '',
              currentAddress: getCellValue(row as string[], 'Current Address') || '',
              nativeAddress: getCellValue(row as string[], 'Native Address') || '',
              homeAssembly: getCellValue(row as string[], 'Home Assembly') || '',
              commendedAssembly: getCellValue(row as string[], 'Commended Assembly') || '',
              notes: getCellValue(row as string[], 'Additional Info') || '',
              isPendingCreation: false,
              members: []
            };
            families.push(family);
          }

          const memberName = getCellValue(row as string[], 'Member Name');
          if (!memberName) continue;

          family.members.push({
            name: memberName,
            mobile: getCellValue(row as string[], 'Mobile Number') || getCellValue(row as string[], 'Mobile') || '',
            tags: parseTags(getCellValue(row as string[], 'Tags')),
            bloodGroup: getCellValue(row as string[], 'Blood Group') || '',
            willingToDonate: parseBoolean(getCellValue(row as string[], 'Willing To Donate'))
          });
        }

        if (families.length === 0) {
          throw new Error('No valid family rows could be grouped from the file.');
        }

        const batch = writeBatch(db);
        families.forEach(family => {
          const docRef = doc(collection(db, 'members'));
          batch.set(docRef, family);
        });

        await batch.commit();

        event.target.value = '';
        alert(`Success! Grouped and uploaded ${families.length} distinct families.`);
      } catch (error) {
        console.error('Bulk upload failed:', error);
        alert(error instanceof Error ? error.message : 'Bulk upload failed.');
      }
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="w-full max-w-xl mx-auto min-h-screen bg-slate-50 p-6 pb-24 md:border-x border-slate-200">
      <header className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-slate-900 mb-1">Dashboard</h1>
      </header>

      {/* CORE MEMBER FEATURES */}
      <div className="grid grid-cols-1 gap-4 mb-6">
        {/* NEW STATEMENT OF FAITH BUTTON */}
        <Link href="/dashboard/beliefs" className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:border-emerald-400 transition flex items-center gap-4 group">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition">
            <BookOpen size={24} />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 text-lg">Our Beliefs</h2>
            <p className="text-sm text-slate-500">Statement of Faith</p>
          </div>
        </Link>

        <Link href="/directory" className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:border-teal-400 transition flex items-center gap-4 group">
          <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition"><UsersIcon size={24} /></div>
          <div><h2 className="font-bold text-slate-800 text-lg">Directory</h2><p className="text-sm text-slate-500">Search families and members</p></div>
        </Link>

        <Link href="/meetings" className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-400 transition flex items-center gap-4 group">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition"><Calendar size={24} /></div>
          <div><h2 className="font-bold text-slate-800 text-lg">Meetings</h2><p className="text-sm text-slate-500">Service schedule and links</p></div>
        </Link>

        <Link href="/prayer" className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:border-rose-400 transition flex items-center gap-4 group">
          <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center group-hover:bg-rose-600 transition">
            <span className="text-2xl" role="img" aria-label="praying hands">🙏</span>
          </div>
          <div>
            <h2 className="font-bold text-slate-800 text-lg">Prayer Points</h2>
            <p className="text-sm text-slate-500">Current needs of the assembly</p>
          </div>
        </Link>
        <Link href="/songbook" className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:border-sky-400 transition flex items-center gap-4 group">
          <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center group-hover:bg-sky-600 group-hover:text-white transition">
            <Music size={24} />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 text-lg">Songbook</h2>
            <p className="text-sm text-slate-500">Lyrics, translations, and chords</p>
          </div>
        </Link>

        {/* CONDITIONALLY RENDERED BUTTONS */}
        {showYouth && (
          <Link href="/youth" className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:border-purple-400 transition flex items-center gap-4 group animate-in fade-in">
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition"><UsersIcon size={24} /></div>
            <div><h2 className="font-bold text-slate-800 text-lg">Youth Group</h2><p className="text-sm text-slate-500">Youth & young families</p></div>
          </Link>
        )}

        {showBachelors && (
          <Link href="/bachelors" className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:border-indigo-400 transition flex items-center gap-4 group animate-in fade-in">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition"><UsersIcon size={24} /></div>
            <div><h2 className="font-bold text-slate-800 text-lg">Bachelor Meeting Members</h2><p className="text-sm text-slate-500">Bachelor Meeting Members</p></div>
          </Link>
        )}

        {showSundaySchool && (
          <Link href="/sunday-school" className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:border-amber-400 transition flex items-center gap-4 group animate-in fade-in">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition"><UsersIcon size={24} /></div>
            <div><h2 className="font-bold text-slate-800 text-lg">Sunday School</h2><p className="text-sm text-slate-500">Students & Teachers</p></div>
          </Link>
        )}

        <Link href="/blood-registry" className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:border-red-400 transition flex items-center gap-4 group">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition"><Droplet size={24} /></div>
          <div><h2 className="font-bold text-slate-800 text-lg">Blood Registry</h2><p className="text-sm text-slate-500">Find willing donors in emergencies</p></div>
        </Link>
      </div>

      {role === 'approved' && (
        <div className="bg-teal-50 p-5 rounded-2xl border border-teal-100 flex items-center justify-between gap-4 shadow-sm">
          <div><h3 className="text-sm font-bold text-teal-900">Missing your details?</h3><p className="text-xs text-teal-700 mt-0.5">Add your profile to the directory.</p></div>
          <Link href="/add-family" className="px-4 py-2.5 bg-teal-600 text-white text-sm font-bold rounded-xl hover:bg-teal-700 transition shrink-0 shadow-sm">Add Family</Link>
        </div>
      )}

      {/* ADMIN CONTROLS WITH ALL 4 BUTTONS */}
      {role === 'admin' && (
        <div className="mt-8 animate-in fade-in slide-in-from-bottom-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">Admin Controls</h3>
          <div className="grid grid-cols-1 gap-4">
            <Link href="/approvals" className="bg-slate-800 p-5 rounded-2xl shadow-md border border-slate-700 hover:bg-slate-900 transition flex items-center gap-4 group">
              <div className="w-12 h-12 bg-slate-700 text-amber-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition"><ShieldCheck size={24} /></div>
              <div><h2 className="font-bold text-white text-lg">Pending Approvals</h2><p className="text-sm text-slate-400">Review users, new families & edits</p></div>
            </Link>
            <label className="bg-slate-800 text-white p-4 rounded-2xl shadow-md font-bold hover:bg-slate-900 transition flex items-center justify-center w-full mb-4 cursor-pointer">
              <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleBulkUpload} />
              📊 Bulk Upload Members (CSV/Excel)
            </label>
            <Link href="/manage-users" className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-400 transition flex items-center gap-4 group">
              <div className="w-12 h-12 bg-slate-50 text-blue-600 rounded-xl flex items-center justify-center group-hover:bg-blue-50 transition"><UsersIcon size={24} /></div>
              <div><h2 className="font-bold text-slate-800 text-lg">Manage Users</h2><p className="text-sm text-slate-500">View accounts and revoke access</p></div>
            </Link>

            <Link href="/add-family" className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:border-teal-400 transition flex items-center gap-4 group">
              <div className="w-12 h-12 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center group-hover:bg-teal-50 group-hover:text-teal-600 transition"><PlusCircle size={24} /></div>
              <div><h2 className="font-bold text-slate-800 text-lg">Add New Family</h2><p className="text-sm text-slate-500">Directly bypass approval to add a family</p></div>
            </Link>

            <Link href="/activity-log" className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:border-indigo-400 transition flex items-center gap-4 group">
              <div className="w-12 h-12 bg-slate-50 text-indigo-600 rounded-xl flex items-center justify-center group-hover:bg-indigo-50 transition"><History size={24} /></div>
              <div><h2 className="font-bold text-slate-800 text-lg">Activity Log</h2><p className="text-sm text-slate-500">System audit trail</p></div>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}