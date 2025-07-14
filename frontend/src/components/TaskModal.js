import React, { useState, useEffect } from 'react';
import './TaskModal.css';

const TaskModal = ({ isOpen, onClose, onSave, task = null, users = [], existingTasks = [] }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedUser: '',
    priority: 'medium',
    status: 'todo'
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        assignedUser: task.assignedUser?._id || task.assignedUser || '',
        priority: task.priority?.toLowerCase() || 'medium',
        status: task.status?.toLowerCase().replace(' ', '-') || 'todo'
      });
    } else {
      setFormData({
        title: '',
        description: '',
        assignedUser: '',
        priority: 'medium',
        status: 'todo'
      });
    }
    setErrors({});
  }, [task, isOpen]);

  // Add this debugging version to your TaskForm component

const TaskForm = ({ onSave, onCancel, task }) => {
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'Todo',
    priority: task?.priority || 'Medium',
    assignedUser: task?.assignedUser || '',
    dueDate: task?.dueDate || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    console.log('=== DEBUG: TaskForm handleSubmit ===');
    console.log('Form data before processing:', formData);
    
    // Log each field
    Object.keys(formData).forEach(key => {
      console.log(`${key}:`, formData[key]);
      console.log(`${key} type:`, typeof formData[key]);
      console.log(`${key} length:`, formData[key]?.length);
    });
    
    // Check for common issues
    console.log('Title is empty:', !formData.title || formData.title.trim() === '');
    console.log('Status value:', formData.status);
    console.log('Priority value:', formData.priority);
    
    // Validate required fields
    if (!formData.title || formData.title.trim() === '') {
      console.error('Validation failed: Title is required');
      alert('Title is required!');
      return;
    }
    
    // Validate status
    const validStatuses = ['Todo', 'In Progress', 'Done'];
    if (!validStatuses.includes(formData.status)) {
      console.error('Validation failed: Invalid status:', formData.status);
      alert(`Invalid status: ${formData.status}. Must be one of: ${validStatuses.join(', ')}`);
      return;
    }
    
    // Validate priority
    const validPriorities = ['Low', 'Medium', 'High'];
    if (!validPriorities.includes(formData.priority)) {
      console.error('Validation failed: Invalid priority:', formData.priority);
      alert(`Invalid priority: ${formData.priority}. Must be one of: ${validPriorities.join(', ')}`);
      return;
    }
    
    console.log('All validations passed, calling onSave with:', formData);
    onSave(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(`Field changed: ${name} = "${value}"`);
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="task-form">
      <div className="form-group">
        <label htmlFor="title">Title *</label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          placeholder="Enter task title"
        />
        <small>Current value: "{formData.title}" (length: {formData.title.length})</small>
      </div>

      <div className="form-group">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Enter task description"
          rows="3"
        />
      </div>

      <div className="form-group">
        <label htmlFor="status">Status</label>
        <select
          id="status"
          name="status"
          value={formData.status}
          onChange={handleChange}
        >
          <option value="Todo">Todo</option>
          <option value="In Progress">In Progress</option>
          <option value="Done">Done</option>
        </select>
        <small>Current value: "{formData.status}"</small>
      </div>

      <div className="form-group">
        <label htmlFor="priority">Priority</label>
        <select
          id="priority"
          name="priority"
          value={formData.priority}
          onChange={handleChange}
        >
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>
        <small>Current value: "{formData.priority}"</small>
      </div>

      <div className="form-group">
        <label htmlFor="assignedUser">Assigned User</label>
        <input
          type="text"
          id="assignedUser"
          name="assignedUser"
          value={formData.assignedUser}
          onChange={handleChange}
          placeholder="Enter user ID or leave empty"
        />
      </div>

      <div className="form-group">
        <label htmlFor="dueDate">Due Date</label>
        <input
          type="datetime-local"
          id="dueDate"
          name="dueDate"
          value={formData.dueDate}
          onChange={handleChange}
        />
      </div>

      <div className="form-actions">
        <button type="submit">Save Task</button>
        <button type="button" onClick={onCancel}>Cancel</button>
      </div>
      
      {/* Debug info */}
      <div style={{marginTop: '20px', padding: '10px', background: '#f0f0f0', fontSize: '12px'}}>
        <strong>Debug Info:</strong>
        <pre>{JSON.stringify(formData, null, 2)}</pre>
      </div>
    </form>
  );
};

}

export default TaskModal;