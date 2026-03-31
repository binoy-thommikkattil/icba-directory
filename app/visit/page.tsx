import Link from 'next/link';
import { MapPin, Clock, Calendar, Music, BookOpen, Mic, Info, Coffee, GraduationCap, ChevronLeft } from 'lucide-react';
import Footer from '@/components/Footer';
import PublicNavbar from '@/components/PublicNavbar';

export default function VisitPage() {
  const serviceSteps = [
    { time: '9:45', period: 'AM', title: 'Worship', desc: 'A time of congregational praise and thanksgiving', icon: Music },
    { time: '10:20', period: 'AM', title: "Lord's Table", desc: 'Remembrance of Christ by partaking of the emblems', icon: BookOpen },
    { time: '10:50', period: 'AM', title: 'Sermon', desc: "Expository sermon with relevant life applications from God's Word", icon: Mic },
    { time: '11:20', period: 'AM', title: 'Announcements & Prayer', desc: 'Community updates and a time of prayer', icon: Info },
    { time: '11:30', period: 'AM', title: 'Fellowship', desc: 'Connect with others over refreshments', icon: Coffee },
    { time: '12:00', period: 'PM', title: "Equip Sessions | Kids' Ministry", desc: 'Practical sessions for daily living | Kids praise & learn', icon: GraduationCap }
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col w-full">
      <PublicNavbar />

      <main className="flex-grow w-full">
        <section className="bg-slate-50 py-16 px-6 border-b border-slate-100">
          <div className="max-w-4xl mx-auto text-center">
            <Link href="/" className="inline-flex items-center text-sm font-bold text-sky-600 hover:text-sky-700 mb-6 transition">
              <ChevronLeft size={16} className="mr-1" /> Back to Home
            </Link>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 mb-4">Plan Your Visit</h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              We would love to have you join us for worship and fellowship. Below you will find our weekly schedule, what to expect on a Sunday, and how to find us.
            </p>
          </div>
        </section>

        {/* ... (Keep Weekly Schedule & Order of Service sections exactly as they were) ... */}
        
        <section className="py-20 px-6 bg-white">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-12 items-center">
            
            <div className="w-full md:w-1/3 space-y-8">
              <div>
                <h2 className="text-3xl font-serif font-bold text-slate-900 mb-6">Location</h2>
                
                {/* UPGRADED MAP UX: The whole block is clickable */}
                <a 
                  href="https://maps.google.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-start gap-4 group block cursor-pointer bg-slate-50 p-4 rounded-2xl hover:bg-sky-50 transition border border-transparent hover:border-sky-100"
                >
                  <div className="w-12 h-12 bg-sky-100 text-sky-600 rounded-xl flex items-center justify-center shrink-0 mt-1 group-hover:bg-sky-600 group-hover:text-white transition shadow-sm">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-sky-700 transition">Assembly Hall</h3>
                    <p className="text-slate-600 leading-relaxed group-hover:text-sky-800 transition">
                      123 Main Street<br />
                      Bengaluru, Karnataka 560001<br />
                      India
                    </p>
                    <span className="text-sm font-bold text-sky-600 mt-2 block group-hover:underline">Tap to open in Maps</span>
                  </div>
                </a>
              </div>

              <div className="pt-8 border-t border-slate-100">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Have Questions?</h3>
                <p className="text-slate-600 mb-4">If you need help finding us or have any questions before your visit, please feel free to reach out.</p>
                <a href="mailto:contact@example.com" className="inline-block bg-slate-900 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-slate-800 transition shadow-sm">
                  Contact Us
                </a>
              </div>
            </div>

            <div className="w-full md:w-2/3 h-[400px] md:h-[500px] bg-slate-100 rounded-3xl overflow-hidden border border-slate-200 shadow-inner">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d124415.82062312684!2d77.50293213545806!3d12.973410656094553!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae1670c9b44e6d%3A0xf8dfc3e8517e4fe0!2sBengaluru%2C%20Karnataka!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin" 
                width="100%" height="100%" style={{ border: 0 }} allowFullScreen={true} loading="lazy" referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>

          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}