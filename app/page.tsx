import Link from 'next/link';
import { MapPin, Clock, BookOpen, ChevronRight } from 'lucide-react';
import Footer from '@/components/Footer';
import PublicNavbar from '@/components/PublicNavbar';

export default function PublicHomePage() {
  return (
    <div className="min-h-screen bg-white flex flex-col w-full">
      <PublicNavbar />

      <main className="flex-grow w-full">
        {/* HERO SECTION */}
        <section className="relative bg-slate-50 py-24 px-6 overflow-hidden">
          <div className="absolute inset-0 bg-sky-900/5 mix-blend-multiply" />
          <div className="max-w-5xl mx-auto text-center relative z-10">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-slate-900 leading-tight mb-8">
              Welcome to <br className="hidden md:block" /> Immanuel Christian Believers Assembly
            </h1>
            
            <div className="text-lg md:text-xl text-slate-700 mb-10 max-w-3xl mx-auto leading-relaxed space-y-6">
              <p>
                We are a congregation of Bible-based believers, gathering locally as an independent New Testament assembly, under the supreme headship and authority of the Lord Jesus Christ.
              </p>
              <p>
                We unite in our Savior's precious name for corporate worship, earnest prayer, rich fellowship, and the deep study of God's Word.
              </p>
              <blockquote className="italic font-serif text-sky-800 text-xl md:text-2xl pt-4">
                "For God so loved the world, that he gave his only begotten Son, that whoever believes in him should not perish but have everlasting life."<br/>
                <span className="text-sm md:text-base font-sans font-bold text-sky-600 not-italic mt-2 block">— John 3:16</span>
              </blockquote>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
              <Link href="/visit" className="bg-sky-600 text-white px-8 py-3.5 rounded-full font-bold shadow-sm hover:bg-sky-700 transition flex items-center justify-center">
                Plan a Visit <ChevronRight size={18} className="ml-1" />
              </Link>
              <Link href="/beliefs" className="bg-white text-slate-700 border border-slate-200 px-8 py-3.5 rounded-full font-bold shadow-sm hover:bg-slate-50 transition flex items-center justify-center">
                What We Believe
              </Link>
            </div>
          </div>
        </section>

        {/* QUICK INFO CARDS */}
        <section className="py-16 px-6 bg-white -mt-8 relative z-20">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="bg-white p-8 rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-100 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center mb-6">
                <Clock size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Sunday Worship</h3>
              <p className="text-slate-600 mb-4">Join us every Sunday morning for the breaking of bread and worship.</p>
              <span className="text-sky-700 bg-sky-50 px-4 py-2 rounded-full font-bold text-sm mt-auto border border-sky-100">
                9:00 AM - 11:15 PM
              </span>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-100 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center mb-6">
                <MapPin size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Our Location</h3>
              <p className="text-slate-600 mb-4 text-sm leading-relaxed">
                1st Cross Road, #305, 5th Main Rd,<br/>
                Jagadish Nagar, New Tippasandra,<br/>
                Bengaluru, Karnataka 560075
              </p>
              <Link href="/visit" className="text-sky-600 font-bold text-sm mt-auto hover:underline">View Map & Directions</Link>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-100 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center mb-6">
                <BookOpen size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Biblical Teaching</h3>
              <p className="text-slate-600 mb-4">Explore our library of sermons and articles grounded in New Testament principles.</p>
              <Link href="/resources/sermons" className="text-sky-600 font-bold text-sm mt-auto hover:underline">Browse Resources</Link>
            </div>

          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}