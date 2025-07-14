import React, { useState, useEffect } from 'react';
import './SmartAssignModal.css';

const SmartAssignModal = ({ isOpen, onClose, onAssign, task, users = [], tasks = [] }) => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [userTaskCounts, setUserTaskCounts] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && users.length > 0) {
      calculateUserTaskCounts();
    }
  }, [isOpen, users, tasks]);

  const calculateUserTaskCounts = () => {
    const counts = {};
    
    // Initialize counts for all users
    users.forEach(user => {
      counts[user._id] = {
        user: user,
        activeTasks: 0,
        todoTasks: 0,
        inProgressTasks: 0
      };
    });

    // Count active tasks for each user
    tasks.forEach(task => {
      if (task.assignedUser && task.status !== 'done') {
        const userId = task.assignedUser._id || task.assignedUser;
        if (counts[userId]) {
          counts[userId].activeTasks++;
          if (task.status === 'todo') {
            counts[userId].todoTasks++;
          } else if (task.status === 'in-progress') {
            counts[userId].inProgressTasks++;
          }
        }
      }
    });

    setUserTaskCounts(counts);

    // Find user with least active tasks
    const usersArray = Object.values(counts);
    const minTasks = Math.min(...usersArray.map(u => u.activeTasks));
    const optimalUser = usersArray.find(u => u.activeTasks === minTasks);
    
    setSelectedUser(optimalUser);
  };

  const handleAssign = async () => {
    if (!selectedUser) return;

    setLoading(true);
    try {
      await onAssign(task._id, selectedUser.user._id);
      onClose();
    } catch (error) {
      console.error('Failed to assign task:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSuggestionReason = (userCount) => {
    const reasons = [];
    
    if (userCount.activeTasks === 0) {
      reasons.push('No active tasks');
    } else {
      reasons.push(`${userCount.activeTasks} active task${userCount.activeTasks > 1 ? 's' : ''}`);
    }

    if (userCount.todoTasks > 0) {
      reasons.push(`${userCount.todoTasks} in Todo`);
    }
    
    if (userCount.inProgressTasks > 0) {
      reasons.push(`${userCount.inProgressTasks} in Progress`);
    }

    return reasons.join(', ');
  };

  if (!isOpen) return null;

  const sortedUsers = Object.values(userTaskCounts).sort((a, b) => 
    a.activeTasks - b.activeTasks
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="smart-assign-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Smart Task Assignment</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="task-info">
            <h3>Task: {task?.title}</h3>
            <p>{task?.description}</p>
          </div>

          <div className="assignment-section">
            <h4>Recommended Assignment</h4>
            <p className="recommendation-text">
              Based on current workload, we recommend assigning this task to the user with the fewest active tasks.
            </p>

            <div className="user-list">
              {sortedUsers.map((userCount, index) => (
                <div 
                  key={userCount.user._id}
                  className={`user-option ${selectedUser?.user._id === userCount.user._id ? 'selected' : ''} ${index === 0 ? 'recommended' : ''}`}
                  onClick={() => setSelectedUser(userCount)}
                >
                  <div className="user-info">
                    <div className="user-avatar">
                      {userCount.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="user-details">
                      <div className="user-name">{userCount.user.name}</div>
                      <div className="user-email">{userCount.user.email}</div>
                    </div>
                  </div>
                  
                  <div className="workload-info">
                    <div className="task-count">
                      <span className="count-number">{userCount.activeTasks}</span>
                      <span className="count-label">active tasks</span>
                    </div>
                    <div className="task-breakdown">
                      {getSuggestionReason(userCount)}
                    </div>
                  </div>
                  
                  {index === 0 && (
                    <div className="recommended-badge">
                      ⭐ Recommended
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="assignment-logic">
            <h4>How Smart Assignment Works</h4>
            <ul>
              <li>Counts active tasks (Todo + In Progress) for each user</li>
              <li>Recommends the user with the fewest active tasks</li>
              <li>Helps balance workload across team members</li>
              <li>Excludes completed tasks from the calculation</li>
            </ul>
          </div>
        </div>

        <div className="modal-footer">
          <button className="cancel-button" onClick={onClose}>
            Cancel
          </button>
          <button 
            className="assign-button" 
            onClick={handleAssign}
            disabled={!selectedUser || loading}
          >
            {loading ? 'Assigning...' : `Assign to ${selectedUser?.user.name}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SmartAssignModal;