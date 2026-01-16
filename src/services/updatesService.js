import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const api = axios.create({
  baseURL: `${API_BASE_URL}/updates`,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

const updatesService = {
  subscribe: async (payload) => {
    try {
      const response = await api.post('/subscribe', payload);
      return response.data;
    } catch (error) {
      // Better error handling
      const errorMessage = error?.response?.data?.message || 
                          error?.message || 
                          'Failed to subscribe. Please try again.';
      throw new Error(errorMessage);
    }
  },
};

export default updatesService;











