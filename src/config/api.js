// API Configuration - base URL: api.krupdates.in
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD 
    ? 'https://api.krupdates.in/api/v1'
    : 'http://localhost:5000/api/v1');

// Socket URL - same host as API (api.krupdates.in)
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 
  (import.meta.env.PROD
    ? 'https://api.krupdates.in'
    : (import.meta.env.VITE_API_URL 
      ? import.meta.env.VITE_API_URL.replace(/\/api\/v1\/?$/, '')
      : 'http://localhost:5000'));

export { API_BASE_URL, SOCKET_URL };

