const socketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join_room', (userId) => {
      socket.join('todo_board');
      socket.userId = userId;
    });

    socket.on('task_created', (taskData) => {
      socket.broadcast.to('todo_board').emit('task_created', taskData);
    });

    socket.on('task_updated', (taskData) => {
      socket.broadcast.to('todo_board').emit('task_updated', taskData);
    });

    socket.on('task_deleted', (taskId) => {
      socket.broadcast.to('todo_board').emit('task_deleted', taskId);
    });

    socket.on('task_assigned', (taskData) => {
      socket.broadcast.to('todo_board').emit('task_assigned', taskData);
    });

    socket.on('task_moved', (taskData) => {
      socket.broadcast.to('todo_board').emit('task_moved', taskData);
    });

    socket.on('task_editing', (data) => {
      socket.broadcast.to('todo_board').emit('task_editing', data);
    });

    socket.on('task_edit_stopped', (taskId) => {
      socket.broadcast.to('todo_board').emit('task_edit_stopped', taskId);
    });

    socket.on('action_logged', (actionData) => {
      socket.broadcast.to('todo_board').emit('action_logged', actionData);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
};

module.exports = socketHandlers;