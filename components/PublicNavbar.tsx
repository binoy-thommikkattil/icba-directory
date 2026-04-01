'use client';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';

export default function PublicNavbar() {
  return (
    <nav className="bg-slate-900 border-b border-slate-800 py-4 px-6 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Full Assembly Name - Crisp white with a teal hover */}
        <Link href="/" className="font-serif font-bold text-lg md:text-xl text-white tracking-tight hover:text-teal-400 transition leading-tight max-w-[70%]">
          Immanuel Christian Believers Assembly
        </Link>
        
        {/* Desktop Links - Light slate turning to pure white on hover */}
        <div className="space-x-6 text-sm font-medium text-slate-300 hidden md:flex items-center shrink-0 relative">
          <Link href="/" className="hover:text-white transition">Home</Link>
          <Link href="/visit" className="hover:text-white transition">Visit Us</Link>
          <Link href="/beliefs" className="hover:text-white transition">Our Beliefs</Link>
          
          {/* RESOURCES DROPDOWN */}
          <div className="relative group py-2">
            <button className="hover:text-white transition flex items-center gap-1 focus:outline-none">
              Resources <ChevronDown size={14} />
            </button>
            
            {/* Dropdown Menu - Kept white so it stands out against the light page backgrounds */}
            <div className="absolute top-full right-0 mt-0 w-48 bg-white border border-slate-100 shadow-xl rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 flex flex-col overflow-hidden">
              <Link href="/resources/sermons" className="px-4 py-3 text-sm text-slate-600 hover:bg-teal-50 hover:text-teal-700 border-b border-slate-50 transition-colors">
                Sermons
              </Link>
              <Link href="/resources/articles" className="px-4 py-3 text-sm text-slate-600 hover:bg-teal-50 hover:text-teal-700 border-b border-slate-50 transition-colors">
                Articles
              </Link>
              <Link href="/resources/bible-study" className="px-4 py-3 text-sm text-slate-600 hover:bg-teal-50 hover:text-teal-700 transition-colors">
                Bible Study
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}