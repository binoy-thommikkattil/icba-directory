'use client';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';

export default function PublicNavbar() {
  return (
    <nav className="bg-white border-b border-slate-100 py-4 px-6 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Full Assembly Name linking to Home */}
        <Link href="/" className="font-serif font-bold text-lg md:text-xl text-slate-900 tracking-tight hover:text-sky-700 transition leading-tight max-w-[70%]">
          Immanuel Christian Believers Assembly
        </Link>
        
        {/* Desktop Links */}
        <div className="space-x-6 text-sm font-medium text-slate-600 hidden md:flex items-center shrink-0 relative">
          <Link href="/" className="hover:text-sky-600 transition">Home</Link>
          <Link href="/visit" className="hover:text-sky-600 transition">Visit Us</Link>
          <Link href="/beliefs" className="hover:text-sky-600 transition">Our Beliefs</Link>
          
          {/* RESOURCES DROPDOWN */}
          <div className="relative group py-2">
            <button className="hover:text-sky-600 transition flex items-center gap-1 focus:outline-none">
              Resources <ChevronDown size={14} />
            </button>
            <div className="absolute top-full right-0 mt-0 w-48 bg-white border border-slate-100 shadow-xl rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 flex flex-col overflow-hidden">
              <Link href="/resources/sermons" className="px-4 py-3 text-sm text-slate-600 hover:bg-sky-50 hover:text-sky-700 border-b border-slate-50">Sermons</Link>
              <Link href="/resources/articles" className="px-4 py-3 text-sm text-slate-600 hover:bg-sky-50 hover:text-sky-700 border-b border-slate-50">Articles</Link>
              <Link href="/resources/bible-study" className="px-4 py-3 text-sm text-slate-600 hover:bg-sky-50 hover:text-sky-700">Bible Study</Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}