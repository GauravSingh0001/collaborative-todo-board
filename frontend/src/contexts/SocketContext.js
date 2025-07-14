// src/contexts/SocketContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

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
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      const newSocket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:5000', {
        auth: {
          token: localStorage.getItem('token')
        }
      });

      newSocket.on('connect', () => {
        console.log('Connected to server');
        setIsConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from server');
        setIsConnected(false);
      });

      newSocket.on('user_status_update', (data) => {
        setOnlineUsers(data.connectedUsers || []);
      });

      newSocket.on('user_typing', (data) => {
        setTypingUsers(prev => {
          const updated = { ...prev };
          if (data.isTyping) {
            updated[data.taskId] = updated[data.taskId] || [];
            if (!updated[data.taskId].find(u => u.userId === data.userId)) {
              updated[data.taskId].push({
                userId: data.userId,
                userName: data.userName
              });
            }
          } else {
            if (updated[data.taskId]) {
              updated[data.taskId] = updated[data.taskId].filter(u => u.userId !== data.userId);
              if (updated[data.taskId].length === 0) {
                delete updated[data.taskId];
              }
            }
          }
          return updated;
        });
      });

      newSocket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        setIsConnected(false);
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    } else {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
        setOnlineUsers([]);
        setTypingUsers({});
      }
    }
  }, [isAuthenticated, user]);

  const emit = (event, data) => {
    if (socket && isConnected) {
      socket.emit(event, data);
    }
  };

  const on = (event, callback) => {
    if (socket) {
      socket.on(event, callback);
    }
  };

  const off = (event, callback) => {
    if (socket) {
      socket.off(event, callback);
    }
  };

  const startTyping = (taskId) => {
    emit('typing_start', { taskId });
  };

  const stopTyping = (taskId) => {
    emit('typing_stop', { taskId });
  };

  const value = {
    socket,
    isConnected,
    onlineUsers,
    typingUsers,
    emit,
    on,
    off,
    startTyping,
    stopTyping
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};