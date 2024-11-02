import React, { useEffect, useState } from 'react';
import { useAppContext } from '../App'; // Import the context
import './GroupView.css';
import { fetchGroups } from '../api';  // Import API service function
import GroupDetail from './GroupDetail'; // Import the GroupDetail component

function GroupView() {
    const [groups, setGroups] = useState([]); // List of groups
    const [loading, setLoading] = useState(true); // Loading state
    const [error, setError] = useState(''); // Error message
    const [selectedGroupId, setSelectedGroupId] = useState(null); // State for selected group

    // Access the app's context state and dispatch function
    const { dispatch } = useAppContext();

    // Fetch groups on component mount
    useEffect(() => {
        const loadGroups = async () => {
            try {
                const groupsData = await fetchGroups(); // Fetch groups from the backend
                setGroups(groupsData); // Set the fetched groups into state
            } catch (err) {
                console.error('Error fetching groups:', err);
                setError('Failed to load groups.');
            } finally {
                setLoading(false); // Update loading state
            }
        };

        loadGroups();
    }, []);

    // Handle group selection
    const handleGroupSelect = (groupId) => {
        setSelectedGroupId(groupId); // Set selected groupId
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
                                        <td>{group.contactCount || 0}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </>
            )}

            {error && <p className="error-message">{error}</p>}

            {/* Render the GroupDetail component if a group is selected */}
            {selectedGroupId && <GroupDetail groupId={selectedGroupId} />}
        </div>
    );
}

export default GroupView;
