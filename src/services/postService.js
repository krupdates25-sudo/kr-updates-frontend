import axios from 'axios';
import { ApiCache } from '../utils/debounce';

const API_BASE_URL = 'http://localhost:5000/api/v1';

// Create cache instances for different types of data
const postsCache = new ApiCache(100, 2 * 60 * 1000); // 2 minutes for posts
const detailsCache = new ApiCache(50, 5 * 60 * 1000); // 5 minutes for post details

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

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle rate limiting
    if (error.response?.status === 429) {
      console.warn('Rate limit hit - API request throttled');
      throw new Error('Too many requests. Please slow down.');
    }

    // Handle network errors
    if (!error.response) {
      throw new Error('Network error. Please check your connection.');
    }

    throw error.response?.data || error;
  }
);

const postService = {
  // Get all published posts
  getAllPosts: async (params = {}) => {
    try {
      const cacheKey = `posts-${JSON.stringify(params)}`;

      // Check cache first
      const cachedData = postsCache.get(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      const response = await api.get('/posts', { params });

      // Cache the response
      postsCache.set(cacheKey, response.data);

      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get trending posts
  getTrendingPosts: async (params = {}) => {
    try {
      const cacheKey = `trending-posts-${JSON.stringify(params)}`;

      // Check cache first
      const cachedData = postsCache.get(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      const response = await api.get('/posts/trending', { params });

      // Cache the response
      postsCache.set(cacheKey, response.data);

      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get featured posts
  getFeaturedPosts: async () => {
    try {
      const response = await api.get('/posts/featured');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get posts by category
  getPostsByCategory: async (category) => {
    try {
      const response = await api.get(`/posts/category/${category}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Search posts
  searchPosts: async (query, filters = {}) => {
    try {
      const params = { q: query, ...filters };
      const response = await api.get('/posts/search', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get post by slug with full details
  getPostBySlug: async (slug) => {
    try {
      const cacheKey = `post-slug-${slug}`;

      // Check cache first
      const cachedData = detailsCache.get(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      const response = await api.get(`/posts/${slug}`);

      // Cache the response
      detailsCache.set(cacheKey, response.data);

      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get post by ID with full details
  getPostById: async (postId) => {
    try {
      const cacheKey = `post-id-${postId}`;

      // Check cache first
      const cachedData = detailsCache.get(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      const response = await api.get(`/posts/details/${postId}`);

      // Cache the response
      detailsCache.set(cacheKey, response.data);

      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get my posts (protected)
  getMyPosts: async () => {
    try {
      const response = await api.get('/posts/my/posts');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Create post (protected)
  createPost: async (postData) => {
    try {
      const response = await api.post('/posts', postData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update post (protected)
  updatePost: async (postId, postData) => {
    try {
      const response = await api.put(`/posts/${postId}`, postData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Delete post (protected)
  deletePost: async (postId) => {
    try {
      const response = await api.delete(`/posts/${postId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Like/unlike post
  toggleLike: async (postId) => {
    try {
      const response = await api.post(`/posts/${postId}/like`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Check if user liked a post
  checkLikeStatus: async (postId) => {
    try {
      const response = await api.get(`/posts/${postId}/like-status`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get post likes
  getPostLikes: async (postId) => {
    try {
      const response = await api.get(`/posts/${postId}/likes`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Comments functionality
  getComments: async (postId) => {
    try {
      const response = await api.get(`/posts/${postId}/comments`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  addComment: async (postId, commentData) => {
    try {
      const response = await api.post(`/posts/${postId}/comments`, commentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  updateComment: async (postId, commentId, commentData) => {
    try {
      const response = await api.put(
        `/posts/${postId}/comments/${commentId}`,
        commentData
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  deleteComment: async (postId, commentId) => {
    try {
      const response = await api.delete(
        `/posts/${postId}/comments/${commentId}`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  likeComment: async (postId, commentId) => {
    try {
      const response = await api.post(
        `/posts/${postId}/comments/${commentId}/like`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Reply to comment (nested comments)
  replyToComment: async (postId, commentId, replyData) => {
    try {
      const response = await api.post(
        `/posts/${postId}/comments/${commentId}/replies`,
        replyData
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Share post
  sharePost: async (postId, shareData = {}) => {
    try {
      const response = await api.post(`/posts/${postId}/share`, shareData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Bookmark post
  toggleBookmark: async (postId) => {
    try {
      const response = await api.post(`/posts/${postId}/bookmark`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get user bookmarks
  getBookmarks: async () => {
    try {
      const response = await api.get('/posts/bookmarks');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get user bookmarks with pagination
  getUserBookmarks: async (page = 1, limit = 20) => {
    try {
      const response = await api.get('/posts/my/bookmarks', {
        params: { page, limit },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Check bookmark status
  checkBookmarkStatus: async (postId) => {
    try {
      const response = await api.get(`/posts/${postId}/bookmark-status`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Report post
  reportPost: async (postId, reportData) => {
    try {
      const response = await api.post(`/posts/${postId}/report`, reportData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Toggle post visibility (admin only)
  togglePostVisibility: async (postId) => {
    try {
      const response = await api.patch(`/posts/${postId}/visibility`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default postService;
