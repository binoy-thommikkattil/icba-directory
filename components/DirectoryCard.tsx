'use client';
import { motion, PanInfo } from 'framer-motion';
import { Phone, MapPin, Edit, FileText, Share2, Loader2, Home, HeartHandshake, Users, X, Clock } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { useState } from 'react';
import { jsPDF } from 'jspdf';
import { logActivity } from '@/lib/logger';

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
        resolve({ dataUrl: canvas.toDataURL('image/jpeg', 1.0), width: img.width, height: img.height });
      } else {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = imageUrl;
  });
};

export interface Individual {
  name: string;
  relationship: string;
  bloodGroup?: string;
  tags?: string[];
}

export interface MemberProps {
  id?: string;
  familyName?: string;
  members?: Individual[];
  currentAddress?: string;
  nativeAddress?: string;
  homeAssembly?: string;
  commendedAssembly?: string;
  primaryMobile?: string;
  photoUrl?: string;
  status?: string;
  notes?: string;
  lastEdited?: string;
  hasPendingEdit?: boolean;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

export default function DirectoryCard({ 
  id = '', familyName = 'Unknown', members = [], currentAddress = '', nativeAddress = '', 
  homeAssembly = '', commendedAssembly = '', primaryMobile = '', photoUrl = '', 
  status = 'Active', notes = '', lastEdited = new Date().toISOString(), hasPendingEdit = false, 
  onSwipeLeft, onSwipeRight 
}: MemberProps) {
  
  const { user } = useAuth();
  const [isSharing, setIsSharing] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false); 

