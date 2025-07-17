import React, { useState, useEffect } from 'react';

const TaskForm = ({ onSave, onCancel, task = null }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'Todo',
    priority: 'Medium',
    assignedUser: '',
    dueDate: ''
  });

  const [errors, setErrors] = useState({});

  // Initialize form data when component mounts or task changes
  useEffect(() => {
    if (task) {
      // Editing existing task
      setFormData({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'Todo',
        priority: task.priority || 'Medium',
        assignedUser: task.assignedUser || '',
        dueDate: task.dueDate || ''
      });
    } else {
      // Creating new task
      setFormData({
        title: '',
        description: '',
        status: 'Todo',
        priority: 'Medium',
        assignedUser: '',
        dueDate: ''
      });
    }
    // Clear errors when task changes
    setErrors({});
  }, [task]);

  const validateForm = () => {
    const newErrors = {};

    // Title validation
    if (!formData.title || formData.title.trim() === '') {
      newErrors.title = 'Title is required';
    } else if (formData.title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    }

    // Description validation
    if (!formData.description || formData.description.trim() === '') {
      newErrors.description = 'Description is required';
    }

    // Status validation
    const validStatuses = ['Todo', 'In Progress', 'Done'];
    if (!validStatuses.includes(formData.status)) {
      newErrors.status = 'Please select a valid status';
    }

    // Priority validation
    const validPriorities = ['Low', 'Medium', 'High'];
    if (!validPriorities.includes(formData.priority)) {
      newErrors.priority = 'Please select a valid priority';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    console.log('=== TaskForm Submit Debug ===');
    console.log('Form data:', formData);
    console.log('Title value:', `"${formData.title}"`);
    console.log('Title length:', formData.title.length);
    console.log('Status value:', `"${formData.status}"`);
    console.log('Priority value:', `"${formData.priority}"`);
    
    // Validate form
    if (!validateForm()) {
      console.log('Validation failed:', errors);
      return;
    }

    // Prepare clean data
    const cleanData = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      status: formData.status,
      priority: formData.priority,
      assignedUser: formData.assignedUser.trim(),
      dueDate: formData.dueDate
    };

    console.log('Calling onSave with:', cleanData);
    onSave(cleanData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    console.log(`Field changed: ${name} = "${value}"`);
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="task-form">
      <div className="form-group">
        <label htmlFor="title">
          Title <span style={{color: 'red'}}>*</span>
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Enter task title"
          style={{
            border: errors.title ? '1px solid red' : '1px solid #ccc',
            padding: '8px 12px',
            width: '100%',
            boxSizing: 'border-box'
          }}
        />
        {errors.title && (
          <div style={{color: 'red', fontSize: '14px', marginTop: '4px'}}>
            {errors.title}
          </div>
        )}
        <small style={{color: '#666', fontSize: '12px'}}>
          Current: "{formData.title}" (length: {formData.title.length})
        </small>
      </div>

      <div className="form-group">
        <label htmlFor="description">
          Description <span style={{color: 'red'}}>*</span>
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Enter task description"
          rows="3"
          style={{
            border: errors.description ? '1px solid red' : '1px solid #ccc',
            padding: '8px 12px',
            width: '100%',
            boxSizing: 'border-box'
          }}
        />
        {errors.description && (
          <div style={{color: 'red', fontSize: '14px', marginTop: '4px'}}>
            {errors.description}
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="status">
          Status <span style={{color: 'red'}}>*</span>
        </label>
        <select
          id="status"
          name="status"
          value={formData.status}
          onChange={handleChange}
          style={{
            border: errors.status ? '1px solid red' : '1px solid #ccc',
            padding: '8px 12px',
            width: '100%',
            boxSizing: 'border-box'
          }}
        >
          <option value="Todo">Todo</option>
          <option value="In Progress">In Progress</option>
          <option value="Done">Done</option>
        </select>
        {errors.status && (
          <div style={{color: 'red', fontSize: '14px', marginTop: '4px'}}>
            {errors.status}
          </div>
        )}
        <small style={{color: '#666', fontSize: '12px'}}>
          Current: "{formData.status}"
        </small>
      </div>

      <div className="form-group">
        <label htmlFor="priority">
          Priority <span style={{color: 'red'}}>*</span>
        </label>
        <select
          id="priority"
          name="priority"
          value={formData.priority}
          onChange={handleChange}
          style={{
            border: errors.priority ? '1px solid red' : '1px solid #ccc',
            padding: '8px 12px',
            width: '100%',
            boxSizing: 'border-box'
          }}
        >
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>
        {errors.priority && (
          <div style={{color: 'red', fontSize: '14px', marginTop: '4px'}}>
            {errors.priority}
          </div>
        )}
        <small style={{color: '#666', fontSize: '12px'}}>
          Current: "{formData.priority}"
        </small>
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
          style={{
            border: '1px solid #ccc',
            padding: '8px 12px',
            width: '100%',
            boxSizing: 'border-box'
          }}
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
          style={{
            border: '1px solid #ccc',
            padding: '8px 12px',
            width: '100%',
            boxSizing: 'border-box'
          }}
        />
      </div>

      <div className="form-actions" style={{marginTop: '20px'}}>
        <button 
          type="submit" 
          style={{
            backgroundColor: '#007bff',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          {task ? 'Update Task' : 'Create Task'}
        </button>
        <button 
          type="button" 
          onClick={onCancel}
          style={{
            backgroundColor: '#6c757d',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Cancel
        </button>
      </div>
      
      {/* Debug info */}
      <div style={{
        marginTop: '20px', 
        padding: '15px', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '4px',
        fontSize: '12px'
      }}>
        <strong>Debug Info:</strong>
        <pre style={{margin: '10px 0'}}>{JSON.stringify(formData, null, 2)}</pre>
        <strong>Errors:</strong>
        <pre style={{margin: '10px 0'}}>{JSON.stringify(errors, null, 2)}</pre>
      </div>
    </form>
  );
};

export default TaskForm;