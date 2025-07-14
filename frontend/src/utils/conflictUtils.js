// src/utils/conflictUtils.js
export const createConflictData = (originalTask, modifiedTask) => {
  const conflicts = {};
  
  const fields = ['title', 'description', 'priority', 'status', 'assignedUser'];
  
  fields.forEach(field => {
    if (originalTask[field] !== modifiedTask[field]) {
      conflicts[field] = {
        original: originalTask[field],
        modified: modifiedTask[field]
      };
    }
  });

  return conflicts;
};

export const mergeConflictResolution = (originalTask, yourChanges, theirChanges, resolutions) => {
  const mergedTask = { ...originalTask };
  
  Object.keys(resolutions).forEach(field => {
    const resolution = resolutions[field];
    
    switch (resolution) {
      case 'yours':
        mergedTask[field] = yourChanges[field];
        break;
      case 'theirs':
        mergedTask[field] = theirChanges[field];
        break;
      case 'original':
        mergedTask[field] = originalTask[field];
        break;
      default:
        mergedTask[field] = originalTask[field];
    }
  });

  return mergedTask;
};

export const formatConflictMessage = (conflictType, editedBy) => {
  switch (conflictType) {
    case 'version_mismatch':
      return 'This task has been modified by another user. Please review the changes.';
    case 'being_edited':
      return `This task is currently being edited by ${editedBy?.name || 'another user'}.`;
    case 'edit_conflict':
      return 'Another user started editing this task while you were working on it.';
    default:
      return 'A conflict has occurred. Please refresh and try again.';
  }
};