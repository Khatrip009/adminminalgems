import { useState, useEffect, useCallback } from 'react';

// Custom type for the Chrome/Edge install prompt event
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const usePWAInstall = () => {
  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Listen for the standard 'beforeinstallprompt' event that is fired by Chrome, Edge, etc.
    const handleBeforeInstallPrompt = (e: Event) => {
      // Step 1: Prevent the default mini-infobar from appearing on mobile.
      e.preventDefault();

      // Step 2: Save the event. We'll need it later to trigger the actual prompt.
      setInstallPromptEvent(e as BeforeInstallPromptEvent);
      // Step 3: Update UI state to show an "Install" button.
      setIsInstallable(true);
      console.log('PWA Install: beforeinstallprompt event caught. App is installable.');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for the 'appinstalled' event to know when the installation succeeded.
    const handleAppInstalled = () => {
      console.log('PWA Install: appinstalled event fired. PWA was installed.');
      setIsInstallable(false);
      setIsInstalled(true);
      setInstallPromptEvent(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    // Also check if the app is already installed by looking at the display-mode.
    // This is a good fallback check.
    const isAlreadyStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                                ('standalone' in navigator && (navigator as any).standalone === true);
    if (isAlreadyStandalone) {
      setIsInstalled(true);
      setIsInstallable(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // The function that will be called when the user clicks your "Install" button.
  const promptInstall = useCallback(async () => {
    if (!installPromptEvent) {
      return false;
    }

    // Show the native installation prompt (the same one the browser usually shows)
    await installPromptEvent.prompt();

    // Wait for the user's choice (accepted or dismissed)
    const { outcome } = await installPromptEvent.userChoice;

    if (outcome === 'accepted') {
      console.log('PWA Install: User accepted the install prompt.');
      setInstallPromptEvent(null);
      setIsInstallable(false);
      return true;
    } else {
      console.log('PWA Install: User dismissed the install prompt.');
      return false;
    }
  }, [installPromptEvent]);

  return { isInstallable, isInstalled, promptInstall };
};

export default usePWAInstall;