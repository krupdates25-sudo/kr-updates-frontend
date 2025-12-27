import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { SocketProvider } from './contexts/SocketContext.jsx';
import { ThemeProvider } from './contexts/ThemeContext.jsx';

// Suppress expected WebSocket errors in console
const originalError = console.error;
console.error = (...args) => {
  // Filter out expected WebSocket connection errors
  const errorMessage = args[0]?.toString() || '';
  if (
    errorMessage.includes('WebSocket') &&
    (errorMessage.includes('failed to connect') ||
      errorMessage.includes('closed without opened') ||
      errorMessage.includes('Connection closed'))
  ) {
    // Silently ignore expected WebSocket errors
    return;
  }
  // Log all other errors normally
  originalError.apply(console, args);
};

// Handle unhandled promise rejections (like WebSocket errors)
window.addEventListener('unhandledrejection', (event) => {
  const errorMessage = event.reason?.message || event.reason?.toString() || '';
  if (
    errorMessage.includes('WebSocket') ||
    errorMessage.includes('websocket') ||
    errorMessage.includes('Socket')
  ) {
    // Prevent WebSocket errors from showing in console
    event.preventDefault();
    console.warn('WebSocket connection issue (this is normal if server is not running)');
  }
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SocketProvider>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </SocketProvider>
  </StrictMode>
);
