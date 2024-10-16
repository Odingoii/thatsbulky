import React, { useEffect, useState } from 'react';
import { useAppContext, ACTIONS } from '../App'; // Import the context and actions
import './GroupView.css';

function GroupView() {
    const [groups, setGroups] = useState([]); // List of groups
    const [loading, setLoading] = useState(true); // Loading state
    const [error, setError] = useState(''); // Error message

    // Access the app's context state and dispatch function
    const { dispatch } = useAppContext();

    // Fetch groups on component mount
    useEffect(() => {
        const fetchGroups = async () => {
            try {
                // Call the appropriate API to get the groups
                const response = await window.api.getGroups(); // Fetch groups with contact counts
                if (response.error) {
                    throw new Error(response.error);
                }
                setGroups(response); // Set the fetched groups into state
            } catch (err) {
                console.error('Error fetching groups:', err);
                setError('Failed to load groups.');
            } finally {
                setLoading(false); // Update loading state
            }
        };

        fetchGroups();
    }, []);

    // Handle group selection
    const handleGroupSelect = (groupId) => {
        // Dispatch action to set the active page to 'groupDetail' and pass the selected groupId
        dispatch({ type: ACTIONS.SET_ACTIVE_PAGE, payload: 'groupDetail' });
        dispatch({ type: ACTIONS.SET_REDIRECT, payload: groupId }); // Store the groupId for GroupDetail
    };

    return (
        <div className="group-view-container">
            <h2>Groups</h2>

            {loading ? (
                <p>Loading groups...</p>
            ) : (
                <>
                    {groups.length === 0 ? (
                        <p>No Groups</p>
                    ) : (
                        <table className="group-table">
                            <thead>
                                <tr>
                                    <th>Group Name</th>
                                    <th>Number of Contacts</th>
                                </tr>
                            </thead>
                            <tbody>
                                {groups.map(group => (
                                    <tr key={group.id} onClick={() => handleGroupSelect(group.id)}>
                                        <td>{group.name}</td>
                                        <td>{group.contactCount || 0}</td> {/* Display the actual number of contacts */}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </>
            )}

            {error && <p className="error-message">{error}</p>}
        </div>
    );
}

export default GroupView;
