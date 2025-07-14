// src/components/NotificationSystem.js
import React, { useState, useEffect, useCallback } from 'react';
import './NotificationSystem.css';

const NotificationSystem = () => {
  const [notifications, setNotifications] = useState([]);

  // Add notification
  const addNotification = useCallback((notification) => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      type: notification.type || 'info',
      title: notification.title || '',
      message: notification.message || '',
      duration: notification.duration || 5000,
      persistent: notification.persistent || false,
      createdAt: new Date()
    };

    setNotifications(prev => [...prev, newNotification]);

    // Auto-remove non-persistent notifications
    if (!newNotification.persistent) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }

    return id;
  }, []);

  // Remove notification
  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Expose methods globally
  useEffect(() => {
    window.notify = {
      success: (message, options = {}) => addNotification({
        type: 'success',
        title: 'Success',
        message,
        ...options
      }),
      error: (message, options = {}) => addNotification({
        type: 'error',
        title: 'Error',
        message,
        persistent: true,
        ...options
      }),
      warning: (message, options = {}) => addNotification({
        type: 'warning',
        title: 'Warning',
        message,
        ...options
      }),
      info: (message, options = {}) => addNotification({
        type: 'info',
        title: 'Info',
        message,
        ...options
      }),
      custom: addNotification,
      clear: clearAll
    };

    return () => {
      delete window.notify;
    };
  }, [addNotification, clearAll]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  return (
    <div className="notification-container">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={`notification notification-${notification.type}`}
        >
          <div className="notification-icon">
            {getNotificationIcon(notification.type)}
          </div>
          <div className="notification-content">
            {notification.title && (
              <div className="notification-title">{notification.title}</div>
            )}
            <div className="notification-message">{notification.message}</div>
          </div>
          <button
            className="notification-close"
            onClick={() => removeNotification(notification.id)}
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

export default NotificationSystem;