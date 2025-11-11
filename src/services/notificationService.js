import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api/v1';

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

const notificationService = {
  // Get users for notification selection
  getUsers: async (search = '', role = 'all') => {
    const response = await api.get('/notifications/users', {
      params: { search, role },
    });
    return response.data;
  },

  // Send notification to selected users
  sendNotification: async (data) => {
    const response = await api.post('/notifications/send', data);
    return response.data;
  },

  // Send test email
  sendTestEmail: async (data) => {
    const response = await api.post('/notifications/test', data);
    return response.data;
  },
};

export default notificationService;
