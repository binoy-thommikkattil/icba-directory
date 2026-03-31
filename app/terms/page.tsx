import PublicNavbar from '@/components/PublicNavbar';
import Footer from '@/components/Footer';

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-white flex flex-col w-full">
      <PublicNavbar />
      <main className="flex-grow max-w-3xl mx-auto py-16 px-6 text-slate-700">
        <h1 className="text-3xl font-serif font-bold text-slate-900 mb-8">Terms & Conditions</h1>
        
        <div className="space-y-6 text-sm leading-relaxed">
          <p>Last updated: {new Date().getFullYear()}</p>
          
          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">1. Acceptance of Terms</h2>
          <p>By accessing and using the website of Immanuel Christian Believers Assembly, you accept and agree to be bound by these Terms and Conditions.</p>
          
          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">2. Use of the Site</h2>
          <p>Our website and its resources are provided for spiritual growth, information, and communication. You agree to use the site only for lawful purposes and in a manner that does not infringe upon the rights of others.</p>
          
          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">3. Member Directory</h2>
          <p>Access to the Member Directory is a privilege granted solely to approved attendees of the assembly. Users are strictly prohibited from using directory information for commercial solicitation, mass mailings, or sharing private contact details outside of the assembly.</p>
          
          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">4. Intellectual Property</h2>
          <p>Content on this website, including text, graphics, and sermons, is the property of Immanuel Christian Believers Assembly unless otherwise noted. You may not reproduce or distribute this content for commercial purposes without permission.</p>
          
          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">5. Limitation of Liability</h2>
          <p>We are not liable for any damages arising out of your use of this website. Information is provided "as is" without warranty of any kind.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}