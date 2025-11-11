import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add auth token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const settingsService = {
  // Get site settings
  getSettings: async () => {
    const response = await api.get('/settings');
    return response.data;
  },

  // Update site settings
  updateSettings: async (data) => {
    const response = await api.patch('/settings', data);
    return response.data;
  },
};

export default settingsService;

