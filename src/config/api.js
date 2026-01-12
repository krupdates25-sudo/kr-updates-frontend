// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL;
const SOCKET_URL = import.meta.env.VITE_API_URL 
  && import.meta.env.VITE_API_URL.replace('/api/v1', '');

export { API_BASE_URL, SOCKET_URL };

