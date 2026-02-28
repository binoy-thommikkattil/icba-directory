'use client';
import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import DirectoryCard, { Individual } from '@/components/DirectoryCard';
import { Search, ArrowLeft, Download, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import Link from 'next/link';
import { jsPDF } from 'jspdf';
import { useRouter } from 'next/navigation';

const getBase64ImageFromUrl = async (imageUrl: string): Promise<{ dataUrl: string, width: number, height: number } | null> => {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve({ dataUrl: canvas.toDataURL('image/jpeg', 0.95), width: img.width, height: img.height });
      } else {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = imageUrl;
  });
};

export default function DirectoryPage() {
  const [families, setFamilies] = useState<any[]>([]);
  const [dbLoading, setDbLoading] = useState(true); 
  const [isExporting, setIsExporting] = useState(false);
  const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const { user, loading: authLoading } = useAuth(); 
  const router = useRouter();

  // Check if current user is admin to determine visibility of Inactive members
  const isAdmin = user?.email?.toLowerCase().includes('admin');

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'members'), where('isPendingCreation', '==', false));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setFamilies(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setDbLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const sortedFamilies = useMemo(() => {
    return [...families].sort((a, b) => a.familyName.localeCompare(b.familyName));
  }, [families]);

  const allIndividuals = useMemo(() => {
    let list: any[] = [];
    families.forEach(family => {
      family.members?.forEach((ind: Individual) => {
        list.push({ ...ind, familyId: family.id, familyName: family.familyName, primaryMobile: family.primaryMobile, status: family.status });
      });
    });
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [families]);

  const filteredIndividuals = useMemo(() => {
    return allIndividuals.filter(ind => {
      // RULE: If user is not an admin, immediately hide Inactive members
      if (!isAdmin && ind.status === 'Inactive') return false;

      // RULE: Match search term
      return ind.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
             ind.familyName.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [allIndividuals, searchTerm, isAdmin]);

  const handleSwipeLeft = () => {
    const idx = families.findIndex(f => f.id === selectedFamilyId);
    if (idx < families.length - 1) setSelectedFamilyId(families[idx + 1].id);
  };

  const handleSwipeRight = () => {
    const idx = families.findIndex(f => f.id === selectedFamilyId);
    if (idx > 0) setSelectedFamilyId(families[idx - 1].id);
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);

      pdf.setFontSize(24);
      pdf.text('ICBA Directory', pageWidth / 2, 40, { align: 'center' });
      pdf.setFontSize(12);
      pdf.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, 50, { align: 'center' });

      pdf.addPage();
      pdf.setFontSize(18);
      pdf.text('Index', margin, 30);
      pdf.setFontSize(10);

      let yPos = 45;
      sortedFamilies.forEach((family, index) => {
        // Exclude inactive from the Book completely unless you want them printed
        if (family.status === 'Inactive') return;

        if (yPos > pageHeight - 30) {
          pdf.addPage();
          yPos = 30;
        }
        pdf.text(`${index + 1}. ${family.familyName} Family`, margin, yPos);
        yPos += 7;
      });

      for (const family of sortedFamilies) {
        // Exclude inactive from the printed book
        if (family.status === 'Inactive') continue;

        pdf.addPage();
        yPos = 30;
        
        pdf.setFontSize(20);
        pdf.text(`${family.familyName} Family`, margin, yPos);
        yPos += 10;

        if (family.photoUrl) {
          const imgData = await getBase64ImageFromUrl(family.photoUrl);
          if (imgData) {
            let printWidth = 80; 
            let printHeight = 60; 
            const imgRatio = imgData.width / imgData.height;
            const targetRatio = printWidth / printHeight;

            if (imgRatio > targetRatio) {
              printHeight = printWidth / imgRatio;
            } else {
              printWidth = printHeight * imgRatio;
            }

            pdf.addImage(imgData.dataUrl, 'JPEG', margin, yPos, printWidth, printHeight);
            yPos += printHeight + 12; 
          }
        }

        // Status removed from PDF here entirely!
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Family Members:', margin, yPos);
        pdf.setFont('helvetica', 'normal');
        yPos += 7;

        if (family.members && family.members.length > 0) {
          family.members.forEach((member: Individual) => {
            const memberText = `• ${member.name} ${member.relationship ? `(${member.relationship})` : ''}`;
            pdf.text(memberText, margin + 5, yPos);
            yPos += 6;
          });
        } else {
          pdf.text('No members listed.', margin + 5, yPos);
          yPos += 6;
        }
        yPos += 5;

        if (yPos > 250) { pdf.addPage(); yPos = 30; }

        if (family.primaryMobile) {
          pdf.setFont('helvetica', 'bold');
          pdf.text('Primary Mobile:', margin, yPos);
          pdf.setFont('helvetica', 'normal');
          pdf.text(family.primaryMobile, margin + 40, yPos);
          yPos += 10;
        }

        if (family.currentAddress) {
          pdf.setFont('helvetica', 'bold');
          pdf.text('Current Address:', margin, yPos);
          pdf.setFont('helvetica', 'normal');
          yPos += 7;
          const addressLines = pdf.splitTextToSize(family.currentAddress, contentWidth - 5);
          addressLines.forEach((line: string) => {
            pdf.text(line, margin + 5, yPos);
            yPos += 6;
          });
          yPos += 5;
        }

        if (family.nativeAddress) {
          pdf.setFont('helvetica', 'bold');
          pdf.text('Native Address:', margin, yPos);
          pdf.setFont('helvetica', 'normal');
          yPos += 7;
          const nativeLines = pdf.splitTextToSize(family.nativeAddress, contentWidth - 5);
          nativeLines.forEach((line: string) => {
            pdf.text(line, margin + 5, yPos);
            yPos += 6;
          });
          yPos += 5;
        }

        if (family.homeAssembly) {
          pdf.setFont('helvetica', 'bold');
          pdf.text('Home Assembly:', margin, yPos);
          pdf.setFont('helvetica', 'normal');
          pdf.text(family.homeAssembly, margin + 40, yPos);
          yPos += 10;
        }

        if (family.commendedAssembly) {
          pdf.setFont('helvetica', 'bold');
          pdf.text('Commended Assembly:', margin, yPos);
          pdf.setFont('helvetica', 'normal');
          pdf.text(family.commendedAssembly, margin + 50, yPos);
          yPos += 10;
        }

        if (family.notes) {
          pdf.setFont('helvetica', 'bold');
          pdf.text('Additional Info:', margin, yPos);
          pdf.setFont('helvetica', 'normal');
          yPos += 7;
          const noteLines = pdf.splitTextToSize(family.notes, contentWidth - 5);
          noteLines.forEach((line: string) => {
            pdf.text(line, margin + 5, yPos);
            yPos += 6;
          });
        }
      }

      pdf.save(`ICBA_Directory_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('PDF export error:', error);
      alert('Failed to export PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  if (authLoading || !user) return <div className="flex h-screen items-center justify-center font-bold text-slate-500">Verifying access...</div>;
  if (dbLoading) return <div className="p-8 flex h-screen items-center justify-center font-bold text-slate-500">Loading directory data...</div>;

  const selectedFamilyData = families.find(f => f.id === selectedFamilyId);

  return (
    <main className="w-full relative overflow-hidden">
      {selectedFamilyId === null ? (
        <div className="p-6">
          <Link href="/" className="mb-6 inline-flex items-center text-sm font-bold text-slate-500 hover:text-slate-800 transition">
            <ArrowLeft size={16} className="mr-1" /> Back to Dashboard
          </Link>

          <div className="mb-6">
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="flex items-center justify-center w-full sm:w-auto bg-teal-700 text-white px-5 py-3 rounded-xl text-sm font-bold hover:bg-teal-800 transition shadow-md disabled:opacity-70"
            >
              {isExporting ? <><Loader2 size={18} className="mr-2 animate-spin" /> Generating PDF...</> : <><Download size={18} className="mr-2" /> Download PDF Book</>}
            </button>
          </div>

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

          <div className="space-y-3 pb-20">
            {filteredIndividuals.map((ind, index) => (
              <button
                key={`${ind.familyId}-${index}`}
                onClick={() => setSelectedFamilyId(ind.familyId)}
                className="w-full bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:border-teal-400 transition flex text-left"
              >
                {/* PURE MINIMALISM: Nothing but the member's name */}
                <h3 className="font-serif font-bold text-lg text-slate-900 truncate">{ind.name}</h3>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
          <button onClick={() => setSelectedFamilyId(null)} className="m-4 px-4 py-2 flex items-center text-slate-600 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50">
            <ArrowLeft size={16} className="mr-2" /> Back to Directory
          </button>
          <DirectoryCard {...selectedFamilyData} onSwipeLeft={handleSwipeLeft} onSwipeRight={handleSwipeRight} />
        </div>
      )}
    </main>
  );
}