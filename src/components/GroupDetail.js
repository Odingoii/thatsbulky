import React, { useEffect, useState } from 'react';
import { useAppContext, ACTIONS } from '../App';
import './GroupDetail.css';
import {
    fetchGroupContacts,
    fetchContacts,
    updateContactInGroup,
    addContactToGroup,
    removeContactFromGroup
} from '../api';  // Import API service functions

function GroupDetail() {
    const { state, dispatch } = useAppContext();
    const groupId = state.redirectToSendMessage;
    const [group, setGroup] = useState(null);
    const [contacts, setContacts] = useState([]);
    const [allContacts, setAllContacts] = useState([]);
    const [selectedContacts, setSelectedContacts] = useState([]);
    const [showAddContacts, setShowAddContacts] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        const fetchGroupDetailsAndContacts = async () => {
            if (!groupId) {
                setError('Group ID is missing.');
                setLoading(false);
                return;
            }

            try {
                const contactList = await fetchGroupContacts(groupId);
                setContacts(contactList);
                setGroup({ id: groupId, name: `Group ${groupId}` });
            } catch (err) {
                setError('Failed to load group details or contacts.');
            } finally {
                setLoading(false);
            }
        };

        const fetchAllContacts = async () => {
            try {
                const contactsFromDb = await fetchContacts();
                setAllContacts(contactsFromDb);
            } catch (err) {
                setError('Failed to load all contacts.');
            }
        };

        if (groupId) {
            fetchGroupDetailsAndContacts();
            fetchAllContacts();
        }
    }, [groupId]);

    const filteredContacts = allContacts.filter(contact =>
        contact.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleContactSelection = (contactId) => {
        setSelectedContacts(prevSelected => {
            if (prevSelected.includes(contactId)) {
                return prevSelected.filter(id => id !== contactId);
            } else {
                return [...prevSelected, contactId];
            }
        });
    };

    const handleFieldChange = (contactId, field, value) => {
        setContacts(prevContacts =>
            prevContacts.map(contact =>
                contact.id === contactId ? { ...contact, [field]: value } : contact
            )
        );
    };

    const handleSaveAllContacts = async () => {
        try {
            for (const contact of contacts) {
                if (contact.id) {
                    await updateContactInGroup(groupId, contact.id, {
                        name: contact.name,
                        phone: contact.phone,
                        custom_name: contact.custom_name,
                    });
                } else {
                    await addContactToGroup(groupId, contact.id);
                }
            }
            const updatedContacts = await fetchGroupContacts(groupId);
            setContacts(updatedContacts);
            setSuccessMessage('Successfully saved all contacts.');
        } catch (err) {
            setError('Failed to save contacts.');
        }
    };

    const handleAddContactsToGroup = async () => {
        try {
            for (const contactId of selectedContacts) {
                const contact = allContacts.find(c => c.id === contactId);
                if (contact) {
                    await addContactToGroup(groupId, contact.id);
                }
            }

            const updatedContacts = await fetchGroupContacts(groupId);
            setContacts(updatedContacts);
            setSuccessMessage('Successfully added selected contacts to the group.');
            setShowAddContacts(false);
        } catch (err) {
            setError('Failed to add contacts to group.');
        }
    };

    const handleDeleteContact = async (contactId) => {
        try {
            await removeContactFromGroup(groupId, contactId);
            const updatedContacts = contacts.filter(contact => contact.id !== contactId);
            setContacts(updatedContacts);
            setSuccessMessage('Contact deleted successfully.');
        } catch (err) {
            setError('Failed to delete contact from group.');
        }
    };

    const handleClose = () => {
        dispatch({ type: ACTIONS.SET_ACTIVE_PAGE, payload: 'groups' });
    };

    if (loading) return <p>Loading group details...</p>;
    if (error) return <p className="error-message">{error}</p>;

    return (
        <div className="group-detail-container">
            {group && <h2 className="group-title">{group.name} Contacts</h2>}
            <button className="btn close-btn" onClick={handleClose}>Close</button>
            {successMessage && <p className="success-message">{successMessage}</p>}
            <button className="btn save-btn" onClick={handleSaveAllContacts}>Save All Changes</button>

            <table className="contact-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Phone</th>
                        <th>Display Name</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {contacts.length === 0 ? (
                        <tr><td colSpan="4">No contacts available.</td></tr>
                    ) : (
                        contacts.map(contact => (
                            <tr key={contact.id}>
                                <td>
                                    <input
                                        type="text"
                                        value={contact.name}
                                        onChange={(e) => handleFieldChange(contact.id, 'name', e.target.value)}
                                        className="input-field"
                                    />
                                </td>
                                <td>
                                    <input
                                        type="text"
                                        value={contact.phone}
                                        onChange={(e) => handleFieldChange(contact.id, 'phone', e.target.value)}
                                        className="input-field"
                                    />
                                </td>
                                <td>
                                    <input
                                        type="text"
                                        value={contact.custom_name}
                                        onChange={(e) => handleFieldChange(contact.id, 'custom_name', e.target.value)}
                                        className="input-field"
                                    />
                                </td>
                                <td>
                                    <button className="btn remove-btn" onClick={() => handleDeleteContact(contact.id)}>
                                        Remove
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>

            <button className="btn add-contacts-btn" onClick={() => setShowAddContacts(!showAddContacts)}>
                {showAddContacts ? 'Hide Add Contacts' : 'Add Contacts to Group'}
            </button>

            {showAddContacts && (
                <div className="add-contacts-section">
                    <h3>Select Contacts to Add</h3>
                    <input
                        type="text"
                        placeholder="Search contacts..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                    />

                    <div className="contact-list">
                        <table className="contact-table">
                            <thead>
                                <tr>
                                    <th>Select</th>
                                    <th>Name</th>
                                    <th>Contact</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredContacts.map(contact => (
                                    <tr key={contact.id} className={selectedContacts.includes(contact.id) ? 'selected' : ''}>
                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={selectedContacts.includes(contact.id)}
                                                onChange={() => handleContactSelection(contact.id)}
                                            />
                                        </td>
                                        <td>{contact.name}</td>
                                        <td>{contact.phone}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <button className="btn add-selected-btn" onClick={handleAddContactsToGroup}>Add Selected Contacts</button>
                </div>
            )}
        </div>
    );
}

export default GroupDetail;
