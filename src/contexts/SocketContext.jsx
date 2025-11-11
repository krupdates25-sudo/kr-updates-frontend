import { createContext, useContext, useEffect, useState } from 'react';
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
  const { user } = useAuth();

  useEffect(() => {
    // Create socket connection
    const newSocket = io(SOCKET_URL, {
      withCredentials: true,
      autoConnect: true,
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('🔌 Connected to server:', newSocket.id);
      setConnected(true);
    });

    // Listen for notifications
    newSocket.on('notification', (data) => {
      console.log('🔔 Received notification:', data);
      // You can add a notification handler here if needed
    });

    newSocket.on('disconnect', () => {
      console.log('🔌 Disconnected from server');
      setConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('🔌 Connection error:', error);
      setConnected(false);
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      if (newSocket) {
        newSocket.close();
      }
    };
  }, []); // Empty dependency array to run only once

  // Join user room when user is authenticated
  useEffect(() => {
    if (socket && user && connected) {
      console.log('👤 Joining user room:', user._id);
      socket.emit('joinUser', user._id);

      return () => {
        console.log('👤 Leaving user room:', user._id);
        socket.emit('leaveUser', user._id);
      };
    }
  }, [socket, user, connected]);

  const joinPost = (postId) => {
    if (socket && connected) {
      socket.emit('joinPost', postId);
    }
  };

  const leavePost = (postId) => {
    if (socket && connected) {
      socket.emit('leavePost', postId);
    }
  };

  const value = {
    socket,
    connected,
    joinPost,
    leavePost,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

export default SocketContext;