  // EXACT IST FORMATTING ADDED HERE
  const formattedDate = lastEdited 
    ? new Date(lastEdited).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }) 
    : 'Unknown';

  const isAdmin = user?.email?.toLowerCase().includes('admin');

  const handleSharePDF = async () => {
    setIsSharing(true);
    await logActivity(user, "Exported/Shared Card", `Exported the directory card for the ${familyName}.`);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210;
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);
      let yPos = 30;
      
      pdf.setFontSize(24);
      pdf.text('ICBA Directory', margin, yPos);
      yPos += 15;
      
      pdf.setFontSize(20);
      pdf.text(`${familyName}`, margin, yPos);
      yPos += 10;

      if (photoUrl) {
        const imgData = await getBase64ImageFromUrl(photoUrl);
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

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Family Members:', margin, yPos);
      pdf.setFont('helvetica', 'normal');
      yPos += 7;
      if (members.length > 0) {
        members.forEach((member: Individual) => {
          const memberText = `• ${member.name} ${member.relationship ? `(${member.relationship})` : ''}`;
          pdf.text(memberText, margin + 5, yPos);
          yPos += 6;
        });
      } else {
        pdf.text('No members listed.', margin + 5, yPos);
        yPos += 6;
      }
      yPos += 5;

      if (primaryMobile) {
        pdf.setFont('helvetica', 'bold');
        pdf.text('Primary Mobile:', margin, yPos);
        pdf.setFont('helvetica', 'normal');
        pdf.text(primaryMobile, margin + 40, yPos);
        yPos += 10;
      }
      if (currentAddress) {
        pdf.setFont('helvetica', 'bold');
        pdf.text('Current Address:', margin, yPos);
        pdf.setFont('helvetica', 'normal');
        yPos += 7;
        const addressLines = pdf.splitTextToSize(currentAddress, contentWidth - 5);
        addressLines.forEach((line: string) => {
          pdf.text(line, margin + 5, yPos);
          yPos += 6;
        });
        yPos += 5;
      }
      if (nativeAddress) {
        pdf.setFont('helvetica', 'bold');
        pdf.text('Native Address:', margin, yPos);
        pdf.setFont('helvetica', 'normal');
        yPos += 7;
        const nativeLines = pdf.splitTextToSize(nativeAddress, contentWidth - 5);
        nativeLines.forEach((line: string) => {
          pdf.text(line, margin + 5, yPos);
          yPos += 6;
        });
        yPos += 5;
      }
      if (homeAssembly) {
        pdf.setFont('helvetica', 'bold');
        pdf.text('Home Assembly:', margin, yPos);
        pdf.setFont('helvetica', 'normal');
        pdf.text(homeAssembly, margin + 40, yPos);
        yPos += 10;
      }
      if (commendedAssembly) {
        pdf.setFont('helvetica', 'bold');
        pdf.text('Commended Assembly:', margin, yPos);
        pdf.setFont('helvetica', 'normal');
        pdf.text(commendedAssembly, margin + 50, yPos);
        yPos += 10;
      }
      if (notes) {
        pdf.setFont('helvetica', 'bold');
        pdf.text('Additional Info:', margin, yPos);
        pdf.setFont('helvetica', 'normal');
        yPos += 7;
        const noteLines = pdf.splitTextToSize(notes, contentWidth - 5);
        noteLines.forEach((line: string) => {
          pdf.text(line, margin + 5, yPos);
          yPos += 6;
        });
      }

      const pdfBlob = pdf.output('blob');
      const file = new File([pdfBlob], `${familyName}_Family_Directory.pdf`, { type: 'application/pdf' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: `${familyName} Details` });
      } else {
        pdf.save(`${familyName}_Family_Directory.pdf`);
      }
    } catch (error) {
      console.error('Error generating/sharing PDF:', error);
      alert('Could not share PDF. Your device may not support file sharing.');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <>
      {isLightboxOpen && photoUrl && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4" onClick={() => setIsLightboxOpen(false)}>
          <button className="absolute top-6 right-6 text-white p-2 bg-white/10 rounded-full hover:bg-white/20 transition"><X size={24} /></button>
          <img src={photoUrl} alt="Full size" className="max-w-full max-h-[90vh] object-contain" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      <motion.div
        className="w-full bg-white flex flex-col relative shadow-sm rounded-b-2xl print:shadow-none"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        onDragEnd={(event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
          const swipe = Math.abs(info.offset.x) * info.velocity.x;
          if (swipe < -10000 && onSwipeLeft) onSwipeLeft();
          else if (swipe > 10000 && onSwipeRight) onSwipeRight();
        }}
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-start gap-4">
          
          <div className="flex-1 min-w-0">
            <h2 className="text-3xl font-serif font-bold text-slate-900 break-words leading-tight mb-2">
              {familyName}
            </h2>
            {/* ONLY DISPLAY STATUS IF INACTIVE */}
            {status === 'Inactive' && (
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold border bg-slate-50 text-slate-500 border-slate-200 uppercase tracking-widest inline-block">
                  {status}
                </span>
              </div>
            )}
          </div>

          <div className="flex space-x-2 print:hidden shrink-0 mt-1">
            <button onClick={handleSharePDF} disabled={isSharing} className="p-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition flex items-center">
              {isSharing ? <Loader2 size={18} className="animate-spin" /> : <Share2 size={18} />}
            </button>
            
            {user && id && (
              isAdmin || !hasPendingEdit ? (
                <Link href={`/edit-family/${id}`} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 flex items-center transition">
                  <Edit size={16} className="mr-2" /> Edit
                </Link>
              ) : (
                <div className="px-4 py-2 bg-amber-50 text-amber-700 rounded-lg text-sm font-medium border border-amber-200 flex items-center cursor-not-allowed opacity-80" title="An edit is waiting for admin approval">
                  <Clock size={16} className="mr-1.5" /> Pending
                </div>
              )
            )}
          </div>
        </div>

        {photoUrl ? (
          <div className="relative h-64 w-full bg-slate-100 print:hidden overflow-hidden cursor-pointer group" onClick={() => setIsLightboxOpen(true)}>
            <img src={photoUrl} alt={`${familyName}`} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition flex items-center justify-center">
              <span className="bg-black/60 text-white px-4 py-2 rounded-full opacity-0 group-hover:opacity-100 transition text-sm font-medium backdrop-blur-sm">Click to expand</span>
            </div>
          </div>
        ) : (
          <div className="h-24 w-full bg-gradient-to-r from-teal-600 to-teal-800 flex items-center justify-center print:hidden">
            <Users size={32} className="text-white opacity-40" />
          </div>
        )}

        <div className="p-6 space-y-8">
          
          {members.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Family Members</h3>
              <p className="text-slate-800 font-medium leading-relaxed">
                {members.map(m => m.name).join(', ')}
              </p>
            </div>
          )}

          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Contact Info</h3>
            <div className="space-y-4 text-slate-700">
              {primaryMobile && (
                <div className="flex items-center gap-3">
                  <Phone size={20} className="text-teal-600 shrink-0" />
                  <a href={`tel:${primaryMobile}`} className="font-medium hover:text-teal-700">{primaryMobile}</a>
                </div>
              )}
              {currentAddress && (
                <div className="flex items-start gap-3">
                  <MapPin size={20} className="text-teal-600 mt-1 shrink-0" />
                  <div>
                    <p className="leading-snug text-sm font-bold text-slate-800 mb-0.5">Current Address</p>
                    <p className="leading-snug">{currentAddress}</p>
                  </div>
                </div>
              )}
              {nativeAddress && (
                <div className="flex items-start gap-3">
                  <MapPin size={20} className="text-slate-400 mt-1 shrink-0" />
                  <div>
                    <p className="leading-snug text-sm font-bold text-slate-800 mb-0.5">Native Address</p>
                    <p className="leading-snug text-slate-600">{nativeAddress}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {(homeAssembly || commendedAssembly || notes) && (
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Additional Info</h3>
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                {homeAssembly && (
                  <div className="flex items-start gap-3 text-slate-700">
                    <Home size={18} className="text-teal-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase">Home Assembly</p>
                      <p className="text-sm font-medium">{homeAssembly}</p>
                    </div>
                  </div>
                )}
                {commendedAssembly && (
                  <div className="flex items-start gap-3 text-slate-700">
                    <HeartHandshake size={18} className="text-teal-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase">Commended Assembly</p>
                      <p className="text-sm font-medium">{commendedAssembly}</p>
                    </div>
                  </div>
                )}
                {notes && (
                  <div className="flex items-start gap-3 text-slate-700 pt-2 border-t border-slate-200 mt-2">
                    <FileText size={18} className="text-teal-600 shrink-0 mt-0.5" />
                    <p className="text-sm leading-relaxed">{notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          {/* FORMATTED DATE USED HERE */}
          <div className="pt-4 border-t border-slate-100 text-xs text-slate-400">Last Modified: {formattedDate}</div>
        </div>
      </motion.div>
    </>
  );
}