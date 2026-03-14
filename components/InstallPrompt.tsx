'use client';
import { useState, useEffect } from 'react';
import { X, Download, Share } from 'lucide-react';

export default function InstallPrompt() {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(true); // Default true to prevent flash
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 1. Check if the app is already installed and running in its own window
    const isAppMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    setIsStandalone(isAppMode);

    // If they are already using the installed app, don't show anything!
    if (isAppMode) return;

    // 2. Detect if the user is on an iPhone/iPad
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    // iOS doesn't support the automatic install trigger, so we always show the manual instructions
    if (isIOSDevice) {
      setIsVisible(true);
    }

    // 3. Listen for Android/Desktop Chrome's native install trigger
    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent the default mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      // Show our beautiful custom banner
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  // If dismissed, installed, or running on desktop without PWA support, hide it.
  if (!isVisible || isStandalone) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Show the native install prompt
      deferredPrompt.prompt();
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsVisible(false);
      }
      // Clear the saved prompt since it can't be used again
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 z-[100] md:max-w-md md:mx-auto">
      <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl flex items-start gap-4 border border-slate-700 animate-in slide-in-from-bottom-5">
        
        {/* The Icon */}
        <div className="bg-teal-600 p-2.5 rounded-xl shrink-0">
          {isIOS ? <Share size={24} className="text-white" /> : <Download size={24} className="text-white" />}
        </div>

        {/* The Text & Button */}
        <div className="flex-1 min-w-0 pt-0.5">
          <h3 className="font-bold text-sm mb-1">Install Directory App</h3>
          {isIOS ? (
            <p className="text-xs text-slate-300 leading-relaxed">
              Tap the <strong className="text-white">Share</strong> button below and select <strong className="text-white">Add to Home Screen</strong>.
            </p>
          ) : (
            <p className="text-xs text-slate-300 leading-relaxed mb-3">
              Add this app to your home screen for quick access.
            </p>
          )}
          
          {/* Only show the 1-click install button on Android/Chrome */}
          {!isIOS && deferredPrompt && (
            <button 
              onClick={handleInstallClick}
              className="w-full bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold text-sm py-2 rounded-lg transition"
            >
              Add to Home Screen
            </button>
          )}
        </div>

        {/* The Close Button */}
        <button 
          onClick={() => setIsVisible(false)} 
          className="p-1.5 bg-slate-800 text-slate-400 hover:text-white rounded-full transition shrink-0"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}