import React from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import './Sidebar.css'; // Import the CSS file for styling

function Sidebar({ disabled }) {
    const navigate = useNavigate(); // Initialize navigate

    const handlePageChange = (path) => {
        navigate(path); // Use navigate to go to the new path
    };

    return (
        <div className={`sidebar ${disabled ? 'disabled' : ''}`}>
            <h2 className="sidebar-title">Menu</h2>
            <button 
                className="sidebar-button" 
                onClick={() => handlePageChange('/group')} 
                disabled={disabled} // Disable the button if loading
            >
                View Groups
            </button>
            <button 
                className="sidebar-button" 
                onClick={() => handlePageChange('/contacts')} 
                disabled={disabled} // Disable the button if loading
            >
                Contact Selection
            </button>
            <button 
                className="sidebar-button" 
                onClick={() => handlePageChange('/sendMessage')} 
                disabled={disabled} // Disable the button if loading
            >
                Send Message
            </button>
        </div>
    );
}

export default Sidebar;
