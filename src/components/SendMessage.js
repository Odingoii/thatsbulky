import React, { useState, useEffect } from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import './SendMessage.css'; // Assuming styles are in this file

// GroupView component for selecting a group
function GroupView({ onGroupSelect, selectedGroup }) {
    const [groups, setGroups] = useState([]);

    // Fetch groups on component mount
    useEffect(() => {
        const fetchGroups = async () => {
            try {
                const response = await window.api.getGroups(); // Use the Electron API to fetch groups
                if (Array.isArray(response)) {
                    setGroups(response);
                    console.log('Fetched groups:', response); // Log fetched groups
                } else {
                    console.warn('Unexpected response format for groups:', response);
                    setGroups([]);
                }
            } catch (err) {
                console.error('Error fetching groups:', err);
                setGroups([]); // Set an empty array on error
            }
        };

        fetchGroups();
    }, []);

    const handleGroupChange = (event) => {
        const groupId = event.target.value;
        console.log('Group selected:', groupId); // Log the selected group
        onGroupSelect(groupId); // Callback to parent component
    };

    return (
        <div className="group-view">
            <label htmlFor="group-select" className="label">Select Group: </label>
            <select
                id="group-select"
                value={selectedGroup}
                onChange={handleGroupChange}
                className="group-dropdown"
            >
                <option value="">-- Select Group --</option>
                {Array.isArray(groups) && groups.map(group => (
                    <option key={group.id} value={group.id}>
                        {group.name}
                    </option>
                ))}
            </select>
        </div>
    );
}

function SendMessage() {
    const [selectedGroup, setSelectedGroup] = useState('');
    const [message, setMessage] = useState('');
    const [groupContacts, setGroupContacts] = useState([]);
    const [selectedSalutation, setSelectedSalutation] = useState('Hey');
    const [useCustomName, setUseCustomName] = useState(false); // Default to false

    const salutations = ['Hey', 'Hello', 'Dear', 'Hi'];

    // Fetch contacts when the selected group changes
    useEffect(() => {
        const fetchGroupContacts = async () => {
            if (selectedGroup) {
                try {
                    const response = await window.api.getGroupContacts(selectedGroup);
                    if (Array.isArray(response)) {
                        setGroupContacts(response);
                        console.log('Fetched group contacts for group:', selectedGroup, response); // Log fetched contacts
                    } else {
                        console.warn('Unexpected response format for group contacts:', response);
                        setGroupContacts([]);
                    }
                } catch (error) {
                    console.error('Error fetching group contacts:', error);
                    setGroupContacts([]); // Set an empty array on error
                }
            } else {
                setGroupContacts([]); // Reset contacts if no group is selected
            }
        };

        fetchGroupContacts();
    }, [selectedGroup]);

    // Handle sending the message
    const handleSendMessage = async () => {
        if (!selectedGroup || !message.trim()) {
            alert('Please select a group and enter a message.');
            return;
        }

        try {
            // Prepare personalized messages for each contact
            const personalizedMessages = groupContacts.map(contact => {
                const contactName = useCustomName ? contact.custom_name : ''; // Use custom name if selected
                const finalMessage = `${selectedSalutation} ${contactName},\n\n${message.replace(/<[^>]*>/g, '')}`; // Remove HTML tags from the message
                return {
                    phone: contact.phone,
                    message: finalMessage
                };
            });

            // Debug: Log the data to be sent
            console.log('Sending personalized messages:', JSON.stringify(personalizedMessages, null, 2));

            // Send each message to the corresponding contact using the Electron API
            for (const contact of personalizedMessages) {
                const response = await window.api.sendMessageToGroup({
                    message: contact.message,
                    contactIds: [contact.phone]
                });

                if (response && response.success) {
                    console.log(`Message sent successfully to ${contact.phone}`);
                } else {
                    console.warn(`Failed to send message to ${contact.phone}:`, response.message || 'Unknown error');
                }
            }

            alert('Messages sent successfully!');
        } catch (error) {
            console.error('Error sending messages:', error);
            alert(`Failed to send messages. Error: ${error.message}`);
        }
    };

    // Handle group selection
    const handleGroupSelect = (groupId) => {
        setSelectedGroup(groupId);
        console.log('Selected group updated:', groupId); // Log updated selected group
    };

    return (
        <div className="send-message-container">
            {/* Group selector */}
            <GroupView onGroupSelect={handleGroupSelect} selectedGroup={selectedGroup} />

            {/* Message editor and salutation selection */}
            <div className="editor-container">
                <div className="salutation-selector">
                    <label htmlFor="salutation-select" className="label">Select Salutation: </label>
                    <select
                        id="salutation-select"
                        value={selectedSalutation}
                        onChange={(e) => setSelectedSalutation(e.target.value)}
                        className="salutation-dropdown"
                    >
                        {salutations.map((salutation, index) => (
                            <option key={index} value={salutation}>
                                {salutation}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Toggle for custom name */}
                <div className="custom-name-toggle">
                    <label htmlFor="custom-name-toggle" className="label">Use Custom Name: </label>
                    <input
                        type="checkbox"
                        id="custom-name-toggle"
                        checked={useCustomName}
                        onChange={(e) => setUseCustomName(e.target.checked)}
                        className="custom-name-checkbox"
                    />
                </div>

                {/* Message input via CKEditor */}
                <CKEditor
                    editor={ClassicEditor}
                    data={message}
                    onChange={(event, editor) => {
                        const data = editor.getData();
                        setMessage(data); // Update message state
                        console.log('Message content updated:', data); // Log updated message
                    }}
                    config={{
                        height: '300px',
                        toolbar: [
                            'heading', '|', 'bold', 'italic', 'link', 'bulletedList', 'numberedList', 'blockQuote', '|',
                            'undo', 'redo', 'alignment'
                        ],
                    }}
                    className="message-editor"
                />

                {/* Send message button */}
                <button onClick={handleSendMessage} className="send-btn">Send Message</button>
            </div>
        </div>
    );
}

export default SendMessage;
