import React, { useState, useEffect } from 'react';
import LoadingSpinner from './LoadingSpinner1'; // Import your loading spinner
import io from 'socket.io-client'; // Import Socket.IO

const socket = io(`https://bulkwhatsapp.onrender.com`);

function QRCodeScanner({ onLogin }) {
    const [qrCodeImage, setQrCodeImage] = useState(null);
    const [status, setStatus] = useState('Loading QR Code...');
    const [loading, setLoading] = useState(true);

    // Function to load the QR code from the backend API using window.api.fetchQrCode
    const loadQrCode = async () => {
        setLoading(true);
        setStatus('Loading QR Code...');
        try {
            // Call the window.api.fetchQrCode() to fetch the QR code image path
            const response = await window.api.fetchQrCode();

            if (response && response.imagePath) {
                // Set the image path for display
                setQrCodeImage(response.imagePath);
                setStatus('QR Code Loaded');
            } else {
                setStatus('Failed to load QR Code');
            }
        } catch (error) {
            console.error('Error fetching QR code:', error);
            setStatus('Failed to load QR Code');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Load the QR code immediately on component mount
        loadQrCode();

        // Refresh the QR code image every 10 seconds
        const interval = setInterval(loadQrCode, 10000);

        // Handle login success event from socket
        socket.on('login-success', () => {
            onLogin(); // Trigger login success callback
        });

        // Cleanup on unmount
        return () => {
            clearInterval(interval); // Clear interval to prevent memory leaks
            socket.off('login-success');
        };
    }, [onLogin]);

    return (
        <div className="qr-code-scanner">
            <h1>QR Code Scanner</h1>
            <p>{status}</p>
            {loading ? (
                <LoadingSpinner />
            ) : (
                qrCodeImage ? (
                    <img src={qrCodeImage} alt="QR Code" width="250" height="250" />
                ) : (
                    <p>No QR Code available. Please check again.</p>
                )
            )}
        </div>
    );
}

export default QRCodeScanner;
