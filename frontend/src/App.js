import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import './App.css';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Socket connection
const socket = io(API_BASE_URL);

// Auth Context
const AuthContext = React.createContext();

// Auth Provider Component
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      // Verify token and set user
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      setUser(userData);
    }
  }, [token]);

  const login = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    localStorage.setItem('token', userToken);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Login Component
const Login = ({ onSwitchToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        login(data.user, data.token);
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Login</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" disabled={loading} className="auth-button">
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p>
          Don't have an account?{' '}
          <button onClick={onSwitchToRegister} className="link-button">
            Register
          </button>
        </p>
      </div>
    </div>
  );
};

// Register Component
const Register = ({ onSwitchToLogin }) => {
  const [name, setName] = useState(''); // Changed from username to name
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    console.log('Sending registration data:', { name, email, password }); // Debug log

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }), // Changed from username to name
      });

      const data = await response.json();
      console.log('Response:', data); // Debug log

      if (response.ok) {
        login(data.user, data.token);
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      console.error('Network error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Register</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name</label> {/* Changed label from Username to Name */}
            <input
              type="text"
              value={name} // Changed from username to name
              onChange={(e) => setName(e.target.value)} // Changed from setUsername to setName
              required
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" disabled={loading} className="auth-button">
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        <p>
          Already have an account?{' '}
          <button onClick={onSwitchToLogin} className="link-button">
            Login
          </button>
        </p>
      </div>
    </div>
  );
};

