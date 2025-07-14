import React, { useState, useEffect } from 'react';
import TaskCard from './TaskCard';
import TaskModal from './TaskModal';
import ConflictModal from './ConflictModal';
import '../styles/KanbanBoard.css';

const KanbanBoard = ({ user, socket, token }) => {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [conflictData, setConflictData] = useState(null);
  const [draggedTask, setDraggedTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const columns = [
    { id: 'Todo', title: 'To Do', color: '#ff6b6b' },
    { id: 'In Progress', title: 'In Progress', color: '#4ecdc4' },
    { id: 'Done', title: 'Done', color: '#45b7d1' }
  ];

  useEffect(() => {
    fetchTasks();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('task_created', (task) => {
        setTasks(prevTasks => [...prevTasks, task]);
      });

      socket.on('task_updated', (task) => {
        setTasks(prevTasks => 
          prevTasks.map(t => t._id === task._id ? task : t)
        );
      });

      socket.on('task_moved', (task) => {
        setTasks(prevTasks => 
          prevTasks.map(t => t._id === task._id ? task : t)
        );
      });

      socket.on('task_deleted', (taskId) => {
        setTasks(prevTasks => prevTasks.filter(t => t._id !== taskId));
      });

      socket.on('task_smart_assigned', (task) => {
        setTasks(prevTasks => 
          prevTasks.map(t => t._id === task._id ? task : t)
        );
      });

      socket.on('edit_conflict', (data) => {
        setConflictData(data);
      });

      return () => {
        socket.off('task_created');
        socket.off('task_updated');
        socket.off('task_moved');
        socket.off('task_deleted');
        socket.off('task_smart_assigned');
        socket.off('edit_conflict');
      };
    }
  }, [socket]);

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      } else {
        setError('Failed to fetch tasks');
      }
    } catch (error) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/tasks/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleCreateTask = async (taskData) => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(taskData)
      });

      if (response.ok) {
        const newTask = await response.json();
        setTasks(prevTasks => [...prevTasks, newTask]);
        socket.emit('task_created', newTask);
        setShowModal(false);
      } else {
        const errorData = await response.json();
        setError(errorData.error);
      }
    } catch (error) {
      setError('Network error');
    }
  };

  const handleUpdateTask = async (taskId, taskData) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(taskData)
      });

      if (response.ok) {
        const updatedTask = await response.json();
        setTasks(prevTasks => 
          prevTasks.map(t => t._id === taskId ? updatedTask : t)
        );
        socket.emit('task_updated', updatedTask);
        setEditingTask(null);
        setShowModal(false);
      } else {
        const errorData = await response.json();
        if (response.status === 409) {
          setConflictData(errorData);
        } else {
          setError(errorData.error);
        }
      }
    } catch (error) {
      setError('Network error');
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setTasks(prevTasks => prevTasks.filter(t => t._id !== taskId));
        socket.emit('task_deleted', taskId);
      } else {
        setError('Failed to delete task');
      }
    } catch (error) {
      setError('Network error');
    }
  };

  const handleSmartAssign = async (taskId) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/smart-assign`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const updatedTask = await response.json();
        setTasks(prevTasks => 
          prevTasks.map(t => t._id === taskId ? updatedTask : t)
        );
        socket.emit('task_smart_assigned', updatedTask);
      } else {
        setError('Failed to smart assign task');
      }
    } catch (error) {
      setError('Network error');
    }
  };

  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    
    if (!draggedTask || draggedTask.status === newStatus) {
      setDraggedTask(null);
      return;
    }

    try {
      const response = await fetch(`/api/tasks/${draggedTask._id}/move`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        const updatedTask = await response.json();
        setTasks(prevTasks => 
          prevTasks.map(t => t._id === draggedTask._id ? updatedTask : t)
        );
        socket.emit('task_moved', updatedTask);
      } else {
        setError('Failed to move task');
      }
    } catch (error) {
      setError('Network error');
    }

    setDraggedTask(null);
  };

  const getTasksByColumn = (columnId) => {
    return tasks.filter(task => task.status === columnId);
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTask(null);
  };

  const handleConflictResolve = (resolution) => {
    setConflictData(null);
    if (resolution === 'retry') {
      // Retry the operation
      fetchTasks();
    }
  };

  if (loading) {
    return <div className="loading">Loading tasks...</div>;
  }

  return (
    <div className="kanban-board">
      {error && (
        <div className="error-banner">
          {error}
          <button onClick={() => setError('')} className="close-error">×</button>
        </div>
      )}
      
      <div className="board-header">
        <h2>Collaborative Board</h2>
        <button 
          className="add-task-button"
          onClick={() => setShowModal(true)}
        >
          + Add Task
        </button>
      </div>

      <div className="board-columns">
        {columns.map(column => (
          <div 
            key={column.id}
            className="column"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            <div className="column-header" style={{ borderTopColor: column.color }}>
              <h3>{column.title}</h3>
              <span className="task-count">
                {getTasksByColumn(column.id).length}
              </span>
            </div>
            
            <div className="column-content">
              {getTasksByColumn(column.id).map(task => (
                <TaskCard
                  key={task._id}
                  task={task}
                  onEdit={handleEditTask}
                  onDelete={handleDeleteTask}
                  onSmartAssign={handleSmartAssign}
                  onDragStart={handleDragStart}
                  currentUser={user}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <TaskModal
          task={editingTask}
          users={users}
          onSave={editingTask ? handleUpdateTask : handleCreateTask}
          onClose={handleCloseModal}
        />
      )}

      {conflictData && (
        <ConflictModal
          conflictData={conflictData}
          onResolve={handleConflictResolve}
        />
      )}
    </div>
  );
};

export default KanbanBoard;