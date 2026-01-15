import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if device is mobile - be more aggressive for iOS
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera || '';
      const ua = userAgent.toLowerCase();
      
      // Detect iOS specifically
      const isIOS = /iphone|ipad|ipod/i.test(ua);
      // Detect other mobile devices
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua);
      // Check screen size
      const isSmallScreen = window.innerWidth <= 768;
      
      // Always consider it mobile if iOS or small screen
      const mobile = isIOS || isMobileDevice || isSmallScreen;
      setIsMobile(mobile);
      
      // Always show prompt on mobile (not just when beforeinstallprompt fires)
      if (mobile) {
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
          setIsInstalled(true);
          return;
        }

        // Check if already installed via localStorage
        const installed = localStorage.getItem('pwa-installed');
        if (installed === 'true') {
          setIsInstalled(true);
          return;
        }

        // Check if permanently dismissed - but allow showing again after 24 hours
        const dismissed = localStorage.getItem('pwa-prompt-dismissed');
        const dismissedTime = localStorage.getItem('pwa-prompt-dismissed-time');
        if (dismissed === 'true' && dismissedTime) {
          const hoursSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60);
          // Show again after 24 hours
          if (hoursSinceDismissed < 24) {
            return;
          }
        }

        // Show prompt immediately on mobile - force it!
        setShowPrompt(true);
      }
    };

    // Check immediately
    checkMobile();
    
    // Also check after a short delay to ensure it shows
    const timeoutId = setTimeout(() => {
      checkMobile();
    }, 500);
    
    window.addEventListener('resize', checkMobile);

    // Listen for beforeinstallprompt event (for Android Chrome)
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
      localStorage.setItem('pwa-installed', 'true');
    });

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Fallback for iOS Safari
      if (isMobile) {
        alert(
          'To install this app:\n\n' +
          'iOS Safari: Tap the Share button, then "Add to Home Screen"\n\n' +
          'Android Chrome: Tap the menu (3 dots) and select "Add to Home Screen" or "Install App"'
        );
      }
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
      localStorage.setItem('pwa-installed', 'true');
    }

    // Clear the deferredPrompt
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Don't show again for 24 hours (user can clear localStorage to see it again)
    localStorage.setItem('pwa-prompt-dismissed', 'true');
    localStorage.setItem('pwa-prompt-dismissed-time', Date.now().toString());
  };

  // Don't show if already installed
  if (isInstalled) {
    return null;
  }

  // Always show on mobile if not dismissed recently
  const dismissed = localStorage.getItem('pwa-prompt-dismissed');
  const dismissedTime = localStorage.getItem('pwa-prompt-dismissed-time');
  let shouldHide = false;
  
  if (dismissed === 'true' && dismissedTime) {
    const hoursSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60);
    shouldHide = hoursSinceDismissed < 24;
  }

  // Force show on mobile devices
  if (!isMobile || shouldHide) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-0 right-0 z-[60] px-4 md:hidden" style={{ pointerEvents: 'auto' }}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border-2 border-blue-500 dark:border-blue-400 p-4 max-w-sm mx-auto animate-pulse">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <Download className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                Install KRUPDATES
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Add to home screen for quick access
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label="Dismiss"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleInstallClick}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Install App
          </button>
          <button
            onClick={handleDismiss}
            className="px-4 py-2.5 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 transition-colors"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;

