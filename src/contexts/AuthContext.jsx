import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import authService from '../services/authService';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    // Initialize user from localStorage immediately to prevent flashing
    try {
      const token = localStorage.getItem('authToken');
      const cachedUser = localStorage.getItem('user');
      if (token && cachedUser) {
        return JSON.parse(cachedUser);
      }
    } catch (error) {
      console.warn('Error parsing cached user data:', error);
    }
    return null;
  });
  const [loading, setLoading] = useState(false); // Start with false since we have initial state
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize auth state - only once
  useEffect(() => {
    if (isInitialized) return;

    // Simple synchronous initialization
    try {
      const token = localStorage.getItem('authToken');
      const cachedUser = localStorage.getItem('user');

      if (token && cachedUser) {
        try {
          const parsedUser = JSON.parse(cachedUser);
          if (parsedUser && typeof parsedUser === 'object') {
            // User is already set in useState initializer - no action needed
          } else {
            throw new Error('Invalid user data');
          }
        } catch (parseError) {
          console.warn('Invalid cached user data, clearing:', parseError);
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          setUser(null);
        }
      } else if (token && !cachedUser) {
        // Token without user data - invalid state
        localStorage.removeItem('authToken');
        setUser(null);
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      setUser(null);
    } finally {
      setIsInitialized(true);
    }
  }, [isInitialized]); // Add isInitialized as dependency to prevent infinite loops

  // Login function
  const login = useCallback(async (credentials) => {
    try {
      setLoading(true);
      setError(null);

      console.log('AuthContext login called with:', credentials);
      const response = await authService.login(credentials);
      console.log('AuthService login response:', response);

      // Try multiple possible paths for user data
      let userData =
        response.data?.data?.user || response.data?.user || response.data;

      // If we got a user object, extract it properly
      if (userData && userData.user) {
        userData = userData.user;
      }

      console.log('Extracted user data:', userData);

      if (userData) {
        setUser(userData);
        console.log('User set in context:', userData);
      } else {
        // Try to get user from localStorage as fallback
        console.warn(
          'No user data in response, checking localStorage:',
          response
        );
        const storageUser = authService.getCurrentUser();
        console.log('User from localStorage:', storageUser);
        if (storageUser) {
          setUser(storageUser);
          userData = storageUser;
        }
      }

      return { success: true, user: userData };
    } catch (error) {
      console.error('AuthContext login error:', error);
      const errorMessage =
        error.response?.data?.message || error.message || 'Login failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Register function
  const register = useCallback(async (userData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await authService.register(userData);
      const newUser = response.data?.data?.user;

      if (newUser) {
        setUser(newUser);
        // Store user in localStorage for persistence
        localStorage.setItem('user', JSON.stringify(newUser));
      }

      return { success: true, user: newUser };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || 'Registration failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      setLoading(true);
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setError(null);
      setLoading(false);
    }
  }, []);

  // Update profile function
  const updateProfile = useCallback(async (profileData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await authService.updateProfile(profileData);
      const updatedUser = response.data;

      if (updatedUser) {
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }

      return { success: true, user: updatedUser };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Profile update failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Update user function (alias for updateProfile for compatibility)
  const updateUser = useCallback((userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  }, []);

  // Change password function
  const changePassword = useCallback(async (passwordData) => {
    try {
      setLoading(true);
      setError(null);

      await authService.changePassword(passwordData);
      return { success: true };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Password change failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Utility functions - use useMemo for stability
  const isAuthenticated = useMemo(() => {
    // Check if we have both user and token, and not loading
    const token = localStorage.getItem('authToken');
    return !loading && user !== null && token && isInitialized;
  }, [user, loading, isInitialized]);

  const isAdmin = useMemo(() => user?.role === 'admin', [user]);
  const isModerator = useMemo(() => user?.role === 'moderator', [user]);
  const isAuthor = useMemo(() => user?.role === 'author', [user]);
  const hasRole = useCallback((role) => user?.role === role, [user]);
  const hasAnyRole = useCallback((roles) => roles.includes(user?.role), [user]);

  // Clear error function
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Refresh profile function (for manual refresh)
  const refreshProfile = useCallback(async () => {
    try {
      console.log('🔄 Refreshing user profile...');

      const response = await authService.getProfile();
      console.log('🔄 Profile response:', response);

      if (response?.data?.user) {
        const userData = response.data.user;
        console.log('🔄 New user data:', userData);
        console.log('🔄 New canPublish status:', userData.canPublish);

        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        console.log('🔄 User data updated successfully');
        return userData;
      }
    } catch (error) {
      console.warn('Could not refresh profile:', error);
      throw error;
    }
  }, []);

  const value = useMemo(
    () => ({
      // State
      user,
      loading,
      error,
      isAuthenticated,
      isAdmin,
      isModerator,
      isAuthor,

      // Functions
      login,
      register,
      logout,
      updateProfile,
      updateUser,
      changePassword,
      hasRole,
      hasAnyRole,
      clearError,
      refreshProfile,
    }),
    [
      user,
      loading,
      error,
      isAuthenticated,
      isAdmin,
      isModerator,
      isAuthor,
      login,
      register,
      logout,
      updateProfile,
      updateUser,
      changePassword,
      hasRole,
      hasAnyRole,
      clearError,
      refreshProfile,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};
