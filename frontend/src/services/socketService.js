// src/services/socketService.js
import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  connect(token) {
    if (this.socket) {
      this.disconnect();
    }

    this.socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
      auth: {
        token: token
      },
      transports: ['websocket']
    });

    this.socket.on('connect', () => {
      this.isConnected = true;
      console.log('Connected to socket server');
    });

    this.socket.on('disconnect', () => {
      this.isConnected = false;
      console.log('Disconnected from socket server');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Task-related socket events
  onTaskCreated(callback) {
    this.socket?.on('task:created', callback);
  }

  onTaskUpdated(callback) {
    this.socket?.on('task:updated', callback);
  }

  onTaskDeleted(callback) {
    this.socket?.on('task:deleted', callback);
  }

  onTaskMoved(callback) {
    this.socket?.on('task:moved', callback);
  }

  onTaskAssigned(callback) {
    this.socket?.on('task:assigned', callback);
  }

  // Conflict-related socket events
  onConflictDetected(callback) {
    this.socket?.on('conflict:detected', callback);
  }

  onConflictResolved(callback) {
    this.socket?.on('conflict:resolved', callback);
  }

  // Action log events
  onActionLogged(callback) {
    this.socket?.on('action:logged', callback);
  }

  // Emit events
  joinBoard(boardId) {
    this.socket?.emit('join:board', boardId);
  }

  leaveBoard(boardId) {
    this.socket?.emit('leave:board', boardId);
  }

  editingTask(taskId, isEditing = true) {
    this.socket?.emit('task:editing', { taskId, isEditing });
  }

  stopEditingTask(taskId) {
    this.socket?.emit('task:editing', { taskId, isEditing: false });
  }

  // Cleanup method
  removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }

  // Get connection status
  getConnectionStatus() {
    return this.isConnected;
  }
}

export default new SocketService();