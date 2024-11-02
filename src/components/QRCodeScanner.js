// QRCodeScanner.js
import React, { useState, useEffect } from 'react';
import LoadingSpinner from './LoadingSpinner'; // Import your loading spinner
import { fetchQRCode } from '../api'; // Import the fetchQRCode function
import './QRCodeScanner.css'; // Import the CSS file for styling

function QRCodeScanner({ onLogin }) {
    const [qrCodeImage, setQrCodeImage] = useState(null);
    const [status, setStatus] = useState('Loading QR Code...');
    const [loading, setLoading] = useState(true);

    // Function to load the QR code from the storage folder
    const loadQrCode = async () => {
        setLoading(true);
        setStatus('Loading QR Code...');
        try {
            const imagePath = await fetchQRCode(); // Fetch the QR code using the API function
            setQrCodeImage(imagePath);
            setStatus('QR Code Loaded');
        } catch (error) {
            setStatus('Failed to load QR Code');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Load the QR code immediately on component mount
        loadQrCode();

        // Refresh the QR code image every 20 seconds to ensure it's updated
        const interval = setInterval(loadQrCode, 20000);

        // Cleanup on component unmount
        return () => clearInterval(interval); // Clear interval to prevent memory leaks
    }, []);

    return (
        <div className="qr-code-scanner">
            <h1 className="title">QR Code Scanner</h1>
            <p className="status">{status}</p>
            {loading ? (
                <LoadingSpinner />
            ) : (
                qrCodeImage ? (
                    <img 
                        src={qrCodeImage} 
                        alt="QR Code" 
                        className="qr-code-image"
                        onError={loadQrCode} // Reload if there's an error loading the image
                    />
                ) : (
                    <p className="no-qr-code">No QR Code available. Please check again.</p>
                )
            )}
        </div>
    );
}

export default QRCodeScanner;
