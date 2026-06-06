import Link from 'next/link';
import { Clock, MapPin, BookOpen } from 'lucide-react';
import PublicNavbar from '@/components/PublicNavbar';
import Footer from '@/components/Footer';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col w-full">
      <PublicNavbar />

      <main className="flex-grow w-full">
        {/* COMPACT HERO SECTION */}
        <section className="py-16 md:py-24 px-6 text-center flex flex-col items-center justify-center bg-white border-b border-slate-200">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl md:text-5xl font-serif font-bold text-slate-900 leading-tight mb-6">
              Welcome to <br className="hidden md:block" /> Immanuel Christian Believers Assembly (ICBA)
            </h1>
            <p className="text-base md:text-lg text-slate-600 mb-4 leading-relaxed">
              We are a congregation of Bible-based believers, gathering locally as an independent New Testament assembly, under the supreme headship and authority of the Lord Jesus Christ.
            </p>
            <p className="text-base md:text-lg text-slate-600 mb-8 leading-relaxed">
              We unite in our Savior's precious name for corporate worship, earnest prayer, rich fellowship, and the study of God's Word.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/visit" className="w-full sm:w-auto bg-sky-600 text-white px-8 py-3 rounded-full font-bold hover:bg-sky-700 transition shadow-sm">
                Plan a Visit
              </Link>
              <Link href="/beliefs" className="w-full sm:w-auto bg-white text-slate-700 border border-slate-200 px-8 py-3 rounded-full font-bold hover:bg-slate-50 transition shadow-sm">
                What We Believe
              </Link>
            </div>
          </div>
        </section>

        {/* HORIZONTAL QUICK LINKS (No more bulky vertical cards) */}
        <section className="py-12 px-6 max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            
            {/* Quick Link 1 */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-start gap-4 shadow-sm hover:shadow-md transition">
              <div className="w-10 h-10 bg-sky-50 text-sky-600 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                <Clock size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-1">Sunday Worship</h3>
                <p className="text-sm text-slate-600 mb-2 leading-relaxed">Join us every Sunday morning for worship.</p>
                <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-md">9:00 AM - 11:15 AM</span>
              </div>
            </div>

            {/* Quick Link 2 */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-start gap-4 shadow-sm hover:shadow-md transition">
              <div className="w-10 h-10 bg-sky-50 text-sky-600 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                <MapPin size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-1">Our Location</h3>
                <p className="text-sm text-slate-600 mb-2 leading-relaxed">1st Cross Road, #305, 5th Main Rd, Jagadish Nagar, Bengaluru 560075</p>
                <Link href="/visit#map-section" className="text-xs font-bold text-sky-600 hover:text-sky-800 transition">View Map & Directions &rarr;</Link>
              </div>
            </div>

            {/* Quick Link 3 */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-start gap-4 shadow-sm hover:shadow-md transition">
              <div className="w-10 h-10 bg-sky-50 text-sky-600 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                <BookOpen size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-1">Biblical Teaching</h3>
                <p className="text-sm text-slate-600 mb-2 leading-relaxed">Explore our library of sermons and articles grounded in New Testament principles.</p>
                <Link href="/resources" className="text-xs font-bold text-sky-600 hover:text-sky-800 transition">Browse Resources &rarr;</Link>
              </div>
            </div>

          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}