import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-300 py-12 border-t border-slate-800">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Identity */}
        <div className="space-y-4">
          <h3 className="text-xl font-serif font-bold text-white">Immanuel Christian Believers Assembly</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            We gather in the name of the Lord Jesus Christ and warmly welcome you to join us for worship, fellowship, and the study of God’s Word.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Quick Links</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/visit" className="hover:text-sky-400 transition">Visit Us & Timings</Link></li>
            <li><Link href="/beliefs" className="hover:text-sky-400 transition">Statement of Faith</Link></li>
            <li><Link href="/resources/sermons" className="hover:text-sky-400 transition">Sermons</Link></li>
            <li><Link href="/directory" className="hover:text-sky-400 transition text-sky-500 font-medium">Member Directory</Link></li>
          </ul>
        </div>

        {/* Legal & Contact */}
        <div>
          <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Legal & Information</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/privacy" className="hover:text-sky-400 transition">Privacy Policy</Link></li>
            <li><Link href="/terms" className="hover:text-sky-400 transition">Terms & Conditions</Link></li>           
          </ul>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 mt-12 pt-8 border-t border-slate-800 text-sm text-slate-500 text-center flex flex-col items-center">
        <p>© {currentYear} Immanuel Christian Believers Assembly. All rights reserved.</p>
      </div>
    </footer>
  );
}