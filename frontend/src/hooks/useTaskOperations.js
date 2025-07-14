import { useState, useCallback } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import { taskOperationsService } from '../services/taskOperationsService';
import { apiService } from '../services/apiService';
import { validateTaskData } from '../utils/taskValidationUtils';
import { detectConflict } from '../utils/conflictUtils';

export const useTaskOperations = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [conflictData, setConflictData] = useState(null);
  const { socket } = useSocket();
  const { user } = useAuth();

  const handleError = useCallback((error) => {
    console.error('Task operation error:', error);
    setError(error.message || 'An unexpected error occurred');
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearConflict = useCallback(() => {
    setConflictData(null);
  }, []);

  // Create new task
  const createTask = useCallback(async (taskData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Validate task data
      const validation = validateTaskData(taskData);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      // Check for duplicate titles
      const existingTasks = await apiService.getTasks();
      const titleExists = existingTasks.some(task => 
        task.title.toLowerCase() === taskData.title.toLowerCase()
      );
      
      if (titleExists) {
        throw new Error('Task title must be unique');
      }

      // Create task via API
      const newTask = await taskOperationsService.createTask({
        ...taskData,
        assignedUser: taskData.assignedUser || user.id,
        createdBy: user.id
      });

      // Emit real-time update
      socket?.emit('taskCreated', {
        task: newTask,
        userId: user.id,
        userName: user.name
      });

      return newTask;
    } catch (error) {
      handleError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [socket, user, handleError]);

  // Update existing task
  const updateTask = useCallback(async (taskId, updateData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get current task data for conflict detection
      const currentTask = await apiService.getTask(taskId);
      
      // Check for conflicts
      const conflict = detectConflict(currentTask, updateData, user.id);
      if (conflict.hasConflict) {
        setConflictData({
          taskId,
          currentVersion: currentTask,
          newVersion: updateData,
          conflictType: conflict.type,
          conflictFields: conflict.fields
        });
        return null; // Return null to indicate conflict needs resolution
      }

      // Validate update data
      const validation = validateTaskData(updateData);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      // Check for duplicate titles (exclude current task)
      if (updateData.title) {
        const existingTasks = await apiService.getTasks();
        const titleExists = existingTasks.some(task => 
          task._id !== taskId && 
          task.title.toLowerCase() === updateData.title.toLowerCase()
        );
        
        if (titleExists) {
          throw new Error('Task title must be unique');
        }
      }

      // Update task via API
      const updatedTask = await taskOperationsService.updateTask(taskId, {
        ...updateData,
        lastModifiedBy: user.id,
        lastModifiedAt: new Date()
      });

      // Emit real-time update
      socket?.emit('taskUpdated', {
        task: updatedTask,
        userId: user.id,
        userName: user.name,
        changes: updateData
      });

      return updatedTask;
    } catch (error) {
      handleError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [socket, user, handleError]);

  // Delete task
  const deleteTask = useCallback(async (taskId) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get task data before deletion for logging
      const taskToDelete = await apiService.getTask(taskId);
      
      // Delete task via API
      await taskOperationsService.deleteTask(taskId);

      // Emit real-time update
      socket?.emit('taskDeleted', {
        taskId,
        task: taskToDelete,
        userId: user.id,
        userName: user.name
      });

      return taskId;
    } catch (error) {
      handleError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [socket, user, handleError]);

  // Move task between columns
  const moveTask = useCallback(async (taskId, newStatus, newIndex) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Update task status
      const updatedTask = await taskOperationsService.updateTask(taskId, {
        status: newStatus,
        position: newIndex,
        lastModifiedBy: user.id,
        lastModifiedAt: new Date()
      });

      // Emit real-time update
      socket?.emit('taskMoved', {
        task: updatedTask,
        oldStatus: updatedTask.status,
        newStatus,
        userId: user.id,
        userName: user.name
      });

      return updatedTask;
    } catch (error) {
      handleError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [socket, user, handleError]);

  // Assign task to user
  const assignTask = useCallback(async (taskId, assignedUserId) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get user data for the assignment
      const assignedUser = await apiService.getUser(assignedUserId);
      
      const updatedTask = await taskOperationsService.updateTask(taskId, {
        assignedUser: assignedUserId,
        lastModifiedBy: user.id,
        lastModifiedAt: new Date()
      });

      // Emit real-time update
      socket?.emit('taskAssigned', {
        task: updatedTask,
        assignedUser: assignedUser,
        assignedBy: user,
        userId: user.id,
        userName: user.name
      });

      return updatedTask;
    } catch (error) {
      handleError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [socket, user, handleError]);

  // Resolve conflict
  const resolveConflict = useCallback(async (resolution) => {
    if (!conflictData) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      let finalData;
      
      switch (resolution.type) {
        case 'merge':
          finalData = {
            ...conflictData.currentVersion,
            ...resolution.mergedData,
            lastModifiedBy: user.id,
            lastModifiedAt: new Date()
          };
          break;
        case 'overwrite':
          finalData = {
            ...resolution.selectedVersion,
            lastModifiedBy: user.id,
            lastModifiedAt: new Date()
          };
          break;
        default:
          throw new Error('Invalid resolution type');
      }

      // Update task with resolved data
      const updatedTask = await taskOperationsService.updateTask(
        conflictData.taskId, 
        finalData
      );

      // Emit real-time update
      socket?.emit('conflictResolved', {
        task: updatedTask,
        resolutionType: resolution.type,
        userId: user.id,
        userName: user.name
      });

      clearConflict();
      return updatedTask;
    } catch (error) {
      handleError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [conflictData, socket, user, handleError, clearConflict]);

  return {
    // Operations
    createTask,
    updateTask,
    deleteTask,
    moveTask,
    assignTask,
    resolveConflict,
    
    // State
    isLoading,
    error,
    conflictData,
    
    // Helpers
    clearError,
    clearConflict
  };
};