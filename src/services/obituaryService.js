import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const api = axios.create({
  baseURL: `${API_BASE_URL}/obituaries`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const obituaryService = {
  getActive: async () => {
    const response = await api.get('/');
    return response.data;
  },
  getAllAdmin: async (params = {}) => {
    const response = await api.get('/admin/all', { params });
    return response.data;
  },
  create: async (payload) => {
    const response = await api.post('/', payload);
    return response.data;
  },
  update: async (id, payload) => {
    const response = await api.put(`/${id}`, payload);
    return response.data;
  },
  toggleStatus: async (id) => {
    const response = await api.patch(`/${id}/toggle`);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/${id}`);
    return response.data;
  },
};

export default obituaryService;
