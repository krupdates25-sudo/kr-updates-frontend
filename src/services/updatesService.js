import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const api = axios.create({
  baseURL: `${API_BASE_URL}/updates`,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

const updatesService = {
  subscribe: async (payload) => {
    const response = await api.post('/subscribe', payload);
    return response.data;
  },
};

export default updatesService;










