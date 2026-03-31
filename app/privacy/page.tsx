import PublicNavbar from '@/components/PublicNavbar';
import Footer from '@/components/Footer';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white flex flex-col w-full">
      <PublicNavbar />
      <main className="flex-grow max-w-3xl mx-auto py-16 px-6 text-slate-700">
        <h1 className="text-3xl font-serif font-bold text-slate-900 mb-8">Privacy Policy</h1>
        
        <div className="space-y-6 text-sm leading-relaxed">
          <p>Last updated: {new Date().getFullYear()}</p>
          
          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">1. Information We Collect</h2>
          <p>Immanuel Christian Believers Assembly ("we", "our", or "us") respects your privacy. We may collect personal information such as your name, email address, phone number, and address when you voluntarily provide it to us through our website, directory, or registration forms.</p>
          
          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">2. Use of Information</h2>
          <p>The information we collect is used to communicate with you, provide access to our member directory, facilitate assembly activities, and maintain internal records. We do not sell or share your personal information with third-party marketers.</p>
          
          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">3. Data Security</h2>
          <p>We implement reasonable security measures to protect your personal information. Access to our private member directory is restricted to approved members only. However, no internet transmission is entirely secure, and we cannot guarantee absolute security.</p>
          
          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">4. Cookies</h2>
          <p>Our website may use cookies and similar tracking technologies to enhance user experience and maintain login sessions for members.</p>
          
          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">5. Contact Us</h2>
          <p>If you have any questions about this Privacy Policy or wish to request the deletion of your data, please contact the assembly administration.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}