// src/hooks/useRealTimeSync.js
import { useEffect, useCallback } from 'react';
import { useSocket } from '../contexts/SocketContext';

const useRealTimeSync = (taskId, onConflict, onUpdate) => {
  const { emit, on, off } = useSocket();

  const startEditing = useCallback(() => {
    if (taskId) {
      emit('task_edit_start', { taskId });
    }
  }, [taskId, emit]);

  const stopEditing = useCallback(() => {
    if (taskId) {
      emit('task_edit_stop', { taskId });
    }
  }, [taskId, emit]);

  const handleVersionConflict = useCallback((conflictData) => {
    if (conflictData.taskId === taskId && onConflict) {
      onConflict(conflictData);
    }
  }, [taskId, onConflict]);

  const handleTaskUpdate = useCallback((updateData) => {
    if (updateData.task._id === taskId && onUpdate) {
      onUpdate(updateData.task);
    }
  }, [taskId, onUpdate]);

  const handleEditConflict = useCallback((conflictData) => {
    if (conflictData.taskId === taskId && onConflict) {
      onConflict({
        type: 'edit_conflict',
        message: 'Another user is editing this task',
        editedBy: conflictData.editedBy
      });
    }
  }, [taskId, onConflict]);

  useEffect(() => {
    on('conflict_resolution_needed', handleVersionConflict);
    on('task_updated', handleTaskUpdate);
    on('edit_conflict', handleEditConflict);

    return () => {
      off('conflict_resolution_needed', handleVersionConflict);
      off('task_updated', handleTaskUpdate);
      off('edit_conflict', handleEditConflict);
    };
  }, [on, off, handleVersionConflict, handleTaskUpdate, handleEditConflict]);

  return {
    startEditing,
    stopEditing
  };
};

export default useRealTimeSync;