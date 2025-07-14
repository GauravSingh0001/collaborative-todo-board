// src/utils/taskValidationUtils.js - Enhanced version
export const taskValidationUtils = {
  // Validate task data comprehensively
  validateTask: (taskData, existingTasks = [], columnNames = ['Todo', 'In Progress', 'Done']) => {
    const errors = [];
    const warnings = [];

    // Title validation
    if (!taskData.title || taskData.title.trim() === '') {
      errors.push('Task title is required');
    } else {
      const trimmedTitle = taskData.title.trim();
      
      // Check title length
      if (trimmedTitle.length < 3) {
        errors.push('Task title must be at least 3 characters long');
      } else if (trimmedTitle.length > 100) {
        errors.push('Task title must be less than 100 characters');
      }
      
      // Check for duplicate titles
      const duplicateTask = existingTasks.find(task => 
        task._id !== taskData._id && 
        task.title.toLowerCase().trim() === trimmedTitle.toLowerCase()
      );
      
      if (duplicateTask) {
        errors.push('Task title must be unique');
      }
      
      // Check if title matches column names
      if (columnNames.some(column => 
        column.toLowerCase() === trimmedTitle.toLowerCase()
      )) {
        errors.push('Task title cannot match column names');
      }
      
      // Check for reserved words
      const reservedWords = ['admin', 'system', 'root', 'null', 'undefined'];
      if (reservedWords.some(word => 
        trimmedTitle.toLowerCase() === word
      )) {
        warnings.push('Task title uses a reserved word');
      }
    }

    // Description validation
    if (!taskData.description || taskData.description.trim() === '') {
      errors.push('Task description is required');
    } else {
      const trimmedDescription = taskData.description.trim();
      
      if (trimmedDescription.length < 10) {
        warnings.push('Task description should be more descriptive (at least 10 characters)');
      } else if (trimmedDescription.length > 500) {
        errors.push('Task description must be less than 500 characters');
      }
    }

    // Status validation
    const validStatuses = ['Todo', 'In Progress', 'Done'];
    if (!taskData.status || !validStatuses.includes(taskData.status)) {
      errors.push('Task status must be one of: Todo, In Progress, Done');
    }

    // Priority validation
    const validPriorities = ['Low', 'Medium', 'High'];
    if (!taskData.priority || !validPriorities.includes(taskData.priority)) {
      errors.push('Task priority must be one of: Low, Medium, High');
    }

    // Assigned user validation
    if (!taskData.assignedTo || taskData.assignedTo.trim() === '') {
      errors.push('Task must be assigned to a user');
    }

    // Date validation
    if (taskData.dueDate) {
      const dueDate = new Date(taskData.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (isNaN(dueDate.getTime())) {
        errors.push('Due date must be a valid date');
      } else if (dueDate < today) {
        warnings.push('Due date is in the past');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  },

  // Validate task title in real-time
  validateTitleRealTime: (title, existingTasks = [], columnNames = []) => {
    const validation = {
      isValid: true,
      message: '',
      severity: 'info'
    };

    if (!title || title.trim() === '') {
      validation.isValid = false;
      validation.message = 'Title is required';
      validation.severity = 'error';
      return validation;
    }

    const trimmedTitle = title.trim();

    // Length check
    if (trimmedTitle.length < 3) {
      validation.isValid = false;
      validation.message = 'Title must be at least 3 characters';
      validation.severity = 'error';
      return validation;
    }

    // Duplicate check
    const isDuplicate = existingTasks.some(task => 
      task.title.toLowerCase().trim() === trimmedTitle.toLowerCase()
    );
    
    if (isDuplicate) {
      validation.isValid = false;
      validation.message = 'Title already exists';
      validation.severity = 'error';
      return validation;
    }

    // Column name check
    const matchesColumn = columnNames.some(column => 
      column.toLowerCase() === trimmedTitle.toLowerCase()
    );
    
    if (matchesColumn) {
      validation.isValid = false;
      validation.message = 'Title cannot match column names';
      validation.severity = 'error';
      return validation;
    }

    // Length warning
    if (trimmedTitle.length > 50) {
      validation.message = 'Consider shortening the title';
      validation.severity = 'warning';
    }

    return validation;
  },

  // Validate task status transitions
  validateStatusTransition: (currentStatus, newStatus, userRole = 'user') => {
    const transitions = {
      'Todo': ['In Progress', 'Done'],
      'In Progress': ['Todo', 'Done'],
      'Done': ['Todo', 'In Progress']
    };

    const validation = {
      isValid: true,
      message: '',
      requiresConfirmation: false
    };

    if (!transitions[currentStatus]?.includes(newStatus)) {
      validation.isValid = false;
      validation.message = `Cannot move from ${currentStatus} to ${newStatus}`;
      return validation;
    }

    // Special validations for specific transitions
    if (currentStatus === 'Done' && newStatus !== 'Done') {
      validation.requiresConfirmation = true;
      validation.message = 'Are you sure you want to reopen this completed task?';
    }

    if (currentStatus === 'Todo' && newStatus === 'Done') {
      validation.requiresConfirmation = true;
      validation.message = 'Skipping "In Progress" - mark as completed directly?';
    }

    return validation;
  },

  // Validate task assignment
  validateAssignment: (taskData, assignedUserId, allUsers = []) => {
    const validation = {
      isValid: true,
      message: '',
      warnings: []
    };

    const assignedUser = allUsers.find(user => user._id === assignedUserId);
    
    if (!assignedUser) {
      validation.isValid = false;
      validation.message = 'Assigned user not found';
      return validation;
    }

    // Check user's current workload
    const userTasks = allUsers.filter(task => 
      task.assignedTo === assignedUserId && task.status !== 'Done'
    );
    
    if (userTasks.length >= 5) {
      validation.warnings.push('User has high workload (5+ active tasks)');
    }

    // Check if user has tasks of same priority
    const samePriorityTasks = userTasks.filter(task => 
      task.priority === taskData.priority
    );
    
    if (samePriorityTasks.length >= 3) {
      validation.warnings.push(`User has many ${taskData.priority} priority tasks`);
    }

    return validation;
  },

  // Validate bulk operations
  validateBulkOperation: (operation, taskIds, allTasks) => {
    const validation = {
      isValid: true,
      errors: [],
      warnings: [],
      affectedTasks: []
    };

    // Find affected tasks
    const affectedTasks = allTasks.filter(task => taskIds.includes(task._id));
    validation.affectedTasks = affectedTasks;

    if (affectedTasks.length === 0) {
      validation.isValid = false;
      validation.errors.push('No valid tasks selected');
      return validation;
    }

    // Operation-specific validations
    switch (operation) {
      case 'delete':
        const completedTasks = affectedTasks.filter(task => task.status === 'Done');
        if (completedTasks.length > 0) {
          validation.warnings.push(`${completedTasks.length} completed tasks will be deleted`);
        }
        break;

      case 'assignUser':
        const highPriorityTasks = affectedTasks.filter(task => task.priority === 'High');
        if (highPriorityTasks.length > 3) {
          validation.warnings.push('Assigning many high-priority tasks to one user');
        }
        break;

      case 'changeStatus':
        const invalidTransitions = affectedTasks.filter(task => {
          const statusValidation = taskValidationUtils.validateStatusTransition(
            task.status, 
            operation.newStatus
          );
          return !statusValidation.isValid;
        });
        
        if (invalidTransitions.length > 0) {
          validation.warnings.push(`${invalidTransitions.length} tasks have invalid status transitions`);
        }
        break;
    }

    return validation;
  },

  // Sanitize task input
  sanitizeTaskInput: (taskData) => {
    const sanitized = { ...taskData };

    // Sanitize title
    if (sanitized.title) {
      sanitized.title = sanitized.title.trim()
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .replace(/[<>]/g, ''); // Remove potential HTML tags
    }

    // Sanitize description
    if (sanitized.description) {
      sanitized.description = sanitized.description.trim()
        .replace(/\s+/g, ' ')
        .replace(/[<>]/g, '');
    }

    // Ensure valid status
    const validStatuses = ['Todo', 'In Progress', 'Done'];
    if (!validStatuses.includes(sanitized.status)) {
      sanitized.status = 'Todo';
    }

    // Ensure valid priority
    const validPriorities = ['Low', 'Medium', 'High'];
    if (!validPriorities.includes(sanitized.priority)) {
      sanitized.priority = 'Medium';
    }

    return sanitized;
  },

  // Get validation suggestions
  getValidationSuggestions: (taskData, validationResult) => {
    const suggestions = [];

    if (validationResult.errors.includes('Task title is required')) {
      suggestions.push('Add a descriptive title for your task');
    }

    if (validationResult.errors.includes('Task title must be unique')) {
      suggestions.push('Try adding more specific details to make the title unique');
    }

    if (validationResult.warnings.includes('Task description should be more descriptive')) {
      suggestions.push('Add more details about what needs to be done');
    }

    if (validationResult.warnings.includes('Due date is in the past')) {
      suggestions.push('Consider updating the due date or removing it');
    }

    return suggestions;
  },

  // Create validation summary
  createValidationSummary: (validationResult) => {
    const summary = {
      status: validationResult.isValid ? 'valid' : 'invalid',
      errorCount: validationResult.errors.length,
      warningCount: validationResult.warnings.length,
      message: ''
    };

    if (summary.errorCount > 0) {
      summary.message = `${summary.errorCount} error${summary.errorCount > 1 ? 's' : ''} found`;
    } else if (summary.warningCount > 0) {
      summary.message = `${summary.warningCount} warning${summary.warningCount > 1 ? 's' : ''} found`;
    } else {
      summary.message = 'Task is valid';
    }

    return summary;
  }
};

