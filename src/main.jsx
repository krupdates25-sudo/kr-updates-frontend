// Disable console.logs in production (must be first import)
import './utils/disableConsole.js';

import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { ThemeProvider } from './contexts/ThemeContext.jsx';

// Register service worker for PWA
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        // Service worker registered successfully
      })
      .catch((error) => {
        // Service worker registration failed
      });
  });
}

createRoot(document.getElementById('root')).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>
);
