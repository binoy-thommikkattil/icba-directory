import PublicNavbar from '@/components/PublicNavbar';
import Footer from '@/components/Footer';
import { BookOpen } from 'lucide-react';
import { statementOfFaith, assemblyIntro } from '@/data/beliefsContent';

export default function PublicBeliefsPage() {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col w-full text-slate-900">
      <PublicNavbar />
      
      <main className="flex-grow w-full">
        {/* Hero Section */}
        <section className="pt-24 pb-16 px-6 max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-serif font-bold tracking-tight mb-8 text-slate-900">
            Statement of Faith
          </h1>
          <p className="text-lg md:text-xl text-slate-600 leading-relaxed max-w-3xl mx-auto font-serif italic">
            "{assemblyIntro}"
          </p>
        </section>

        {/* The "Nested Box" Card Layout */}
        <section className="pb-24 px-6 max-w-6xl mx-auto">
          <div className="space-y-12">
            {statementOfFaith.map((belief, index) => (
              
              /* OUTER BOX (Your Green Box): The main card wrapping everything */
              <div 
                key={index} 
                className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col md:flex-row group hover:shadow-md transition-shadow duration-300"
              >
                
                {/* LEFT COLUMN (Your Red Box): A softly colored panel for the title and verses */}
                <div className="w-full md:w-2/5 lg:w-1/3 bg-slate-50 p-8 md:p-10 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-200 shrink-0">
                  
                  {/* MODIFIED: Heading Block to give it more attention */}
                  <div>
                    <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 tracking-tight mb-4">
                      {belief.title}
                    </h2>
                    {/* Subtle accent line to draw the eye */}
                    <div className="w-12 h-1.5 bg-teal-600 rounded-full mb-8"></div>
                  </div>
                  
                  {/* INNER VERSES BOX (Your Purple Box): A rich, deep blue box to make the verses pop */}
                  <div className="bg-sky-950 p-6 rounded-2xl shadow-inner mt-4">
                    <span className="flex items-center text-xs font-bold text-sky-400 uppercase tracking-widest mb-3">
                      <BookOpen size={16} className="mr-2" /> Scriptural Basis
                    </span>
                    <p className="text-sm font-medium text-sky-50 leading-relaxed italic">
                      {belief.verses}
                    </p>
                  </div>
                </div>

                {/* RIGHT COLUMN: Crisp white background for effortless reading */}
                <div className="w-full md:w-3/5 lg:w-2/3 p-8 md:p-10 flex items-center bg-white">
                  <div className="text-lg text-slate-700 leading-loose whitespace-pre-wrap font-serif">
                    {belief.text}
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