// API Configuration
// Use Vercel backend URL as default, fallback to env variable or localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD 
    ? 'https://kr-updates-backend.vercel.app/api/v1'
    : 'http://localhost:5000/api/v1');

// Socket URL - remove /api/v1 from API URL for socket connection
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 
  (import.meta.env.PROD
    ? 'https://kr-updates-backend.vercel.app'
    : (import.meta.env.VITE_API_URL 
      ? import.meta.env.VITE_API_URL.replace('/api/v1', '')
      : 'http://localhost:5000'));

export { API_BASE_URL, SOCKET_URL };

