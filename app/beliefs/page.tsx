import Link from 'next/link';
import { BookOpen, ChevronLeft } from 'lucide-react';
import PublicNavbar from '@/components/PublicNavbar';
import Footer from '@/components/Footer';
import { statementOfFaith, assemblyIntro } from '@/data/beliefsContent';

export default function PublicBeliefsPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col w-full">
      <PublicNavbar />

      <main className="flex-grow w-full">
        {/* HERO SECTION */}
        <section className="bg-slate-50 py-16 px-6 border-b border-slate-100">
          <div className="max-w-4xl mx-auto text-center">
            <Link href="/" className="inline-flex items-center text-sm font-bold text-sky-600 hover:text-sky-700 mb-6 transition">
              <ChevronLeft size={16} className="mr-1" /> Back to Home
            </Link>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 mb-6">What We Believe</h1>
            <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              {assemblyIntro}
            </p>
          </div>
        </section>

        {/* ELEGANT LIST OF BELIEFS */}
        <section className="py-20 px-6 bg-white">
          <div className="max-w-4xl mx-auto space-y-12">
            {statementOfFaith.map((belief, index) => (
              <div key={index} className="bg-white p-8 md:p-10 rounded-3xl shadow-lg shadow-slate-200/40 border border-slate-100 relative overflow-hidden group hover:border-sky-200 transition duration-300">
                
                {/* Decorative background accent */}
                <div className="absolute top-0 left-0 w-2 h-full bg-sky-100 group-hover:bg-sky-500 transition-colors duration-300"></div>
                
                <div className="flex flex-col md:flex-row items-start gap-6">
                  <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center shrink-0">
                    <BookOpen size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-serif font-bold text-slate-900 mb-4">{belief.title}</h2>
                    <div className="text-slate-700 leading-relaxed text-lg mb-6 whitespace-pre-wrap">
                      {belief.text}
                    </div>
                    <div className="inline-block bg-slate-50 px-4 py-2 rounded-lg border border-slate-100">
                      <span className="text-sm font-bold text-sky-700 tracking-wide">{belief.verses}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}