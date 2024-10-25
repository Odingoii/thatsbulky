import React, { useState, useEffect } from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import './SendMessage.css'; // Assuming styles are in this file
import { fetchGroups, fetchGroupContacts, sendMessageToGroup } from '../api'; // Import API functions

// GroupView component for selecting a group
function GroupView({ selectedGroup, onGroupSelect }) {
    const [groups, setGroups] = useState([]);

    // Fetch groups on component mount
    useEffect(() => {
        const loadGroups = async () => {
            try {
                const groupsData = await fetchGroups();
                setGroups(groupsData);
            } catch (error) {
                console.error('Error fetching groups:', error);
                setGroups([]); // Set an empty array on error
            }
        };

        loadGroups();
    }, []);

    const handleGroupChange = (event) => {
        const groupId = event.target.value;
        onGroupSelect(groupId);  // Call the passed prop function
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
                {groups.map(group => (
                    <option key={group.id} value={group.id}>
                        {group.name}
                    </option>
                ))}
            </select>
        </div>
    );
}

function SendMessage() {
    const [selectedGroup, setSelectedGroup] = useState('');  // Track selected group
    const [message, setMessage] = useState('');
    const [groupContacts, setGroupContacts] = useState([]);
    const [selectedSalutation, setSelectedSalutation] = useState('Hey');
    const [useCustomName, setUseCustomName] = useState(false);

    const salutations = ['Hey', 'Hello', 'Dear', 'Hi'];

    // Fetch contacts when the selected group changes
    useEffect(() => {
        const loadGroupContacts = async () => {
            if (!selectedGroup) return;

            try {
                const contactsData = await fetchGroupContacts(selectedGroup);
                setGroupContacts(contactsData);
            } catch (error) {
                console.error('Error fetching group contacts:', error);
                setGroupContacts([]);
            }
        };

        loadGroupContacts();
    }, [selectedGroup]);

    // Define the handler to select a group
    const handleGroupSelect = (groupId) => {
        setSelectedGroup(groupId);  // Use the setSelectedGroup function here
    };

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

        // Send each message to the corresponding contact using the existing API structure
        for (const contact of personalizedMessages) {
            try {
                const response = await sendMessageToGroup(selectedGroup, [{
                    phone: contact.phone,
                    message: contact.message
                }]);

                if (response && response.success) {
                    console.log(`Message sent successfully to ${contact.phone}`);
                } else {
                    console.warn(`Failed to send message to ${contact.phone}:`, response.message || 'Unknown error');
                }
            } catch (error) {
                console.error(`Error sending message to ${contact.phone}:`, error);
            }
        }

        alert('Messages sent successfully!');
    } catch (error) {
        console.error('Error sending messages:', error);
        alert(`Failed to send messages. Error: ${error.message}`);
    }
};

// Handle group selection with logging
const handleGroupSelect = (groupId) => {
    setSelectedGroup(groupId);
    console.log('Selected group updated:', groupId); // Log updated selected group
};


    return (
        <div className="send-message-container">
            {/* Group selector */}
            <GroupView selectedGroup={selectedGroup} onGroupSelect={handleGroupSelect} />  {/* Pass handleGroupSelect */}

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
                        setMessage(editor.getData());
                    }}
                    config={{
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
