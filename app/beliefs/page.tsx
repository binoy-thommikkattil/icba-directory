import PublicNavbar from '@/components/PublicNavbar';
import Footer from '@/components/Footer';
import { BookOpen } from 'lucide-react';
import { statementOfFaith, assemblyIntro } from '@/data/beliefsContent';

export default function PublicBeliefsPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col w-full text-slate-900">
      <PublicNavbar />
      
      <main className="flex-grow w-full">
        {/* Hero Section */}
        <section className="bg-white py-12 px-6 border-b border-slate-200 text-center">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl md:text-5xl font-serif font-bold text-slate-900 mb-6">Statement of Faith</h1>
            <p className="text-base md:text-lg text-slate-600 font-serif italic leading-relaxed">
              "{assemblyIntro}"
            </p>
          </div>
        </section>

        {/* BELIEFS LIST (Sleek, scannable cards) */}
        <section className="py-12 px-6 max-w-4xl mx-auto">
          <div className="space-y-6">
            {statementOfFaith.map((belief, index) => (
              <div key={index} className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 md:gap-8 hover:shadow-md transition">
                
                {/* Title */}
                <div className="md:w-1/4 shrink-0">
                  <h2 className="text-xl md:text-2xl font-serif font-bold text-slate-900 border-b-2 border-teal-600 inline-block pb-1">
                    {belief.title}
                  </h2>
                </div>

                {/* Content & Inline Scriptures */}
                <div className="md:w-3/4">
                  <div className="text-sm md:text-base text-slate-700 leading-relaxed whitespace-pre-wrap font-serif mb-4">
                    {belief.text}
                  </div>
                  
                  {/* Subtle, compact scriptural reference bar */}
                  <div className="inline-flex items-start md:items-center bg-slate-100 px-3 py-2 rounded-lg border border-slate-200">
                    <BookOpen size={14} className="text-slate-500 mr-2 shrink-0 mt-0.5 md:mt-0" />
                    <span className="text-xs font-medium text-slate-600 leading-tight">
                      {belief.verses}
                    </span>
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