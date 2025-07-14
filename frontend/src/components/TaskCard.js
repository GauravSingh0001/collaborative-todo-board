import React, { useContext, useState } from 'react';
import '../styles/TaskCard.css';
import { AuthContext } from '../contexts/AuthContext';
import { SocketContext } from '../contexts/SocketContext';
import { smartAssignTask } from '../services/taskOperationsService';

const TaskCard = ({ task, onEdit, onDelete, onDragStart, currentUser }) => {
  const { user } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);
  const [isSmartAssigning, setIsSmartAssigning] = useState(false);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return '#ff6b6b';
      case 'Medium': return '#ffd93d';
      case 'Low': return '#6bcf7f';
      default: return '#ddd';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit(task);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this task?')) {
      onDelete(task._id);
    }
  };

  const handleSmartAssign = async (e) => {
    e.stopPropagation();
    if (!user || isSmartAssigning) return;

    try {
      setIsSmartAssigning(true);

      const result = await smartAssignTask(task._id);

      if (result.success) {
        socket.emit('taskUpdated', {
          taskId: task._id,
          updates: { assignedTo: result.assignedUser },
          updatedBy: user._id
        });

        if (window.showNotification) {
          window.showNotification(
            `Task assigned to ${result.assignedUser.name}`,
            'success'
          );
        }
      }
    } catch (error) {
      console.error('Smart assign failed:', error);
      if (window.showNotification) {
        window.showNotification(
          error.message || 'Failed to smart assign task',
          'error'
        );
      }
    } finally {
      setIsSmartAssigning(false);
    }
  };

  return (
    <div
      className="task-card"
      draggable
      onDragStart={(e) => onDragStart(e, task)}
    >
      <div className="task-header">
        <h4 className="task-title">{task.title}</h4>
        <div className="task-actions">
          <button 
            className="action-btn edit-btn"
            onClick={handleEdit}
            title="Edit task"
          >
            ✏️
          </button>

          <button
            className="action-btn smart-assign-btn"
            onClick={handleSmartAssign}
            disabled={isSmartAssigning}
            title="Smart assign to user with fewest tasks"
          >
            {isSmartAssigning ? (
              <span className="loading-spinner">⟳</span>
            ) : (
              <span className="smart-icon">🎯</span>
            )}
          </button>

          <button 
            className="action-btn delete-btn"
            onClick={handleDelete}
            title="Delete task"
          >
            🗑️
          </button>
        </div>
      </div>

      {task.description && (
        <p className="task-description">{task.description}</p>
      )}

      <div className="task-meta">
        <div className="task-priority">
          <span 
            className="priority-indicator"
            style={{ backgroundColor: getPriorityColor(task.priority) }}
          ></span>
          <span className="priority-text">{task.priority}</span>
        </div>

        <div className="task-assignee">
          <span className="assignee-label">Assigned to:</span>
          <span className="assignee-name">
            {task.assignedUser.username}
            {task.assignedUser._id === currentUser.id && ' (You)'}
          </span>
        </div>
      </div>

      <div className="task-footer">
        <div className="task-dates">
          <span className="created-date">
            Created: {formatDate(task.createdAt)}
          </span>
          {task.updatedAt !== task.createdAt && (
            <span className="updated-date">
              Updated: {formatDate(task.updatedAt)}
            </span>
          )}
        </div>

        <div className="task-creator">
          <span className="creator-label">By:</span>
          <span className="creator-name">{task.createdBy.username}</span>
        </div>
      </div>

      {task.isBeingEdited && (
        <div className="editing-indicator">
          <span className="editing-text">
            Being edited by {task.editedBy?.username || 'someone'}
          </span>
        </div>
      )}
    </div>
  );
};

export default TaskCard;
