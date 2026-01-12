import axios from 'axios';
import { API_BASE_URL } from '../config/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: `${API_BASE_URL}/announcements`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/auth';
    }
    return Promise.reject(error.response?.data || error.message);
  }
);

const announcementService = {
  // User functions
  getActiveAnnouncements: async () => {
    return await api.get('/active');
  },

  getUnreadCount: async () => {
    return await api.get('/unread-count');
  },

  getAnnouncement: async (id) => {
    return await api.get(`/${id}`);
  },

  markAsRead: async (id) => {
    return await api.patch(`/${id}/read`);
  },

  markAllAsRead: async () => {
    return await api.patch('/mark-all-read');
  },

  // Admin functions
  getAllAnnouncements: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await api.get(`/?${queryString}`);
  },

  createAnnouncement: async (announcementData) => {
    return await api.post('/', announcementData);
  },

  updateAnnouncement: async (id, announcementData) => {
    return await api.patch(`/${id}`, announcementData);
  },

  deleteAnnouncement: async (id) => {
    return await api.delete(`/${id}`);
  },

  toggleAnnouncementStatus: async (id) => {
    return await api.patch(`/${id}/toggle-status`);
  },

  getAnnouncementStats: async () => {
    return await api.get('/admin/stats');
  },
};

export default announcementService;
