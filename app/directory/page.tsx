'use client';
import { useState, useEffect, useMemo, Suspense } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import DirectoryCard, { Individual } from '@/components/DirectoryCard';
import { Search, ArrowLeft, Download, Loader2, Users, LayoutGrid } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import Link from 'next/link';
import { jsPDF } from 'jspdf';
import { useRouter, useSearchParams } from 'next/navigation';
import { getBase64ImageFromUrl } from '@/lib/imageUtils';
import { getMemberCallContact, getMemberWhatsAppContact } from '@/lib/phoneUtils';

function DirectoryContent() {
  const [families, setFamilies] = useState<any[]>([]);
  const [dbLoading, setDbLoading] = useState(true); 
  const [isExporting, setIsExporting] = useState(false);
  const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'families' | 'members'>('families');
  
  const { user, loading: authLoading, userProfile } = useAuth(); 
  const router = useRouter();

  // Retrieve Search Parameters natively
  const searchParams = useSearchParams();
  const filterTag = searchParams.get('tag');

  const isAdmin = userProfile?.role === 'admin';

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'members'), where('isPendingCreation', '==', false));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setFamilies(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setDbLoading(false);
      },
      (error) => {
        console.error('Failed to load directory families:', error);
        setFamilies([]);
        setDbLoading(false);
      }
    );
    return () => unsubscribe();
  }, [user]);

  const sortedFamilies = useMemo(() => {
    return [...families].sort((a, b) => a.familyName.localeCompare(b.familyName));
  }, [families]);

  const allIndividuals = useMemo(() => {
    let list: any[] = [];
    families.forEach(family => {
      family.members?.forEach((ind: Individual) => {
        list.push({
          ...ind,
          familyId: family.id,
          familyName: family.familyName,
          primaryCallCountryCode: family.primaryCallCountryCode,
          primaryCallPhone: family.primaryCallPhone,
          primaryWhatsAppCountryCode: family.primaryWhatsAppCountryCode,
          primaryWhatsAppPhone: family.primaryWhatsAppPhone,
          primaryMobile: family.primaryMobile,
          status: family.status
        });
      });
    });
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [families]);

  const visibleFamilies = useMemo(() => {
    if (isAdmin) return sortedFamilies;
    return sortedFamilies.filter((family) => family.status !== 'Inactive');
  }, [sortedFamilies, isAdmin]);

  const filteredFamilies = useMemo(() => {
    const matchedFamilies = visibleFamilies.filter((family) => {
      const haystack = [
        family.familyName,
        family.primaryMobile,
        family.homeAssembly,
        family.commendedAssembly,
        family.currentAddress,
        family.currentMapAddress,
        family.nativeAddress,
        family.nativeMapAddress,
        family.members?.map((member: Individual) => `${member.name} ${member.relationship || ''} ${member.callPhone || ''} ${member.whatsappPhone || ''}`).join(' ')
      ].filter(Boolean).join(' ').toLowerCase();

      return haystack.includes(searchTerm.toLowerCase());
    });

    return matchedFamilies;
  }, [visibleFamilies, searchTerm]);

  // Filtering Logic Appended
  const filteredIndividuals = useMemo(() => {
    const matchedIndividuals = allIndividuals.filter(ind => {
      if (!isAdmin && ind.status === 'Inactive') return false;

      // Handle Tag Filtering (H1 Request)
      if (filterTag) {
        const hasTag = ind.tags?.some((t: string) => {
            const tagStr = t.toLowerCase();
            if (filterTag === 'youth' && (tagStr.includes('youth') || tagStr.includes('young family'))) return true;
            if (filterTag === 'bachelor' && (tagStr.includes('bachelor') || tagStr.includes('unmarried') || tagStr.includes('spinster'))) return true;
            if (filterTag === 'sunday-school' && (tagStr.includes('sunday school') || tagStr.includes('sundayschool'))) return true;
            return false;
        });
        if (!hasTag) return false;
      }

      return ind.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
             ind.familyName.toLowerCase().includes(searchTerm.toLowerCase());
    });

    // Clean exact duplication
    return matchedIndividuals.filter((ind, index, self) => 
      index === self.findIndex((m) => m.name.toLowerCase() === ind.name.toLowerCase())
    );
  }, [allIndividuals, searchTerm, isAdmin, filterTag]);

  const handleSwipeLeft = () => {
    const idx = visibleFamilies.findIndex(f => f.id === selectedFamilyId);
    if (idx >= 0 && idx < visibleFamilies.length - 1) setSelectedFamilyId(visibleFamilies[idx + 1].id);
  };

  const handleSwipeRight = () => {
    const idx = visibleFamilies.findIndex(f => f.id === selectedFamilyId);
    if (idx > 0) setSelectedFamilyId(visibleFamilies[idx - 1].id);
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);

      const formattedDate = new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });

      const generatedByText = `Generated by: ${user?.displayName || user?.email || 'Authorized Member'} | ${formattedDate}`;

      const addPageFooter = () => {
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text(generatedByText, pageWidth / 2, pageHeight - 10, { align: 'center' });
        pdf.setTextColor(0, 0, 0);
      };

      pdf.setFontSize(24);
      pdf.text('ICBA Directory', pageWidth / 2, 40, { align: 'center' });
      pdf.setFontSize(12);
      pdf.text(`Generated on ${formattedDate}`, pageWidth / 2, 50, { align: 'center' });
      addPageFooter();

      pdf.addPage();
      pdf.setFontSize(18);
      pdf.text('Index', margin, 30);
      pdf.setFontSize(10);

      let yPos = 45;
      sortedFamilies.forEach((family, index) => {
        if (family.status === 'Inactive') return;

        if (yPos > pageHeight - 30) {
          addPageFooter();
          pdf.addPage();
          yPos = 30;
        }
        pdf.text(`${index + 1}. ${family.familyName}`, margin, yPos);
        yPos += 7;
      });
      addPageFooter();

      for (const family of sortedFamilies) {
        if (family.status === 'Inactive') continue;

        pdf.addPage();
        addPageFooter();
        yPos = 30;
        
        pdf.setFontSize(20);
        pdf.text(`${family.familyName}`, margin, yPos);
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

        const familyPhoneFallback = {
          primaryCallCountryCode: family.primaryCallCountryCode,
          primaryCallPhone: family.primaryCallPhone,
          primaryWhatsAppCountryCode: family.primaryWhatsAppCountryCode,
          primaryWhatsAppPhone: family.primaryWhatsAppPhone,
          primaryMobile: family.primaryMobile,
        };

        const memberContactRows = (Array.isArray(family.members) ? family.members : []).map((member: Individual) => ({
          member,
          callContact: getMemberCallContact(member, familyPhoneFallback),
          whatsappContact: getMemberWhatsAppContact(member, familyPhoneFallback),
        }));

        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Member Contacts:', margin, yPos);
        pdf.setFont('helvetica', 'normal');
        yPos += 7;

        if (memberContactRows.length > 0) {
          memberContactRows.forEach(({ member, callContact, whatsappContact }) => {
            if (yPos > pageHeight - 35) { pdf.addPage(); addPageFooter(); yPos = 30; }
            pdf.setFont('helvetica', 'bold');
            pdf.text(member.name || 'Unnamed Member', margin + 5, yPos);
            pdf.setFont('helvetica', 'normal');
            yPos += 6;

            if (callContact) {
              pdf.text(`Call: ${callContact.display}`, margin + 10, yPos);
              yPos += 6;
            }

            if (whatsappContact) {
              pdf.text(`WhatsApp: ${whatsappContact.display}`, margin + 10, yPos);
              yPos += 6;
            }

            if (!callContact && !whatsappContact) {
              pdf.text('No phone listed.', margin + 10, yPos);
              yPos += 6;
            }
            yPos += 2;
          });
        } else {
          pdf.text('No members listed.', margin + 5, yPos);
          yPos += 6;
        }
        yPos += 5;

        if (yPos > pageHeight - 40) { pdf.addPage(); addPageFooter(); yPos = 30; }

        // UPDATED: Combined Current Address Logic
        const fullCurrentAddress = [family.currentAddress, family.currentMapAddress].filter(Boolean).join(', ');
        const fullNativeAddress = [family.nativeAddress, family.nativeMapAddress].filter(Boolean).join(', ');
        if (fullCurrentAddress || fullNativeAddress) {
          pdf.setFont('helvetica', 'bold');
          pdf.text('Address:', margin, yPos);
          pdf.setFont('helvetica', 'normal');
          yPos += 7;
        }

        if (fullCurrentAddress) {
          pdf.setFont('helvetica', 'bold');
          pdf.text('Current:', margin + 5, yPos);
          pdf.setFont('helvetica', 'normal');
          yPos += 6;
          const addressLines = pdf.splitTextToSize(fullCurrentAddress, contentWidth - 5);
          addressLines.forEach((line: string) => {
            if (yPos > pageHeight - 40) { pdf.addPage(); addPageFooter(); yPos = 30; }
            pdf.text(line, margin + 10, yPos);
            yPos += 6;
          });
          yPos += 5;
        }

        if (fullNativeAddress) {
          pdf.setFont('helvetica', 'bold');
          pdf.text('Native:', margin + 5, yPos);
          pdf.setFont('helvetica', 'normal');
          yPos += 6;
          const nativeLines = pdf.splitTextToSize(fullNativeAddress, contentWidth - 5);
          nativeLines.forEach((line: string) => {
            if (yPos > pageHeight - 40) { pdf.addPage(); addPageFooter(); yPos = 30; }
            pdf.text(line, margin + 10, yPos);
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
            if (yPos > pageHeight - 40) { pdf.addPage(); addPageFooter(); yPos = 30; }
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

  const selectedFamilyData = visibleFamilies.find(f => f.id === selectedFamilyId);
  
  const pageTitle = filterTag === 'youth' ? 'Youth Directory' :
                    filterTag === 'bachelor' ? 'Bachelors Directory' :
                    filterTag === 'sunday-school' ? 'Sunday School Directory' :
                    'ICBA Directory';

  return (
    <main className="w-full max-w-xl mx-auto relative overflow-hidden md:border-x border-slate-100 min-h-screen">
      {selectedFamilyId === null ? (
        <div className="p-6">
          <Link href="/dashboard" className="mb-6 inline-flex items-center text-sm font-bold text-slate-500 hover:text-slate-800 transition">
            <ArrowLeft size={16} className="mr-1" /> Back to Dashboard
          </Link>
          
          <h1 className="text-3xl font-serif font-bold text-slate-900 mb-6">{pageTitle}</h1>

          {filterTag === 'bachelor' && <p className="text-sm text-slate-500 mb-6">Showing members with tags 'bachelor' or 'unmarried'.</p>}
          {filterTag === 'youth' && <p className="text-sm text-slate-500 mb-6">Showing members with tags 'youth' or 'young family'.</p>}
          {filterTag === 'sunday-school' && <p className="text-sm text-slate-500 mb-6">Showing members with tag 'sunday school'.</p>}

          <div className="mb-6">
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="flex items-center justify-center w-full sm:w-auto bg-teal-700 text-white px-5 py-3 rounded-xl text-sm font-bold hover:bg-teal-800 transition shadow-md disabled:opacity-70"
            >
              {isExporting ? <><Loader2 size={18} className="mr-2 animate-spin" /> Generating PDF...</> : <><Download size={18} className="mr-2" /> Download PDF Book</>}
            </button>
          </div>

          <div className="mb-6 inline-flex rounded-full border border-slate-200 bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setViewMode('families')}
              className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold transition ${viewMode === 'families' ? 'bg-teal-700 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <LayoutGrid size={16} className="mr-2" /> Families
            </button>
            <button
              type="button"
              onClick={() => setViewMode('members')}
              className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold transition ${viewMode === 'members' ? 'bg-teal-700 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <Users size={16} className="mr-2" /> Members
            </button>
          </div>

          <div className="relative mb-6">
            <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
            <input
              type="text"
              placeholder={viewMode === 'families' ? 'Search families...' : 'Search members...'}
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {viewMode === 'families' ? (
            filteredFamilies.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-xl border border-slate-200">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users size={24} className="text-slate-400" />
                </div>
                <p className="text-slate-500 font-medium">No families found.</p>
              </div>
            ) : (
              <div className="space-y-3 pb-20">
                {filteredFamilies.map((family) => (
                  <button
                    key={family.id}
                    onClick={() => setSelectedFamilyId(family.id)}
                    className="w-full bg-white p-4 rounded-2xl shadow-sm border border-slate-200 hover:border-teal-400 transition text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 shrink-0 bg-teal-50 text-teal-600 font-bold text-lg rounded-full flex items-center justify-center border border-teal-100 uppercase">
                        {family.familyName?.charAt(0) || 'F'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="font-serif font-bold text-lg text-slate-900 truncate">{family.familyName}</h3>
                            <p className="mt-1 text-sm text-slate-500">
                              {Array.isArray(family.members) ? `${family.members.length} member${family.members.length === 1 ? '' : 's'}` : 'Family profile'}
                            </p>
                          </div>
                          {family.status === 'Inactive' && (
                            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                              Inactive
                            </span>
                          )}
                        </div>
                        {family.primaryMobile && <p className="mt-2 text-sm font-medium text-teal-700">{family.primaryMobile}</p>}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )
          ) : filteredIndividuals.length === 0 ? (
             <div className="text-center py-10 bg-white rounded-xl border border-slate-200">
               <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                 <Users size={24} className="text-slate-400" />
               </div>
               <p className="text-slate-500 font-medium">No members found.</p>
             </div>
          ) : (
             <div className="space-y-3 pb-20">
              {filteredIndividuals.map((ind, index) => (
                <button
                  key={`${ind.familyId}-${index}`}
                  onClick={() => setSelectedFamilyId(ind.familyId)}
                  className="w-full bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:border-teal-400 transition flex items-center gap-4 text-left"
                >
                  <div className="w-12 h-12 shrink-0 bg-teal-50 text-teal-600 font-bold text-lg rounded-full flex items-center justify-center border border-teal-100 uppercase">
                     {ind.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-lg text-slate-900 truncate">{ind.name}</h3>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
          <button onClick={() => setSelectedFamilyId(null)} className="m-4 px-4 py-2 flex items-center text-slate-600 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50">
            <ArrowLeft size={16} className="mr-2" /> Back to List
          </button>
          <DirectoryCard {...selectedFamilyData} onSwipeLeft={handleSwipeLeft} onSwipeRight={handleSwipeRight} />
        </div>
      )}
    </main>
  );
}

export default function DirectoryPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center font-bold text-slate-500">
        <Loader2 size={24} className="mr-2 animate-spin" /> Loading Directory...
      </div>
    }>
      <DirectoryContent />
    </Suspense>
  );
}
