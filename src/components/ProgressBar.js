import React from 'react';

function ProgressBar({ progress }) {
    const { sent, total, details, eta } = progress;

    return (
        <div className="progress-bar" style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: '#fff',
            borderTop: '1px solid #ccc',
            padding: '10px',
            boxShadow: '0 -2px 5px rgba(0, 0, 0, 0.1)',
            zIndex: 1000,
        }}>
            <h3>Progress</h3>
            <div style={{ width: '100%', backgroundColor: '#e0e0e0' }}>
                <div
                    style={{
                        width: `${(sent / total) * 100}%`,
                        backgroundColor: '#76c7c0',
                        height: '20px',
                    }}
                />
            </div>
            <p>{sent} of {total} messages sent</p>
            <p>ETA: {eta}</p>
            <ul>
                {details.map((detail, index) => (
                    <li key={index}>
                        {detail.contactId}: {detail.status}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default ProgressBar;
