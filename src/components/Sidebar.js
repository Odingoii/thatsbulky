import React from 'react';
import { useAppContext } from '../App'; // Adjust the import according to your file structure
import './Sidebar.css'; // Import the CSS file for styling

function Sidebar({ disabled }) { // Accepting the disabled prop
    const { dispatch } = useAppContext(); // Get dispatch function from context

    const handlePageChange = (page) => {
        dispatch({ type: 'SET_ACTIVE_PAGE', payload: page }); // Dispatch action to set active page
    };

    return (
        <div className={`sidebar ${disabled ? 'disabled' : ''}`}>
            <h2 className="sidebar-title">Menu</h2>
            <button 
                className="sidebar-button" 
                onClick={() => handlePageChange('createGroup')} 
                disabled={disabled} // Disable the button if loading
            >
                Create Group
            </button>
            <button 
                className="sidebar-button" 
                onClick={() => handlePageChange('sendMessage')} 
                disabled={disabled} // Disable the button if loading
            >
                Send Message
            </button>
            <button 
                className="sidebar-button" 
                onClick={() => handlePageChange('groups')} 
                disabled={disabled} // Disable the button if loading
            >
                View Groups
            </button>
        </div>
    );
}

export default Sidebar;
