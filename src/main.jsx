// Disable console.logs in production (must be first import)
import './utils/disableConsole.js';

import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { ThemeProvider } from './contexts/ThemeContext.jsx';
import { HelmetProvider } from 'react-helmet-async';

// Register service worker for PWA
// - Production: use caching SW (`/sw.js`)
// - Localhost dev: use a no-cache SW (`/sw-dev.js`) so PWA install can be tested safely
if ('serviceWorker' in navigator) {
  const isLocalhost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1');
  const swUrl = import.meta.env.PROD ? '/sw.js' : isLocalhost ? '/sw-dev.js' : null;

  if (swUrl) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register(swUrl)
        .then(() => {
          // Service worker registered successfully
        })
        .catch(() => {
          // Service worker registration failed
        });
    });
  }
}

try {
  sessionStorage.removeItem('kr_app_reload_done');
} catch (_) {}

createRoot(document.getElementById('root')).render(
  <HelmetProvider>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </HelmetProvider>
);
