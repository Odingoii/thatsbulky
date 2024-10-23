import React, { useState, useEffect } from 'react';
import LoadingSpinner from './LoadingSpinner1'; // Import your loading spinner
import io from 'socket.io-client'; // Import Socket.IO
const socket = io(`http://bulkwhatsappserver:10000`);
const BASE_URL = 'http://bulkwhatsappserver:10000';


function QRCodeScanner({ onLogin }) {
    const [qrCodeImage, setQrCodeImage] = useState(null);
    const [status, setStatus] = useState('Loading QR Code...');
    const [loading, setLoading] = useState(true);

    // Function to load the QR code from the storage folder
    const loadQrCode = async () => {
        setLoading(true);
        setStatus('Loading QR Code...');
        try {
            // Use a timestamp to bypass cache and ensure the latest image is fetched
            const timestamp = new Date().getTime();
            const imagePath = `${BASE_URL}/qrcode.png?q=${timestamp}`; // QR code from storage

            // Set the image path for display
            setQrCodeImage(imagePath);
            setStatus('QR Code Loaded');
        } catch (error) {
            console.error('Error loading QR code:', error);
            setStatus('Failed to load QR Code');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Load the QR code immediately on component mount
        loadQrCode();

        // Refresh the QR code image every 10 seconds to ensure it's updated
        const interval = setInterval(loadQrCode, 10000);

        // Handle login success event from socket
        socket.on('login-success', () => {
            onLogin(); // Trigger login success callback
        });

        // Cleanup on component unmount
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
                    <img 
                        src={qrCodeImage} 
                        alt="QR Code" 
                        width="250" 
                        height="250" 
                        onError={loadQrCode} // Reload if there's an error loading the image
                    />
                ) : (
                    <p>No QR Code available. Please check again.</p>
                )
            )}
        </div>
    );
}

export default QRCodeScanner;
