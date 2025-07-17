
const createTask = async (taskData) => {
  try {
    // Log the data being sent
    console.log('Sending task data:', taskData);
    // Add this to your frontend task creation function to debug the issue
//taskoperation
    // Validate data before sending
    if (!taskData.title || taskData.title.trim() === '') {
      throw new Error('Title is required');
    }
    
    // Ensure valid status
    const validStatuses = ['Todo', 'In Progress', 'Done'];
    if (taskData.status && !validStatuses.includes(taskData.status)) {
      throw new Error(`Invalid status: ${taskData.status}`);
    }
    
    // Ensure valid priority
    const validPriorities = ['Low', 'Medium', 'High'];
    if (taskData.priority && !validPriorities.includes(taskData.priority)) {
      throw new Error(`Invalid priority: ${taskData.priority}`);
    }
    
    const response = await fetch('/api/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}` // or however you handle auth
      },
      body: JSON.stringify(taskData)
    });
    
    if (!response.ok) {
      // Get the error details from the response
      const errorData = await response.json();
      console.error('Server error response:', errorData);
      
      // Show specific error message
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    const newTask = await response.json();
    console.log('Task created successfully:', newTask);
    return newTask;
    
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
};

// Example usage with proper data structure
const handleCreateTask = async (formData) => {
  try {
    const taskData = {
      title: formData.title?.trim() || '',
      description: formData.description?.trim() || '',
      status: formData.status || 'Todo',
      assignedUser: formData.assignedUser || null,
      priority: formData.priority || 'Medium',
      dueDate: formData.dueDate || null
    };
    
    await createTask(taskData);
    // Handle success (refresh list, close modal, etc.)
  } catch (error) {
    // Show user-friendly error message
    alert(`Failed to create task: ${error.message}`);
  }
};