import axios from 'axios';
import { API_BASE_URL } from '../config/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

const feedbackService = {
  // Submit feedback (public - can be anonymous)
  submitFeedback: async (feedbackData) => {
    try {
      const response = await api.post('/feedbacks', feedbackData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get all feedbacks (admin only)
  getAllFeedbacks: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(`/feedbacks?${queryString}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get single feedback (admin only)
  getFeedback: async (id) => {
    try {
      const response = await api.get(`/feedbacks/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update feedback status (admin only)
  updateFeedbackStatus: async (id, status) => {
    try {
      const response = await api.patch(`/feedbacks/${id}/status`, { status });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Delete feedback (admin only)
  deleteFeedback: async (id) => {
    try {
      const response = await api.delete(`/feedbacks/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get feedback statistics (admin only)
  getFeedbackStats: async () => {
    try {
      const response = await api.get('/feedbacks/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default feedbackService;

