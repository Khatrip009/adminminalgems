import React, { useState, useEffect } from "react";
import { X, Download } from "lucide-react";

const InstallBanner: React.FC = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choice: { outcome: string }) => {
        if (choice.outcome === "accepted") {
          console.log("User accepted install");
        }
        setDeferredPrompt(null);
        setShowBanner(false);
      });
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96 bg-slate-900 text-white rounded-xl shadow-xl border border-slate-700 p-4 flex items-center justify-between gap-3 animate-in slide-in-from-bottom-5">
      <div className="flex items-center gap-3">
        <Download className="h-5 w-5 text-emerald-400" />
        <div>
          <p className="text-sm font-medium">Install Minal ERP</p>
          <p className="text-xs text-slate-400">Add to home screen for quick access</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleInstall}
          className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-medium hover:bg-emerald-700"
        >
          Install
        </button>
        <button onClick={handleDismiss} className="rounded-full p-1.5 hover:bg-slate-800">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default InstallBanner;