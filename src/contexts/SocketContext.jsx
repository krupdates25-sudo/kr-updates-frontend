import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { SOCKET_URL } from '../config/api';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    // Only create socket connection if SOCKET_URL is valid
    if (!SOCKET_URL || SOCKET_URL === 'undefined') {
      console.warn('⚠️ Socket URL not configured, skipping WebSocket connection');
      return;
    }

    let reconnectTimeout;
    const MAX_RECONNECT_ATTEMPTS = 5;
    const RECONNECT_DELAY = 3000; // 3 seconds

    // Create socket connection with proper error handling
    const newSocket = io(SOCKET_URL, {
      withCredentials: true,
      autoConnect: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: RECONNECT_DELAY,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      timeout: 10000,
    });

    newSocket.on('connect', () => {
      console.log('🔌 Connected to server:', newSocket.id);
      setConnected(true);
      setConnectionError(null);
      setReconnectAttempts(0);
    });

    // Listen for notifications
    newSocket.on('notification', (data) => {
      console.log('🔔 Received notification:', data);
      // You can add a notification handler here if needed
    });

    newSocket.on('disconnect', (reason) => {
      console.log('🔌 Disconnected from server:', reason);
      setConnected(false);
      
      // Only set error for unexpected disconnects
      if (reason === 'io server disconnect') {
        // Server disconnected, don't reconnect automatically
        setConnectionError('Server disconnected. Please refresh the page.');
      } else if (reason === 'io client disconnect') {
        // Client disconnected intentionally, no error
        setConnectionError(null);
      }
    });

    newSocket.on('connect_error', (error) => {
      const attempts = reconnectAttempts + 1;
      setReconnectAttempts(attempts);
      
      // Only log error if we've exhausted reconnection attempts
      if (attempts >= MAX_RECONNECT_ATTEMPTS) {
        console.error('🔌 Connection error after max attempts:', error.message);
        setConnectionError('Unable to connect to server. Real-time features may be unavailable.');
        setConnected(false);
      } else {
        // Silently retry connection
        console.warn(`🔌 Connection attempt ${attempts}/${MAX_RECONNECT_ATTEMPTS} failed, retrying...`);
      }
    });

    newSocket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`🔄 Reconnection attempt ${attemptNumber}/${MAX_RECONNECT_ATTEMPTS}`);
    });

    newSocket.on('reconnect_failed', () => {
      console.error('🔌 Reconnection failed after max attempts');
      setConnectionError('Unable to reconnect to server. Real-time features may be unavailable.');
      setConnected(false);
    });

    // Handle WebSocket errors gracefully
    newSocket.io.on('error', (error) => {
      console.error('🔌 Socket.IO error:', error);
      // Don't show error to user for network issues, just log
      if (error.type === 'TransportError') {
        console.warn('⚠️ WebSocket transport error, falling back to polling');
      }
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (newSocket) {
        newSocket.removeAllListeners();
        newSocket.close();
      }
    };
  }, []); // Empty dependency array to run only once

  // Join user room when user is authenticated
  useEffect(() => {
    if (socket && user && connected && user._id) {
      try {
        console.log('👤 Joining user room:', user._id);
        socket.emit('joinUser', user._id);

        return () => {
          try {
            console.log('👤 Leaving user room:', user._id);
            socket.emit('leaveUser', user._id);
          } catch (error) {
            console.error('Error leaving user room:', error);
          }
        };
      } catch (error) {
        console.error('Error joining user room:', error);
      }
    }
  }, [socket, user, connected]);

  const joinPost = (postId) => {
    if (socket && connected && postId) {
      try {
        socket.emit('joinPost', postId);
      } catch (error) {
        console.error('Error joining post room:', error);
      }
    }
  };

  const leavePost = (postId) => {
    if (socket && connected && postId) {
      try {
        socket.emit('leavePost', postId);
      } catch (error) {
        console.error('Error leaving post room:', error);
      }
    }
  };

  const value = {
    socket,
    connected,
    connectionError,
    joinPost,
    leavePost,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

export default SocketContext;