// Task Card Component
const TaskCard = ({ task, onEdit, onDelete, onSmartAssign, users }) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: task.title,
    description: task.description,
    priority: task.priority,
    assignedUser: task.assignedUser._id
  });

  const handleEdit = () => {
    setIsEditing(true);
    socket.emit('taskEdit', { taskId: task._id, userId: user.id, isEditing: true });
  };

  const handleSave = () => {
    onEdit(task._id, editData);
    setIsEditing(false);
    socket.emit('taskEdit', { taskId: task._id, userId: user.id, isEditing: false });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({
      title: task.title,
      description: task.description,
      priority: task.priority,
      assignedUser: task.assignedUser._id
    });
    socket.emit('taskEdit', { taskId: task._id, userId: user.id, isEditing: false });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return '#ff4757';
      case 'Medium': return '#ffa502';
      case 'Low': return '#2ed573';
      default: return '#747d8c';
    }
  };

  return (
    <div className={`task-card ${task.isBeingEdited ? 'being-edited' : ''}`}>
      {task.isBeingEdited && task.editingUser && task.editingUser._id !== user.id && (
        <div className="editing-indicator">
          {task.editingUser.username} is editing this task
        </div>
      )}
      
      <div className="task-header">
        <div 
          className="priority-indicator" 
          style={{ backgroundColor: getPriorityColor(task.priority) }}
        ></div>
        <div className="task-actions">
          <button onClick={handleEdit} disabled={isEditing || task.isBeingEdited}>
            Edit
          </button>
          <button onClick={() => onSmartAssign(task._id)} className="smart-assign-btn">
            Smart Assign
          </button>
          <button onClick={() => onDelete(task._id)} className="delete-btn">
            Delete
          </button>
        </div>
      </div>

      {isEditing ? (
        <div className="edit-form">
          <input
            type="text"
            value={editData.title}
            onChange={(e) => setEditData({...editData, title: e.target.value})}
            placeholder="Task title"
          />
          <textarea
            value={editData.description}
            onChange={(e) => setEditData({...editData, description: e.target.value})}
            placeholder="Task description"
          />
          <select
            value={editData.priority}
            onChange={(e) => setEditData({...editData, priority: e.target.value})}
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
          <select
            value={editData.assignedUser}
            onChange={(e) => setEditData({...editData, assignedUser: e.target.value})}
          >
            {users.map(u => (
              <option key={u._id} value={u._id}>{u.username}</option>
            ))}
          </select>
          <div className="edit-actions">
            <button onClick={handleSave}>Save</button>
            <button onClick={handleCancel}>Cancel</button>
          </div>
        </div>
      ) : (
        <div className="task-content">
          <h3>{task.title}</h3>
          <p>{task.description}</p>
          <div className="task-meta">
            <span className="assigned-to">Assigned to: {task.assignedUser.username}</span>
            <span className={`priority priority-${task.priority.toLowerCase()}`}>
              {task.priority}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// Kanban Board Component
const KanbanBoard = () => {
  const { user, token, logout } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    assignedUser: user.id
  });
  const [conflictData, setConflictData] = useState(null);

  const columns = ['Todo', 'In Progress', 'Done'];

  useEffect(() => {
    fetchTasks();
    fetchUsers();
    fetchActivities();

    // Socket event listeners
    socket.on('taskUpdate', (data) => {
      if (data.action === 'create') {
        setTasks(prev => [...prev, data.task]);
      } else if (data.action === 'update') {
        setTasks(prev => prev.map(task => 
          task._id === data.task._id ? data.task : task
        ));
      } else if (data.action === 'delete') {
        setTasks(prev => prev.filter(task => task._id !== data.taskId));
      }
    });

    socket.on('activityUpdate', (activity) => {
      setActivities(prev => [activity, ...prev.slice(0, 19)]);
    });

    socket.on('taskEditStatus', (data) => {
      setTasks(prev => prev.map(task => 
        task._id === data.taskId 
          ? { ...task, isBeingEdited: data.isEditing, editingUser: data.isEditing ? { _id: data.userId } : null }
          : task
      ));
    });

    return () => {
      socket.off('taskUpdate');
      socket.off('activityUpdate');
      socket.off('taskEditStatus');
    };
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tasks`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users`, {
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

  const fetchActivities = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/activities`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setActivities(data);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };
// Add this debugging version to your App.js

const handleCreateTask = async (taskData) => {
  console.log('=== DEBUG: handleCreateTask called ===');
  console.log('Raw taskData received:', taskData);
  
  // Log each field individually
  console.log('Title:', taskData.title);
  console.log('Description:', taskData.description);
  console.log('Status:', taskData.status);
  console.log('Priority:', taskData.priority);
  console.log('AssignedUser:', taskData.assignedUser);
  console.log('DueDate:', taskData.dueDate);
  
  // Check for undefined/null values
  console.log('Title is undefined:', taskData.title === undefined);
  console.log('Title is null:', taskData.title === null);
  console.log('Title is empty string:', taskData.title === '');
  console.log('Title after trim:', taskData.title?.trim());
  
  try {
    const token = localStorage.getItem('token');
    console.log('Token exists:', !!token);
    
    if (!token) {
      console.error('No token found');
      return;
    }

    // Prepare the request body
    const requestBody = {
      title: taskData.title?.trim() || '',
      description: taskData.description?.trim() || '',
      status: taskData.status || 'Todo',
      priority: taskData.priority || 'Medium',
      assignedUser: taskData.assignedUser || null,
      dueDate: taskData.dueDate || null
    };
    
    console.log('=== REQUEST BODY TO SEND ===');
    console.log(JSON.stringify(requestBody, null, 2));
    
    // Check if title is empty after processing
    if (!requestBody.title || requestBody.title.trim() === '') {
      console.error('Title is empty after processing!');
      alert('Title is required and cannot be empty');
      return;
    }
    
    console.log('Making POST request to:', `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/tasks`);
    
    const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(requestBody)
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('=== SERVER ERROR RESPONSE ===');
      console.error('Status:', response.status);
      console.error('Error data:', errorData);
      
      // Show detailed error message
      if (errorData.error) {
        alert(`Validation Error: ${errorData.error}`);
      }
      if (errorData.details) {
        console.error('Validation details:', errorData.details);
      }
      if (errorData.validStatuses) {
        console.error('Valid statuses:', errorData.validStatuses);
      }
      
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const newTask = await response.json();
    console.log('=== SUCCESS ===');
    console.log('New task created:', newTask);
    
    // Update your tasks state
    setTasks(prevTasks => [...prevTasks, newTask]);
    
    // Show success message
    alert('Task created successfully!');
    
  } catch (error) {
    console.error('=== ERROR IN handleCreateTask ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Full error:', error);
    
    // Show user-friendly error message
    alert(`Failed to create task: ${error.message}`);
  }
};

  const handleEditTask = async (taskId, taskData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(taskData)
      });

      if (response.status === 409) {
        const conflictInfo = await response.json();
        setConflictData({
          taskId,
          taskData,
          conflict: conflictInfo
        });
      } else if (!response.ok) {
        const error = await response.json();
        alert(error.error);
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await fetch(`${API_BASE_URL}/api/tasks/${taskId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  };

  const handleSmartAssign = async (taskId) => {
    try {
      await fetch(`${API_BASE_URL}/api/tasks/${taskId}/smart-assign`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error('Error with smart assign:', error);
    }
  };

  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, status) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    const task = tasks.find(t => t._id === taskId);
    
    if (task && task.status !== status) {
      handleEditTask(taskId, { ...task, status });
    }
  };

  const handleConflictResolve = async (action) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tasks/${conflictData.taskId}/resolve-conflict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action,
          taskData: conflictData.taskData
        })
      });

      if (response.ok) {
        setConflictData(null);
      }
    } catch (error) {
      console.error('Error resolving conflict:', error);
    }
  };

  const getTasksByStatus = (status) => {
    return tasks.filter(task => task.status === status);
  };

  return (
    <div className="kanban-container">
      <header className="app-header">
        <h1>Collaborative Todo Board</h1>
        <div className="header-actions">
          <span>Welcome, {user.username}!</span>
          <button onClick={() => setShowActivityLog(!showActivityLog)}>
            {showActivityLog ? 'Hide' : 'Show'} Activity Log
          </button>
          <button onClick={logout}>Logout</button>
        </div>
      </header>

      <div className="main-content">
        <div className="create-task-form">
          <h3>Create New Task</h3>
          <form onSubmit={handleCreateTask}>
            <div className="form-row">
              <input
                type="text"
                placeholder="Task title"
                value={newTask.title}
                onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                required
              />
              <select
                value={newTask.priority}
                onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
              <select
                value={newTask.assignedUser}
                onChange={(e) => setNewTask({...newTask, assignedUser: e.target.value})}
              >
                {users.map(u => (
                  <option key={u._id} value={u._id}>{u.username}</option>
                ))}
              </select>
            </div>
            <textarea
              placeholder="Task description"
              value={newTask.description}
              onChange={(e) => setNewTask({...newTask, description: e.target.value})}
            />
            <button type="submit">Create Task</button>
          </form>
        </div>

        <div className="board-container">
          <div className="kanban-board">
            {columns.map(status => (
              <div 
                key={status}
                className="kanban-column"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, status)}
              >
                <h3 className="column-title">{status}</h3>
                <div className="tasks-container">
                  {getTasksByStatus(status).map(task => (
                    <div
                      key={task._id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task._id)}
                      className="draggable-task"
                    >
                      <TaskCard
                        task={task}
                        onEdit={handleEditTask}
                        onDelete={handleDeleteTask}
                        onSmartAssign={handleSmartAssign}
                        users={users}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {showActivityLog && (
            <div className="activity-log">
              <h3>Activity Log</h3>
              <div className="activities">
                {activities.map(activity => (
                  <div key={activity._id} className="activity-item">
                    <span className="activity-user">{activity.userId.username}</span>
                    <span className="activity-action">{activity.action}</span>
                    <span className="activity-details">{activity.details}</span>
                    <span className="activity-time">
                      {new Date(activity.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {conflictData && (
        <div className="conflict-modal">
          <div className="modal-content">
            <h3>Conflict Detected</h3>
            <p>{conflictData.conflict.message}</p>
            <div className="conflict-options">
              <div className="conflict-option">
                <h4>Current Version</h4>
                <pre>{JSON.stringify(conflictData.conflict.currentTask, null, 2)}</pre>
              </div>
              <div className="conflict-option">
                <h4>Your Version</h4>
                <pre>{JSON.stringify(conflictData.taskData, null, 2)}</pre>
              </div>
            </div>
            <div className="conflict-actions">
              <button onClick={() => handleConflictResolve('merge')}>
                Merge Changes
              </button>
              <button onClick={() => handleConflictResolve('overwrite')}>
                Overwrite
              </button>
              <button onClick={() => setConflictData(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Main App Component
const App = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <AuthProvider>
      <div className="App">
        <AuthContent isLogin={isLogin} setIsLogin={setIsLogin} />
      </div>
    </AuthProvider>
  );
};

// Auth Content Component
const AuthContent = ({ isLogin, setIsLogin }) => {
  const { user } = useAuth();

  if (user) {
    return <KanbanBoard />;
  }

  return isLogin ? (
    <Login onSwitchToRegister={() => setIsLogin(false)} />
  ) : (
    <Register onSwitchToLogin={() => setIsLogin(true)} />
  );
};

export default App;