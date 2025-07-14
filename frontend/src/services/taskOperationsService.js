// src/services/taskOperationsService.js
import apiService from './apiService';

class TaskOperationsService {
  async getAllTasks() {
    return await apiService.get('/tasks');
  }

  async createTask(taskData) {
    return await apiService.post('/tasks', taskData);
  }

  async updateTask(taskId, updateData) {
    return await apiService.put(`/tasks/${taskId}`, updateData);
  }

  async deleteTask(taskId) {
    return await apiService.delete(`/tasks/${taskId}`);
  }

  async smartAssignTask(taskId) {
    return await apiService.post(`/tasks/${taskId}/smart-assign`);
  }

  async getActions() {
    return await apiService.get('/tasks/actions');
  }

  async startEditing(taskId) {
    return await apiService.post(`/tasks/${taskId}/start-editing`);
  }

  async stopEditing(taskId) {
    return await apiService.post(`/tasks/${taskId}/stop-editing`);
  }

  async moveTask(taskId, newStatus, version) {
    return await apiService.put(`/tasks/${taskId}`, {
      status: newStatus,
      version
    });
  }

  async assignTask(taskId, userId, version) {
    return await apiService.put(`/tasks/${taskId}`, {
      assignedUser: userId,
      version
    });
  }

  async updateTaskPriority(taskId, priority, version) {
    return await apiService.put(`/tasks/${taskId}`, {
      priority,
      version
    });
  }

  async validateTaskTitle(title, excludeTaskId = null) {
    // Client-side validation
    if (!title || !title.trim()) {
      return { isValid: false, error: 'Title is required' };
    }

    const forbiddenTitles = ['Todo', 'In Progress', 'Done', 'todo', 'in progress', 'done'];
    if (forbiddenTitles.includes(title.trim())) {
      return { isValid: false, error: 'Task title cannot match column names' };
    }

    return { isValid: true };
  }
}

export default new TaskOperationsService();