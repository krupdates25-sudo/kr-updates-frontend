import axios from 'axios';
import { API_BASE_URL } from '../config/api';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: `${API_BASE_URL}/auth`, // Updated to match backend routes
  timeout: 10000,
  withCredentials: true, // Important for cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
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

// Response interceptor to handle common errors and token refresh
api.interceptors.response.use(
  (response) => {
    // Store token if present in response
    if (response.data?.data?.token) {
      localStorage.setItem('authToken', response.data.data.token);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Try to refresh token
      try {
        const refreshResponse = await api.post('/refresh-token');
        const newToken = refreshResponse.data?.data?.token;

        if (newToken) {
          localStorage.setItem('authToken', newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        console.error('Token refresh failed:', refreshError);
        authService.logout();
        window.location.href = '/';
      }
    }

    // Handle network errors
    if (!error.response) {
      throw new Error('Network error. Please check your connection.');
    }

    // Handle rate limiting
    if (error.response?.status === 429) {
      throw new Error('Too many requests. Please try again later.');
    }

    // Handle server errors
    if (error.response?.status >= 500) {
      throw new Error('Server error. Please try again later.');
    }

    return Promise.reject(error);
  }
);

const authService = {
  // Login user
  async login(credentials) {
    try {
      const response = await api.post('/login', credentials);

      // Store user data and token with 7-day persistence
      if (response.data?.data) {
        const userData = response.data.data.user;
        const token = response.data.data.token;
        
        // Store user and token in localStorage (persists for 7 days)
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('authToken', token);
        
        // Also store token expiry timestamp (7 days from now)
        const expiryTime = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days in milliseconds
        localStorage.setItem('tokenExpiry', expiryTime.toString());
      }

      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  // Register user
  async register(userData) {
    try {
      const response = await api.post('/register', userData);

      // Store user data and token with 7-day persistence (if token is provided)
      if (response.data?.data?.user) {
        const user = response.data.data.user;
        localStorage.setItem('user', JSON.stringify(user));
        
        // If token is provided (e.g., after email verification)
        if (response.data?.data?.token) {
          const token = response.data.data.token;
          localStorage.setItem('authToken', token);
          const expiryTime = Date.now() + (7 * 24 * 60 * 60 * 1000);
          localStorage.setItem('tokenExpiry', expiryTime.toString());
        }
      }

      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  // Logout user
  async logout() {
    try {
      await api.post('/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local storage including token expiry
      localStorage.removeItem('user');
      localStorage.removeItem('authToken');
      localStorage.removeItem('tokenExpiry');
    }
  },

  // Get current user
  getCurrentUser() {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  },

  // Check if user is authenticated
  isAuthenticated() {
    const token = localStorage.getItem('authToken');
    const user = this.getCurrentUser();
    return !!(token && user);
  },

  // Check if user has specific role
  hasRole(role) {
    const user = this.getCurrentUser();
    return user?.role === role;
  },

  // Check if user is admin
  isAdmin() {
    return this.hasRole('admin');
  },

  // Resend email verification
  async resendVerification(email) {
    try {
      const response = await api.post('/resend-verification', { email });
      return response.data;
    } catch (error) {
      console.error('Resend verification error:', error);
      throw error;
    }
  },

  // Get user profile
  async getProfile() {
    try {
      const response = await api.get('/me');
      return response.data;
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  },

  // Update profile
  async updateProfile(profileData) {
    try {
      // Use the users API endpoint for profile updates
      const response = await axios.patch(
        `${API_BASE_URL}/users/profile/me`,
        profileData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json',
          },
          withCredentials: true,
        }
      );

      // Update stored user data
      if (response.data?.data) {
        localStorage.setItem('user', JSON.stringify(response.data.data));
      }

      return response.data;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error.response?.data || error;
    }
  },

  // Change password
  async changePassword(passwordData) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/users/change-password`,
        passwordData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json',
          },
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error('Change password error:', error);
      throw error.response?.data || error;
    }
  },

  // Get user statistics
  async getUserStats() {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/users/stats/me`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json',
          },
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error('Get user stats error:', error);
      throw error.response?.data || error;
    }
  },

  // Forgot password
  async forgotPassword(email) {
    try {
      const response = await api.post('/forgot-password', { email });
      return response.data;
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  },

  // Reset password
  async resetPassword(token, password) {
    try {
      const response = await api.patch(`/reset-password/${token}`, {
        password,
      });
      return response.data;
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  },

  // Verify email
  async verifyEmail(token) {
    try {
      const response = await api.get(`/verify-email/${token}`);
      return response.data;
    } catch (error) {
      console.error('Email verification error:', error);
      throw error;
    }
  },

  // Get public user profile by ID
  async getUserProfile(userId) {
    try {
      // Use users endpoint for public profile
      const usersApi = axios.create({
        baseURL: `${API_BASE_URL}/users`,
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await usersApi.get(`/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Get user profile error:', error);
      throw error;
    }
  },
};

export default authService;
