'use client';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';

export default function PublicNavbar() {
  return (
    <nav className="bg-slate-900 border-b border-slate-800 py-3 md:py-4 px-4 md:px-6 sticky top-0 z-50 shadow-md">
      {/* FIXED: Changed to flex-col on mobile so they stack cleanly, 
        and md:flex-row so they go side-by-side on desktop 
      */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-3 md:gap-0">
        
        {/* Full Assembly Name - Removed max-w limitation so it centers nicely on mobile */}
        <Link href="/" className="font-serif font-bold text-base md:text-xl text-white tracking-tight hover:text-teal-400 transition leading-tight text-center md:text-left">
          Immanuel Christian Believers Assembly
        </Link>
        
        {/* FIXED: Removed overflow-x-auto so the dropdown doesn't get clipped. 
          Added flex-wrap so links wrap gracefully on super tiny screens.
        */}
        <div className="flex items-center justify-center flex-wrap gap-4 md:gap-6 text-slate-300 text-sm md:text-base">
          <Link href="/" className="hover:text-white transition">Home</Link>
          <Link href="/visit" className="hover:text-white transition">Visit Us</Link>
          <Link href="/beliefs" className="hover:text-white transition">Our Beliefs</Link>
          
          {/* RESOURCES DROPDOWN */}
          <div className="relative group py-2">
            <button className="hover:text-white transition flex items-center gap-1 focus:outline-none">
              Resources <ChevronDown size={14} />
            </button>
            
            {/* Dropdown Menu */}
            <div className="absolute top-full right-0 md:left-auto md:right-0 mt-0 w-48 bg-white border border-slate-100 shadow-xl rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 flex flex-col overflow-hidden z-50">
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