import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api/v1';

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

const advertisementService = {
  // Create new advertisement
  createAdvertisement: async (advertisementData) => {
    try {
      const response = await api.post('/advertisements', advertisementData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get all advertisements with pagination and filters
  getAllAdvertisements: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(`/advertisements?${queryString}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get active advertisements for display
  getActiveAdvertisements: async (position = 'random', limit = 5) => {
    try {
      const response = await api.get(
        `/advertisements/active?position=${position}&limit=${limit}`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get single advertisement
  getAdvertisement: async (id) => {
    try {
      const response = await api.get(`/advertisements/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update advertisement
  updateAdvertisement: async (id, advertisementData) => {
    try {
      const response = await api.patch(
        `/advertisements/${id}`,
        advertisementData
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update advertisement position (drag and drop)
  updateAdvertisementPosition: async (id, position, priority) => {
    try {
      const response = await api.patch(`/advertisements/${id}/position`, {
        position,
        priority,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Delete advertisement
  deleteAdvertisement: async (id) => {
    try {
      const response = await api.delete(`/advertisements/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Toggle advertisement status
  toggleAdvertisementStatus: async (id) => {
    try {
      const response = await api.patch(`/advertisements/${id}/toggle-status`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Track advertisement click
  trackClick: async (id) => {
    try {
      const response = await api.post(`/advertisements/${id}/click`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get advertisement analytics
  getAdvertisementAnalytics: async (id) => {
    try {
      const response = await api.get(`/advertisements/${id}/analytics`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get dashboard statistics (admin only)
  getDashboardStats: async () => {
    try {
      const response = await api.get('/advertisements/admin/dashboard-stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Bulk update advertisements
  bulkUpdateAdvertisements: async (ids, updates) => {
    try {
      const response = await api.patch('/advertisements/bulk/update', {
        ids,
        updates,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default advertisementService;
