// LoadingSpinner.js
import React from 'react';
import './LoadingSpinner.css'; // Import CSS for spinner

const LoadingSpinner = () => {
    return (
        <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Waiting for QR Code...</p>
        </div>
    );
};

export default LoadingSpinner;
