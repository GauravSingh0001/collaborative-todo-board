import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ size = 'medium', message = 'Loading...', fullScreen = false }) => {
  const SpinnerComponent = () => (
    <div className={`loading-spinner-container ${fullScreen ? 'full-screen' : ''}`}>
      <div className={`loading-spinner ${size}`}>
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
      </div>
      {message && <p className="loading-message">{message}</p>}
    </div>
  );

  return <SpinnerComponent />;
};

export default LoadingSpinner;