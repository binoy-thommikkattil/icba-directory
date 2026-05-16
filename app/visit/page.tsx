import Link from 'next/link';
import { MapPin, Clock, Calendar, Music, BookOpen, Mic, Info, Smile, HandHeart, Users, Megaphone, BookOpenText, BookSearch, Globe, Coffee } from 'lucide-react';
import Footer from '@/components/Footer';
import PublicNavbar from '@/components/PublicNavbar';

export default function VisitPage() {
  const serviceSteps = [
    { time: '9:00', period: 'AM', title: 'Opening Songs', desc: 'Congregational singing', icon: Music },
    { time: '9:10', period: 'AM', title: 'Welcome', desc: 'Greeting and welcoming the visitors', icon: Smile },
    { time: '9:15', period: 'AM', title: 'Prayer', desc: "Seeking the Lord's presence and guidance", icon: HandHeart },
    { time: '9:20', period: 'AM', title: 'Devotion', desc: 'A short sharing from the Word to prepare our hearts', icon: BookOpen },
    { time: '9:40', period: 'AM', title: 'Praise & Worship', desc: 'A dedicated time of adoring our Lord', icon: HandHeart },
    { time: '10:00', period: 'AM', title: 'Breaking of Bread', desc: "Remembering the Lord's death until He comes", icon: Users },
    { time: '10:20', period: 'AM', title: 'Announcements & Testimony', desc: "Assembly updates and sharing of God's goodness", icon: Megaphone },
    { time: '10:30', period: 'AM', title: 'Message', desc: 'Expository preaching from the Holy Scriptures', icon: BookOpenText },
    { time: '11:15', period: 'AM', title: 'Prayer', desc: 'Closing prayer and benediction', icon: HandHeart },
    { time: '11:20', period: 'AM', title: 'Break', desc: 'Fellowship over refreshments', icon: Coffee },
    { time: '11:30', period: 'AM', title: 'Second Meetings', desc: 'Dedicated sessions for Youth, Bachelors, Sisters, Brothers, and Sunday School', icon: BookSearch }
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col w-full">
      <PublicNavbar />

      <main className="flex-grow w-full">
        {/* HEADER SECTION */}
        <section className="bg-slate-50 py-16 px-6 border-b border-slate-100">
          <div className="max-w-4xl mx-auto text-center">
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-sky-50 p-6 rounded-3xl border border-sky-100 text-center flex flex-col items-center">
                <h3 className="text-xl font-bold text-sky-900 mb-1">Sunday</h3>
                <p className="text-sky-700 font-medium mb-3">Worship & Ministry</p>
                <div className="mt-auto inline-flex items-center bg-white px-4 py-2 rounded-full text-sm font-bold text-sky-700 shadow-sm border border-sky-100">
                  <Clock size={16} className="mr-2" /> 9:00 AM - 11:15 AM
                </div>
              </div>
              
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 text-center flex flex-col items-center">
                <h3 className="text-xl font-bold text-slate-800 mb-1">Tuesday</h3>
                <p className="text-slate-600 font-medium mb-3 flex items-center gap-2">
                  Prayer <span className="text-[10px] uppercase tracking-wider bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full flex items-center"><Globe size={10} className="mr-1" /> Online</span>
                </p>
                <div className="mt-auto inline-flex items-center bg-white px-4 py-2 rounded-full text-sm font-bold text-slate-700 shadow-sm border border-slate-100">
                  <Clock size={16} className="mr-2" /> 7:15 PM - 8:00 PM
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 text-center flex flex-col items-center">
                <h3 className="text-xl font-bold text-slate-800 mb-1">Thursday</h3>
                <p className="text-slate-600 font-medium mb-3">Prayer Meeting</p>
                <div className="mt-auto inline-flex items-center bg-white px-4 py-2 rounded-full text-sm font-bold text-slate-700 shadow-sm border border-slate-100">
                  <Clock size={16} className="mr-2" /> 7:15 PM - 8:00 PM
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 text-center flex flex-col items-center">
                <h3 className="text-xl font-bold text-slate-800 mb-1">Friday</h3>
                <p className="text-slate-600 font-medium mb-3 flex items-center gap-2">
                  Sisters Meeting <span className="text-[10px] uppercase tracking-wider bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full flex items-center"><Globe size={10} className="mr-1" /> Online</span>
                </p>
                <div className="mt-auto inline-flex items-center bg-white px-4 py-2 rounded-full text-sm font-bold text-slate-700 shadow-sm border border-slate-100">
                  <Clock size={16} className="mr-2" /> 7:15 PM - 8:00 PM
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 text-center flex flex-col items-center">
                <h3 className="text-xl font-bold text-slate-800 mb-1">Saturday</h3>
                <p className="text-slate-600 font-medium mb-3">Bible Study</p>
                <div className="mt-auto inline-flex items-center bg-white px-4 py-2 rounded-full text-sm font-bold text-slate-700 shadow-sm border border-slate-100">
                  <Clock size={16} className="mr-2" /> 6:00 PM - 7:30 PM
                </div>
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
              <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-slate-700 -ml-px"></div>

              {serviceSteps.map((step, index) => (
                <div key={index} className={`relative flex items-center mb-10 last:mb-0 ${index % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
                  
                  <div className="absolute left-8 md:left-1/2 w-16 h-16 bg-white border-4 border-slate-900 rounded-full flex flex-col items-center justify-center -translate-x-1/2 shadow-lg z-10">
                    <span className="text-slate-900 font-bold text-sm leading-none">{step.time}</span>
                    <span className="text-slate-500 text-[10px] font-bold mt-1">{step.period}</span>
                  </div>

                  <div className={`w-full pl-24 md:pl-0 md:w-1/2 ${index % 2 === 0 ? 'md:pr-16 text-left md:text-right' : 'md:pl-16 text-left'}`}>
                    <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 hover:border-sky-500/50 transition duration-300 group">
                      <div className={`flex items-center gap-3 mb-1.5 ${index % 2 === 0 ? 'md:justify-end' : ''}`}>
                        <step.icon size={18} className="text-sky-400 shrink-0" />
                        <h3 className="text-lg font-bold text-white">{step.title}</h3>
                      </div>
                      <p className="text-slate-400 text-sm leading-relaxed group-hover:text-slate-300 transition">{step.desc}</p>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* LOCATION & MAP - ADDED ID AND SCROLL-MT HERE */}
        <section id="map-section" className="py-20 px-6 bg-white scroll-mt-24">
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
              </div>
            </div>

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