import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const api = axios.create({
  baseURL: `${API_URL}/breaking-news`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const breakingNewsService = {
  // Get all breaking news stories
  getStories: async () => {
    try {
      const response = await api.get('/');
      return response.data;
    } catch (error) {
      console.error('Error fetching breaking news stories:', error);
      throw error;
    }
  },

  // Get a single story by ID
  getStoryById: async (id) => {
    try {
      const response = await api.get(`/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching breaking news story:', error);
      throw error;
    }
  },

  // Create a new breaking news story
  createStory: async (storyData) => {
    try {
      const response = await api.post('/', storyData);
      return response.data;
    } catch (error) {
      console.error('Error creating breaking news story:', error);
      throw error;
    }
  },

  // Update a breaking news story
  updateStory: async (id, storyData) => {
    try {
      const response = await api.put(`/${id}`, storyData);
      return response.data;
    } catch (error) {
      console.error('Error updating breaking news story:', error);
      throw error;
    }
  },

  // Delete a breaking news story
  deleteStory: async (id) => {
    try {
      const response = await api.delete(`/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting breaking news story:', error);
      throw error;
    }
  },

  // Toggle story active status
  toggleStoryStatus: async (id) => {
    try {
      const response = await api.patch(`/${id}/toggle`);
      return response.data;
    } catch (error) {
      console.error('Error toggling breaking news story status:', error);
      throw error;
    }
  },
};

export default breakingNewsService;
