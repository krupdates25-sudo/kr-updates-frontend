import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

// Create axios instance with default config
const api = axios.create({
  baseURL: `${API_BASE_URL}/search`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
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
  (response) => response,
  (error) => {
    console.error('Search API error:', error);
    return Promise.reject(error.response?.data || error.message);
  }
);

const searchService = {
  // Global search across all content types
  globalSearch: async (query, limit = 10) => {
    try {
      const response = await api.get(
        `/global?q=${encodeURIComponent(query)}&limit=${limit}`
      );
      return response.data;
    } catch (error) {
      console.error('Global search error:', error);
      throw error;
    }
  },

  // Search posts
  searchPosts: async (query, limit = 5) => {
    try {
      const response = await api.get(
        `/posts?q=${encodeURIComponent(query)}&limit=${limit}`
      );
      return response.data;
    } catch (error) {
      console.error('Posts search error:', error);
      throw error;
    }
  },

  // Search users
  searchUsers: async (query, limit = 5) => {
    try {
      const response = await api.get(
        `/users?q=${encodeURIComponent(query)}&limit=${limit}`
      );
      return response.data;
    } catch (error) {
      console.error('Users search error:', error);
      throw error;
    }
  },

  // Search announcements
  searchAnnouncements: async (query, limit = 5) => {
    try {
      const response = await api.get(
        `/announcements?q=${encodeURIComponent(query)}&limit=${limit}`
      );
      return response.data;
    } catch (error) {
      console.error('Announcements search error:', error);
      throw error;
    }
  },

  // Search categories
  searchCategories: async (query, limit = 5) => {
    try {
      const response = await api.get(
        `/categories?q=${encodeURIComponent(query)}&limit=${limit}`
      );
      return response.data;
    } catch (error) {
      console.error('Categories search error:', error);
      throw error;
    }
  },

  // Get search suggestions
  getSuggestions: async (query, limit = 8) => {
    try {
      const response = await api.get(
        `/suggestions?q=${encodeURIComponent(query)}&limit=${limit}`
      );
      return response.data;
    } catch (error) {
      console.error('Search suggestions error:', error);
      throw error;
    }
  },

  // Get trending searches
  getTrendingSearches: async (limit = 5) => {
    try {
      const response = await api.get(`/trending?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Trending searches error:', error);
      throw error;
    }
  },
};

export default searchService;
