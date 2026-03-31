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
        {/* HEADER SECTION */}
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

        {/* WEEKLY SCHEDULE GRID */}
        <section className="py-16 px-6 bg-white border-b border-slate-100">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-center mb-10">
              <Calendar className="text-sky-600 mr-3" size={28} />
              <h2 className="text-3xl font-serif font-bold text-slate-900">Weekly Schedule</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-sky-50 p-8 rounded-3xl border border-sky-100 text-center">
                <h3 className="text-xl font-bold text-sky-900 mb-2">Sunday</h3>
                <p className="text-sky-700 font-medium mb-4">Worship & Ministry</p>
                <p className="text-slate-600 text-sm">Join us for the breaking of bread, teaching, and fellowship.</p>
                <div className="mt-6 inline-block bg-white px-4 py-2 rounded-full text-sm font-bold text-sky-700 shadow-sm">9:45 AM - 12:30 PM</div>
              </div>
              
              <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 text-center">
                <h3 className="text-xl font-bold text-slate-800 mb-2">Wednesday</h3>
                <p className="text-slate-600 font-medium mb-4">Prayer Meeting</p>
                <p className="text-slate-500 text-sm">A dedicated time for the assembly to gather and pray for various needs.</p>
                <div className="mt-6 inline-block bg-white px-4 py-2 rounded-full text-sm font-bold text-slate-700 shadow-sm border border-slate-100">7:00 PM - 8:30 PM</div>
              </div>

              <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 text-center">
                <h3 className="text-xl font-bold text-slate-800 mb-2">Friday</h3>
                <p className="text-slate-600 font-medium mb-4">Bible Study</p>
                <p className="text-slate-500 text-sm">Systematic and expository study of the Scriptures to grow in faith.</p>
                <div className="mt-6 inline-block bg-white px-4 py-2 rounded-full text-sm font-bold text-slate-700 shadow-sm border border-slate-100">7:00 PM - 8:30 PM</div>
              </div>
            </div>
          </div>
        </section>

        {/* ORDER OF SERVICE TIMELINE */}
        <section className="py-20 px-6 bg-slate-900 text-slate-100 overflow-hidden">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-serif font-bold text-white mb-4">Sunday Order of Service</h2>
              <p className="text-slate-400">What to expect when you gather with us on the Lord's Day.</p>
            </div>

            <div className="relative">
              {/* Center Line (Desktop) / Left Line (Mobile) */}
              <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-slate-700 -ml-px"></div>

              {serviceSteps.map((step, index) => (
                <div key={index} className={`relative flex items-center mb-12 last:mb-0 ${index % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
                  
                  {/* Circular Time Badge */}
                  <div className="absolute left-8 md:left-1/2 w-16 h-16 bg-white border-4 border-slate-900 rounded-full flex flex-col items-center justify-center -translate-x-1/2 shadow-lg z-10">
                    <span className="text-slate-900 font-bold text-lg leading-none">{step.time}</span>
                    <span className="text-slate-500 text-[10px] font-bold mt-0.5">{step.period}</span>
                  </div>

                  {/* Content Card */}
                  <div className={`w-full pl-24 md:pl-0 md:w-1/2 ${index % 2 === 0 ? 'md:pr-16 text-left md:text-right' : 'md:pl-16 text-left'}`}>
                    <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 hover:border-sky-500/50 transition duration-300 group">
                      <div className={`flex items-center gap-3 mb-2 ${index % 2 === 0 ? 'md:justify-end' : ''}`}>
                        <step.icon size={20} className="text-sky-400" />
                        <h3 className="text-xl font-bold text-white">{step.title}</h3>
                      </div>
                      <p className="text-slate-400 text-sm leading-relaxed group-hover:text-slate-300 transition">{step.desc}</p>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* LOCATION & MAP */}
        <section className="py-20 px-6 bg-white">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-12 items-center">
            
            <div className="w-full md:w-1/3 space-y-8">
              <div>
                <h2 className="text-3xl font-serif font-bold text-slate-900 mb-6">Location</h2>
                
                <a 
                  href="https://maps.google.com/?q=Immanuel+Christian+Believers+Assembly,+Jagadish+Nagar,+Bengaluru" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-start gap-4 group block cursor-pointer bg-slate-50 p-4 rounded-2xl hover:bg-sky-50 transition border border-transparent hover:border-sky-100"
                >
                  <div className="w-12 h-12 bg-sky-100 text-sky-600 rounded-xl flex items-center justify-center shrink-0 mt-1 group-hover:bg-sky-600 group-hover:text-white transition shadow-sm">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-sky-700 transition">Assembly Hall</h3>
                    <p className="text-slate-600 leading-relaxed group-hover:text-sky-800 transition text-sm">
                      1st Cross Road, #305, 5th Main Rd,<br />
                      Jagadish Nagar, New Tippasandra,<br />
                      Bengaluru, Karnataka 560075
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

            {/* EMBEDDED MAP EXACT ADDRESS */}
            <div className="w-full md:w-2/3 h-[400px] md:h-[500px] bg-slate-100 rounded-3xl overflow-hidden border border-slate-200 shadow-inner">
              <iframe 
                src="https://maps.google.com/maps?q=Immanuel%20Christian%20Believers%20Assembly%2C%201st%20Cross%20Road%2C%20%23305%2C%205th%20Main%20Rd%2C%20Jagadish%20Nagar%2C%20New%20Tippasandra%2C%20Bengaluru%2C%20Karnataka%20560075&t=&z=15&ie=UTF8&iwloc=&output=embed" 
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