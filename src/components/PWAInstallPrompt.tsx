import React, { useState, useEffect } from 'react';
import { X, Download, Smartphone } from 'lucide-react'; // Assuming you have lucide-react installed
import usePWAInstall from '@/hooks/usePWAInstall';

const PWAInstallPrompt: React.FC = () => {
  const { isInstallable, promptInstall } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);

  // Check if the user is on iOS. The beforeinstallprompt event does NOT fire on iOS.
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  // Don't show anything if the prompt is not needed or the user dismissed it already.
  if (dismissed) return null;

  // Render a dismissable banner for Android/Chrome users when an install event is available.
  if (isInstallable && !isIOS) {
    return (
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg rounded-xl mx-6 my-4 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Download size={20} />
          <div>
            <p className="font-medium">Install Minal Gems</p>
            <p className="text-sm text-indigo-100">Get faster access and offline support.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => promptInstall()}
            className="px-4 py-1.5 bg-white text-indigo-700 rounded-full text-sm font-medium hover:bg-gray-100 transition"
          >
            Install Now
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1.5 hover:bg-white/20 rounded-full transition"
            aria-label="Dismiss"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    );
  }

  // For iOS, we cannot programmatically trigger a prompt.
  // Show a different UI with instructions.
  if (isIOS && !isInstallable && !dismissed) {
    return (
      <div className="bg-white border border-gray-200 shadow-lg rounded-xl mx-6 my-4 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <Smartphone size={20} className="text-gray-600 mt-0.5" />
          <div>
            <p className="font-medium text-gray-900">Install on your iPhone / iPad</p>
            <p className="text-sm text-gray-600">
              Tap <span className="font-semibold">Share</span> {' '}
              <span className="inline-flex items-center justify-center w-5 h-5 bg-gray-200 rounded text-xs">⎙</span> {' '}
              then <span className="font-semibold">"Add to Home Screen"</span>.
            </p>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-gray-400 hover:text-gray-600 p-1"
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  return null;
};

export default PWAInstallPrompt;