import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/AuthContext";
import TopBar from "@/components/TopBar";

export const metadata: Metadata = {
  title: "ICBA Directory",
  description: "Virtual Church Directory",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased text-slate-900 pb-20">
        <AuthProvider>
          <div className="max-w-md mx-auto min-h-screen bg-white shadow-xl relative border-x border-slate-100">
            <TopBar />
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}