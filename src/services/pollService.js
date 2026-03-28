import axios from 'axios';
import { API_BASE_URL } from '../config/api';

/** Public poll API — never sends auth. Anonymous voting uses clientId only. */
const pollPublicApi = axios.create({
  baseURL: `${API_BASE_URL}/polls`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

/** Admin poll API — Bearer token for create/list/update/delete */
const pollAdminApi = axios.create({
  baseURL: `${API_BASE_URL}/polls`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

pollAdminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const pollService = {
  getActive: async (clientId) => {
    const params = {};
    if (clientId) params.clientId = clientId;
    const response = await pollPublicApi.get('/', { params });
    return response.data;
  },

  getById: async (id, clientId) => {
    const params = {};
    if (clientId) params.clientId = clientId;
    const response = await pollPublicApi.get(`/${id}`, { params });
    return response.data;
  },

  /** Anonymous-only: clientId is required */
  vote: async (pollId, optionIndex, clientId) => {
    if (!clientId) {
      throw new Error('clientId is required');
    }
    const response = await pollPublicApi.post(`/${pollId}/vote`, {
      optionIndex,
      clientId,
    });
    return response.data;
  },

  getAllAdmin: async (params = {}) => {
    const response = await pollAdminApi.get('/admin/all', { params });
    return response.data;
  },

  create: async (payload) => {
    const response = await pollAdminApi.post('/', payload);
    return response.data;
  },

  update: async (id, payload) => {
    const response = await pollAdminApi.put(`/${id}`, payload);
    return response.data;
  },

  delete: async (id) => {
    const response = await pollAdminApi.delete(`/${id}`);
    return response.data;
  },
};

export default pollService;
