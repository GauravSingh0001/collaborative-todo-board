// sockets/handleConnection.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Task = require('../models/Task');
const Action = require('../models/Action');

const connectedUsers = new Map();

const handleConnection = (socket, io) => {
  console.log(`User ${socket.user.name} connected`);

  // Add user to connected users
  connectedUsers.set(socket.userId, {
    socketId: socket.id,
    user: socket.user,
    isTyping: false,
    typingTaskId: null
  });

  // Update user online status
  User.findByIdAndUpdate(socket.userId, { isOnline: true }).exec();

  // Join user to their room
  socket.join(socket.userId);

  // Send current online users to all clients
  io.emit('user_status_update', {
    userId: socket.userId,
    isOnline: true,
    connectedUsers: Array.from(connectedUsers.values()).map(u => ({
      id: u.user.userId,
      name: u.user.name,
      email: u.user.email,
      isOnline: true
    }))
  });

  // Handle task updates
  socket.on('task_updated', async (data) => {
    try {
      const task = await Task.findById(data.taskId)
        .populate('assignedUser', 'name email')
        .populate('createdBy', 'name email')
        .populate('lastEditedBy', 'name email');

      if (task) {
        socket.broadcast.emit('task_updated', {
          task,
          updatedBy: socket.user
        });
      }
    } catch (error) {
      console.error('Task update broadcast error:', error);
    }
  });

  // Handle task creation
  socket.on('task_created', async (data) => {
    try {
      const task = await Task.findById(data.taskId)
        .populate('assignedUser', 'name email')
        .populate('createdBy', 'name email');

      if (task) {
        socket.broadcast.emit('task_created', {
          task,
          createdBy: socket.user
        });
      }
    } catch (error) {
      console.error('Task creation broadcast error:', error);
    }
  });

  // Handle task deletion
  socket.on('task_deleted', (data) => {
    socket.broadcast.emit('task_deleted', {
      taskId: data.taskId,
      deletedBy: socket.user
    });
  });

  // Handle smart assign
  socket.on('task_smart_assigned', async (data) => {
    try {
      const task = await Task.findById(data.taskId)
        .populate('assignedUser', 'name email')
        .populate('createdBy', 'name email')
        .populate('lastEditedBy', 'name email');

      if (task) {
        socket.broadcast.emit('task_smart_assigned', {
          task,
          assignedBy: socket.user
        });
      }
    } catch (error) {
      console.error('Smart assign broadcast error:', error);
    }
  });

  // Handle typing indicators
  socket.on('typing_start', (data) => {
    const userInfo = connectedUsers.get(socket.userId);
    if (userInfo) {
      userInfo.isTyping = true;
      userInfo.typingTaskId = data.taskId;
      
      socket.broadcast.emit('user_typing', {
        userId: socket.userId,
        userName: socket.user.name,
        taskId: data.taskId,
        isTyping: true
      });
    }
  });

  socket.on('typing_stop', (data) => {
    const userInfo = connectedUsers.get(socket.userId);
    if (userInfo) {
      userInfo.isTyping = false;
      userInfo.typingTaskId = null;
      
      socket.broadcast.emit('user_typing', {
        userId: socket.userId,
        userName: socket.user.name,
        taskId: data.taskId,
        isTyping: false
      });
    }
  });

  // Handle edit conflicts
  socket.on('task_edit_start', async (data) => {
    try {
      const task = await Task.findById(data.taskId);
      if (!task) return;

      if (task.isBeingEdited && String(task.editedBy) !== String(socket.userId)) {
        socket.emit('edit_conflict', {
          taskId: data.taskId,
          editedBy: task.editedBy,
          message: 'Another user is editing this task'
        });
        return;
      }

      task.isBeingEdited = true;
      task.editedBy = socket.userId;
      await task.save();

      socket.broadcast.emit('task_edit_started', {
        taskId: data.taskId,
        editedBy: socket.user
      });
    } catch (error) {
      console.error('Edit start error:', error);
    }
  });

  socket.on('task_edit_stop', async (data) => {
    try {
      const task = await Task.findById(data.taskId);
      if (!task) return;

      if (String(task.editedBy) === String(socket.userId)) {
        task.isBeingEdited = false;
        task.editedBy = null;
        await task.save();

        socket.broadcast.emit('task_edit_stopped', {
          taskId: data.taskId,
          editedBy: socket.user
        });
      }
    } catch (error) {
      console.error('Edit stop error:', error);
    }
  });

  // Handle activity log updates
  socket.on('action_created', async (data) => {
    try {
      const action = await Action.findById(data.actionId)
        .populate('user', 'name email')
        .populate('task', 'title');

      if (action) {
        socket.broadcast.emit('new_action', action);
      }
    } catch (error) {
      console.error('Action broadcast error:', error);
    }
  });

  // Handle version conflicts
  socket.on('version_conflict', async (data) => {
    try {
      const currentTask = await Task.findById(data.taskId)
        .populate('assignedUser', 'name email')
        .populate('createdBy', 'name email')
        .populate('lastEditedBy', 'name email');

      socket.emit('conflict_resolution_needed', {
        taskId: data.taskId,
        currentTask,
        yourChanges: data.yourChanges,
        conflictType: 'version_mismatch'
      });
    } catch (error) {
      console.error('Version conflict error:', error);
    }
  });

  // Handle conflict resolution
  socket.on('conflict_resolved', async (data) => {
    try {
      const task = await Task.findById(data.taskId);
      if (!task) return;

      if (data.resolution === 'overwrite') {
        Object.assign(task, data.changes);
        task.version += 1;
        task.lastEditedBy = socket.userId;
        task.lastEditedAt = new Date();
        await task.save();

        await task.populate('assignedUser', 'name email');
        await task.populate('createdBy', 'name email');
        await task.populate('lastEditedBy', 'name email');

        io.emit('task_updated', {
          task,
          updatedBy: socket.user,
          conflictResolved: true
        });
      }
    } catch (error) {
      console.error('Conflict resolution error:', error);
    }
  });

  // Handle ping for connection health
  socket.on('ping', () => {
    socket.emit('pong');
  });

  // Handle disconnection
  socket.on('disconnect', async () => {
    console.log(`User ${socket.user.name} disconnected`);

    // Remove user from connected users
    connectedUsers.delete(socket.userId);

    // Update user offline status
    try {
      await User.findByIdAndUpdate(socket.userId, { 
        isOnline: false,
        lastSeen: new Date()
      });

      // Stop any editing sessions
      await Task.updateMany(
        { editedBy: socket.userId },
        { 
          isBeingEdited: false,
          editedBy: null
        }
      );

      // Notify other users
      socket.broadcast.emit('user_status_update', {
        userId: socket.userId,
        isOnline: false,
        connectedUsers: Array.from(connectedUsers.values()).map(u => ({
          id: u.user.userId,
          name: u.user.name,
          email: u.user.email,
         isOnline: true
       }))
     });

     socket.broadcast.emit('user_stopped_editing', {
       userId: socket.userId,
       userName: socket.user.name
     });
   } catch (error) {
     console.error('Disconnect cleanup error:', error);
   }
 });
};

module.exports = handleConnection;