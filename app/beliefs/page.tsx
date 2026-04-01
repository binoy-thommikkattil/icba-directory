import PublicNavbar from '@/components/PublicNavbar';
import Footer from '@/components/Footer';
import { statementOfFaith, assemblyIntro } from '@/data/beliefsContent';

export default function PublicBeliefsPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col w-full text-slate-900">
      <PublicNavbar />
      
      <main className="flex-grow w-full">
        {/* Minimalist, Serious Hero Section */}
        <section className="pt-24 pb-16 px-6 max-w-4xl mx-auto text-center border-b border-slate-200">
          <h1 className="text-4xl md:text-6xl font-serif font-bold tracking-tight mb-8 text-slate-900">
            Statement of Faith
          </h1>
          <p className="text-lg md:text-xl text-slate-600 leading-relaxed max-w-3xl mx-auto font-serif italic">
            "{assemblyIntro}"
          </p>
        </section>

        {/* Editorial Layout for Beliefs */}
        <section className="py-16 px-6 max-w-5xl mx-auto mb-12">
          <div className="space-y-16">
            {statementOfFaith.map((belief, index) => (
              <div 
                key={index} 
                className="flex flex-col md:flex-row border-t border-slate-200 pt-10 gap-8 md:gap-16"
              >
                
                {/* Left Column: Title and Scriptural Basis */}
                <div className="w-full md:w-1/3 shrink-0">
                  <h2 className="text-3xl font-serif font-bold text-slate-900 mb-4">
                    {belief.title}
                  </h2>
                  <div className="mt-6">
                    <span className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                      Scriptural Basis
                    </span>
                    <p className="text-sm text-slate-600 font-medium leading-relaxed">
                      {belief.verses}
                    </p>
                  </div>
                </div>

                {/* Right Column: Theological Content */}
                <div className="w-full md:w-2/3">
                  <div className="text-lg text-slate-800 leading-loose whitespace-pre-wrap font-serif">
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