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
    let timeoutId = setTimeout(() => {
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
    <div className="fixed bottom-20 left-0 right-0 z-[60] px-3 md:hidden" style={{ pointerEvents: 'auto' }}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-blue-500 dark:border-blue-400 p-2.5 max-w-xs mx-auto">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded flex items-center justify-center flex-shrink-0">
              <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-white text-xs leading-tight">
                Install App
              </h3>
              <p className="text-[10px] text-gray-600 dark:text-gray-400 leading-tight truncate">
                Add to home screen
              </p>
            </div>
          </div>
          <button
            onClick={handleInstallClick}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-1.5 px-3 rounded text-xs transition-colors flex items-center justify-center gap-1.5 flex-shrink-0"
          >
            <Download className="w-3 h-3" />
            Install
          </button>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0 p-1"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;

