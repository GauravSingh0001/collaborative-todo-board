// src/hooks/useTaskManager.js
import { useState, useEffect, useCallback } from 'react';
import taskOperationsService from '../services/taskOperationsService';
import { useSocket } from '../contexts/SocketContext';

const useTaskManager = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { emit, on, off } = useSocket();

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const tasksData = await taskOperationsService.getAllTasks();
      setTasks(tasksData);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createTask = useCallback(async (taskData) => {
    try {
      const newTask = await taskOperationsService.createTask(taskData);
      setTasks(prev => [...prev, newTask]);
      emit('task_created', { taskId: newTask._id });
      return newTask;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  }, [emit]);

  const updateTask = useCallback(async (taskId, updateData) => {
    try {
      const updatedTask = await taskOperationsService.updateTask(taskId, updateData);
      setTasks(prev => prev.map(task => 
        task._id === taskId ? updatedTask : task
      ));
      emit('task_updated', { taskId });
      return updatedTask;
    } catch (error) {
      if (error.message.includes('Conflict detected')) {
        throw error;
      }
      setError(error.message);
      throw error;
    }
  }, [emit]);

  const deleteTask = useCallback(async (taskId) => {
    try {
      await taskOperationsService.deleteTask(taskId);
      setTasks(prev => prev.filter(task => task._id !== taskId));
      emit('task_deleted', { taskId });
    } catch (error) {
      setError(error.message);
      throw error;
    }
  }, [emit]);

  const smartAssignTask = useCallback(async (taskId) => {
    try {
      const updatedTask = await taskOperationsService.smartAssignTask(taskId);
      setTasks(prev => prev.map(task => 
        task._id === taskId ? updatedTask : task
      ));
      emit('task_smart_assigned', { taskId });
      return updatedTask;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  }, [emit]);

  const moveTask = useCallback(async (taskId, newStatus) => {
    try {
      const task = tasks.find(t => t._id === taskId);
      if (!task) throw new Error('Task not found');

      const updatedTask = await taskOperationsService.moveTask(taskId, newStatus, task.version);
      setTasks(prev => prev.map(t => 
        t._id === taskId ? updatedTask : t
      ));
      emit('task_updated', { taskId });
      return updatedTask;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  }, [tasks, emit]);

  const getTasksByStatus = useCallback((status) => {
    return tasks.filter(task => task.status === status);
  }, [tasks]);

  const getTaskById = useCallback((taskId) => {
    return tasks.find(task => task._id === taskId);
  }, [tasks]);

  // Socket event handlers
  useEffect(() => {
    const handleTaskUpdated = ({ task }) => {
      setTasks(prev => prev.map(t => 
        t._id === task._id ? task : t
      ));
    };

    const handleTaskCreated = ({ task }) => {
      setTasks(prev => [...prev, task]);
    };

    const handleTaskDeleted = ({ taskId }) => {
      setTasks(prev => prev.filter(t => t._id !== taskId));
    };

    const handleTaskSmartAssigned = ({ task }) => {
      setTasks(prev => prev.map(t => 
        t._id === task._id ? task : t
      ));
    };

    on('task_updated', handleTaskUpdated);
    on('task_created', handleTaskCreated);
    on('task_deleted', handleTaskDeleted);
    on('task_smart_assigned', handleTaskSmartAssigned);

    return () => {
      off('task_updated', handleTaskUpdated);
      off('task_created', handleTaskCreated);
      off('task_deleted', handleTaskDeleted);
      off('task_smart_assigned', handleTaskSmartAssigned);
    };
  }, [on, off]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  return {
    tasks,
    loading,
    error,
    loadTasks,
    createTask,
    updateTask,
    deleteTask,
    smartAssignTask,
    moveTask,
    getTasksByStatus,
    getTaskById,
    setError
  };
};

export default useTaskManager;