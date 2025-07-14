// src/utils/dragDropUtils.js
export const reorderTasks = (tasks, startIndex, endIndex) => {
  const result = Array.from(tasks);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
};

export const moveTaskBetweenColumns = (
  sourceTasks,
  destinationTasks,
  sourceIndex,
  destinationIndex
) => {
  const sourceClone = Array.from(sourceTasks);
  const destClone = Array.from(destinationTasks);
  const [removed] = sourceClone.splice(sourceIndex, 1);
  
  destClone.splice(destinationIndex, 0, removed);
  
  return {
    source: sourceClone,
    destination: destClone,
    movedTask: removed
  };
};

export const createDragEndHandler = (tasks, onTaskMove) => {
  return (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const task = tasks.find(t => t._id === draggableId);
    if (!task) return;

    const newStatus = destination.droppableId;
    
    if (task.status !== newStatus) {
      onTaskMove(task._id, newStatus);
    }
  };}