import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/AuthContext";
import TopBar from "@/components/TopBar";
import InstallPrompt from "@/components/InstallPrompt";

// Viewport settings locked for mobile app feel
export const viewport: Viewport = {
  themeColor: "#0d9488",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

// Updated Metadata to reflect the whole assembly
export const metadata: Metadata = {
  title: "ICBA",
  description: "Immanuel Christian Believers Assembly",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ICBA",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased text-slate-900 bg-white">
        <AuthProvider>
          {/* FIXED: Removed 'max-w-md' and mobile borders so public pages can span the full screen! */}
          <div className="min-h-screen flex flex-col w-full relative">
            
            <InstallPrompt />
            
            <TopBar />

            <main className="flex-1 w-full">
              {children}
            </main>
            
          </div>
        </AuthProvider>

        {/* The background Service Worker to trigger the Install prompt */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}