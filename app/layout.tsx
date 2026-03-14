import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/AuthContext";
import TopBar from "@/components/TopBar";
import InstallPrompt from "@/components/InstallPrompt"; // <-- 1. Import it here

// 1. ADDED: Viewport settings to lock the scale for mobile app feel
export const viewport: Viewport = {
  themeColor: "#0d9488",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

// 2. ADDED: Manifest and Apple Web App settings to your existing metadata
export const metadata: Metadata = {
  title: "ICBA Directory",
  description: "Virtual Church Directory",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Directory",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased text-slate-900 pb-20">
        <AuthProvider>
          {/* KEPT YOUR EXACT STYLING: This keeps the desktop view looking like a phone screen! */}
          <div className="max-w-md mx-auto min-h-screen bg-white shadow-xl relative border-x border-slate-100 flex flex-col">

            {/* 2. Drop it globally into the layout */}
            <InstallPrompt />

            <TopBar />

            <main className="flex-1">
              {children}
            </main>
          </div>
        </AuthProvider>

        {/* 3. ADDED: The background Service Worker to trigger the Install prompt */}
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