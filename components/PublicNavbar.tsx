'use client';
import Link from 'next/link';

export default function PublicNavbar() {
  return (
    <nav className="bg-white border-b border-slate-100 py-4 px-6 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Full Assembly Name linking to Home */}
        <Link href="/" className="font-serif font-bold text-lg md:text-xl text-slate-900 tracking-tight hover:text-sky-700 transition leading-tight max-w-[70%]">
          Immanuel Christian Believers Assembly
        </Link>
        
        {/* Desktop Links (No Login Link) */}
        <div className="space-x-6 text-sm font-medium text-slate-600 hidden md:flex items-center shrink-0">
          <Link href="/" className="hover:text-sky-600 transition">Home</Link>
          <Link href="/visit" className="hover:text-sky-600 transition">Visit Us</Link>
          <Link href="/beliefs" className="hover:text-sky-600 transition">Our Beliefs</Link>
        </div>
      </div>
    </nav>
  );
}