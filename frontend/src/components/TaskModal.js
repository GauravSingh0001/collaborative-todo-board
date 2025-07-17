import React, { useState, useEffect } from 'react';
import './TaskModal.css';

const TaskModal = ({ isOpen, onClose, onSave, task = null, users = [], existingTasks = [] }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedUser: '',
    priority: 'Medium',
    status: 'Todo'
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Reset form when modal opens/closes or task changes
  useEffect(() => {
    if (isOpen) {
      if (task) {
        // Editing existing task
        setFormData({
          title: task.title || '',
          description: task.description || '',
          assignedUser: task.assignedUser?._id || task.assignedUser || '',
          priority: task.priority || 'Medium',
          status: task.status || 'Todo'
        });
      } else {
        // Creating new task
        setFormData({
          title: '',
          description: '',
          assignedUser: '',
          priority: 'Medium',
          status: 'Todo'
        });
      }
      setErrors({});
    }
  }, [task, isOpen]);

  const validateForm = () => {
    const newErrors = {};

    // Title validation
    if (!formData.title || formData.title.trim() === '') {
      newErrors.title = 'Task title is required';
    } else if (formData.title.trim().length < 3) {
      newErrors.title = 'Task title must be at least 3 characters long';
    } else if (formData.title.trim().length > 100) {
      newErrors.title = 'Task title must be less than 100 characters';
    } else {
      // Check for duplicate titles (exclude current task if editing)
      const duplicateTask = existingTasks.find(existingTask => 
        existingTask._id !== task?._id && 
        existingTask.title.toLowerCase().trim() === formData.title.toLowerCase().trim()
      );
      
      if (duplicateTask) {
        newErrors.title = 'Task title must be unique';
      }
    }

    // Description validation
    if (!formData.description || formData.description.trim() === '') {
      newErrors.description = 'Task description is required';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Description should be at least 10 characters long';
    } else if (formData.description.trim().length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    console.log(`TaskModal - Field changed: ${name} = "${value}"`);
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('=== TaskModal Form Submission ===');
    console.log('Form data:', formData);
    console.log('Is editing:', !!task);
    
    // Validate form
    if (!validateForm()) {
      console.log('Form validation failed:', errors);
      return;
    }

    setLoading(true);
    
    try {
      // Prepare clean data for submission
      const taskData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        assignedUser: formData.assignedUser || null,
        priority: formData.priority,
        status: formData.status,
        ...(task && { _id: task._id }) // Include ID if editing
      };

      console.log('Submitting task data:', taskData);
      
      await onSave(taskData);
      
      // Close modal on success
      onClose();
      
    } catch (error) {
      console.error('Error saving task:', error);
      setErrors({ submit: error.message || 'Failed to save task' });
    } finally {
      setLoading(false);
    }
  };

  // Don't render if modal is not open
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{task ? 'Edit Task' : 'Create New Task'}</h2>
          <button 
            className="close-button" 
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="task-form">
          {errors.submit && (
            <div className="error-message submit-error">
              {errors.submit}
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="title">
              Task Title <span className="required">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter task title"
              className={errors.title ? 'error' : ''}
              maxLength={100}
              required
            />
            {errors.title && (
              <div className="error-message">{errors.title}</div>
            )}
            <small className="field-info">
              {formData.title.length}/100 characters
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="description">
              Description <span className="required">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter task description"
              className={errors.description ? 'error' : ''}
              rows="4"
              maxLength={500}
              required
            />
            {errors.description && (
              <div className="error-message">{errors.description}</div>
            )}
            <small className="field-info">
              {formData.description.length}/500 characters
            </small>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="status">
                Status <span className="required">*</span>
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className={errors.status ? 'error' : ''}
                required
              >
                <option value="Todo">Todo</option>
                <option value="In Progress">In Progress</option>
                <option value="Done">Done</option>
              </select>
              {errors.status && (
                <div className="error-message">{errors.status}</div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="priority">
                Priority <span className="required">*</span>
              </label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className={errors.priority ? 'error' : ''}
                required
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
              {errors.priority && (
                <div className="error-message">{errors.priority}</div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="assignedUser">Assigned User</label>
            <select
              id="assignedUser"
              name="assignedUser"
              value={formData.assignedUser}
              onChange={handleChange}
            >
              <option value="">Select user (optional)</option>
              {users.map(user => (
                <option key={user._id} value={user._id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              onClick={onClose}
              className="cancel-button"
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="submit-button"
              disabled={loading}
            >
              {loading ? 'Saving...' : (task ? 'Update Task' : 'Create Task')}
            </button>
          </div>
        </form>
        
        {/* Debug info - remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <div className="debug-info">
            <details>
              <summary>Debug Info</summary>
              <pre>{JSON.stringify({ formData, errors, task }, null, 2)}</pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskModal;