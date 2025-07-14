import React, { useState } from 'react';
import './ConflictModal.css';

const ConflictModal = ({ isOpen, onClose, conflict, onResolve }) => {
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [mergedTask, setMergedTask] = useState(null);

  if (!isOpen || !conflict) return null;

  const handleMerge = () => {
    const merged = {
      title: mergedTask?.title || conflict.currentVersion.title,
      description: mergedTask?.description || conflict.currentVersion.description,
      priority: mergedTask?.priority || conflict.currentVersion.priority,
      assignedTo: mergedTask?.assignedTo || conflict.currentVersion.assignedTo,
      status: mergedTask?.status || conflict.currentVersion.status
    };
    
    onResolve('merge', merged);
    resetState();
  };

  const handleOverwrite = () => {
    if (!selectedVersion) return;
    onResolve('overwrite', selectedVersion);
    resetState();
  };

  const resetState = () => {
    setSelectedVersion(null);
    setMergedTask(null);
    onClose();
  };

  const initializeMerge = () => {
    setMergedTask({
      title: conflict.currentVersion.title,
      description: conflict.currentVersion.description,
      priority: conflict.currentVersion.priority,
      assignedTo: conflict.currentVersion.assignedTo,
      status: conflict.currentVersion.status
    });
  };

  const updateMergedField = (field, value) => {
    setMergedTask(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="conflict-modal-overlay">
      <div className="conflict-modal">
        <div className="conflict-modal-header">
          <h2>⚠️ Conflict Detected</h2>
          <button className="close-btn" onClick={resetState}>×</button>
        </div>

        <div className="conflict-message">
          <p>
            The task "<strong>{conflict.currentVersion.title}</strong>" has been 
            modified by another user while you were editing it. Please resolve the conflict:
          </p>
        </div>

        <div className="conflict-versions">
          <div className="version-section">
            <h3>🔄 Your Version</h3>
            <div className="version-card your-version">
              <div className="version-header">
                <span className="version-label">Your Changes</span>
                <span className="version-time">
                  Modified: {formatDate(conflict.yourVersion.updatedAt)}
                </span>
              </div>
              <div className="version-content">
                <div className="field">
                  <label>Title:</label>
                  <span>{conflict.yourVersion.title}</span>
                </div>
                <div className="field">
                  <label>Description:</label>
                  <span>{conflict.yourVersion.description}</span>
                </div>
                <div className="field">
                  <label>Priority:</label>
                  <span className={`priority-badge ${conflict.yourVersion.priority}`}>
                    {conflict.yourVersion.priority}
                  </span>
                </div>
                <div className="field">
                  <label>Status:</label>
                  <span className={`status-badge ${conflict.yourVersion.status.toLowerCase().replace(' ', '-')}`}>
                    {conflict.yourVersion.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="version-section">
            <h3>🌐 Current Version</h3>
            <div className="version-card current-version">
              <div className="version-header">
                <span className="version-label">
                  By {conflict.currentVersion.lastModifiedBy?.username || 'Unknown'}
                </span>
                <span className="version-time">
                  Modified: {formatDate(conflict.currentVersion.updatedAt)}
                </span>
              </div>
              <div className="version-content">
                <div className="field">
                  <label>Title:</label>
                  <span>{conflict.currentVersion.title}</span>
                </div>
                <div className="field">
                  <label>Description:</label>
                  <span>{conflict.currentVersion.description}</span>
                </div>
                <div className="field">
                  <label>Priority:</label>
                  <span className={`priority-badge ${conflict.currentVersion.priority}`}>
                    {conflict.currentVersion.priority}
                  </span>
                </div>
                <div className="field">
                  <label>Status:</label>
                  <span className={`status-badge ${conflict.currentVersion.status.toLowerCase().replace(' ', '-')}`}>
                    {conflict.currentVersion.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="conflict-actions">
          <div className="action-section">
            <h3>🔧 Resolution Options</h3>
            
            <div className="action-buttons">
              <button 
                className="action-btn merge-btn"
                onClick={initializeMerge}
              >
                🔀 Merge Changes
              </button>
              
              <button 
                className={`action-btn overwrite-btn ${selectedVersion === 'yours' ? 'selected' : ''}`}
                onClick={() => setSelectedVersion(conflict.yourVersion)}
              >
                📝 Use Your Version
              </button>
              
              <button 
                className={`action-btn overwrite-btn ${selectedVersion === 'current' ? 'selected' : ''}`}
                onClick={() => setSelectedVersion(conflict.currentVersion)}
              >
                🌐 Use Current Version
              </button>
            </div>
          </div>

          {mergedTask && (
            <div className="merge-editor">
              <h4>🎯 Merge Editor</h4>
              <div className="merge-form">
                <div className="merge-field">
                  <label>Title:</label>
                  <input
                    type="text"
                    value={mergedTask.title}
                    onChange={(e) => updateMergedField('title', e.target.value)}
                  />
                </div>
                <div className="merge-field">
                  <label>Description:</label>
                  <textarea
                    value={mergedTask.description}
                    onChange={(e) => updateMergedField('description', e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="merge-field">
                  <label>Priority:</label>
                  <select
                    value={mergedTask.priority}
                    onChange={(e) => updateMergedField('priority', e.target.value)}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div className="merge-field">
                  <label>Status:</label>
                  <select
                    value={mergedTask.status}
                    onChange={(e) => updateMergedField('status', e.target.value)}
                  >
                    <option value="Todo">Todo</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="conflict-footer">
          {mergedTask ? (
            <div className="footer-actions">
              <button className="cancel-btn" onClick={resetState}>
                Cancel
              </button>
              <button className="confirm-btn" onClick={handleMerge}>
                ✅ Apply Merged Changes
              </button>
            </div>
          ) : selectedVersion ? (
            <div className="footer-actions">
              <button className="cancel-btn" onClick={resetState}>
                Cancel
              </button>
              <button className="confirm-btn" onClick={handleOverwrite}>
                ✅ Apply Selected Version
              </button>
            </div>
          ) : (
            <div className="footer-message">
              <p>Choose a resolution option above to continue</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConflictModal;