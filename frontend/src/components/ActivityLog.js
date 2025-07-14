import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './ActivityLog.css';

const ActivityLog = ({ token }) => {
  const [actions, setActions] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io('http://localhost:5000', {
      auth: { token }
    });
    setSocket(newSocket);

    // Fetch initial actions
    fetchActions();

    // Listen for real-time action updates
    newSocket.on('actionLogged', (action) => {
      setActions(prev => [action, ...prev.slice(0, 19)]);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [token]);

  const fetchActions = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/actions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setActions(data);
    } catch (error) {
      console.error('Error fetching actions:', error);
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const actionTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now - actionTime) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const getActionIcon = (type) => {
    switch (type) {
      case 'create': return '➕';
      case 'update': return '✏️';
      case 'delete': return '🗑️';
      case 'assign': return '👤';
      case 'move': return '🔄';
      case 'smart_assign': return '🎯';
      default: return '📝';
    }
  };

  const getActionColor = (type) => {
    switch (type) {
      case 'create': return '#28a745';
      case 'update': return '#ffc107';
      case 'delete': return '#dc3545';
      case 'assign': return '#007bff';
      case 'move': return '#6f42c1';
      case 'smart_assign': return '#fd7e14';
      default: return '#6c757d';
    }
  };

  return (
    <div className="activity-log">
      <div className="activity-log-header">
        <h3>🔔 Activity Log</h3>
        <span className="activity-count">{actions.length} recent actions</span>
      </div>
      
      <div className="activity-list">
        {actions.length === 0 ? (
          <div className="no-activity">
            <p>No recent activity</p>
          </div>
        ) : (
          actions.map((action, index) => (
            <div 
              key={action._id || index} 
              className="activity-item"
              style={{ '--action-color': getActionColor(action.type) }}
            >
              <div className="activity-icon">
                {getActionIcon(action.type)}
              </div>
              <div className="activity-content">
                <div className="activity-main">
                  <span className="activity-user">{action.user?.username || 'Unknown'}</span>
                  <span className="activity-action">{action.description}</span>
                </div>
                <div className="activity-details">
                  {action.taskTitle && (
                    <span className="activity-task">"{action.taskTitle}"</span>
                  )}
                  <span className="activity-time">
                    {formatTimeAgo(action.timestamp)}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ActivityLog;