import React, { useState } from 'react';
import { useAppContext, ACTIONS } from '../App';  // Import ACTIONS here
import '../styles.css';

function ContactTable() {
    const { state, dispatch } = useAppContext();
    const { groupId, contacts } = state.contactTable;
    const [adding, setAdding] = useState(false);
    const [allContacts, setAllContacts] = useState([]);  // Assuming you get this from elsewhere

    const handleAddContact = async (contactId) => {
        try {
            const contact = await window.api.addContactToGroup(groupId, contactId);
            dispatch({
                type: ACTIONS.SET_CONTACT_TABLE,
                payload: { visible: true, groupId, contacts: [...contacts, contact] }
            });
        } catch (error) {
            console.error('Error adding contact:', error);
        }
    };

    const handleRemoveContact = async (contactId) => {
        try {
            await window.api.removeContactFromGroup(groupId, contactId);
            dispatch({
                type: ACTIONS.SET_CONTACT_TABLE,
                payload: { visible: true, groupId, contacts: contacts.filter(contact => contact.id !== contactId) }
            });
        } catch (error) {
            console.error('Error removing contact from group:', error);
        }
    };

    const handleCustomNameChange = (contactId, customName) => {
        const updatedContacts = contacts.map(contact => 
            contact.id === contactId ? { ...contact, customName } : contact
        );
        dispatch({
            type: ACTIONS.SET_CONTACT_TABLE,
            payload: { visible: true, groupId, contacts: updatedContacts }
        });
    };

    const handleSalutationChange = (contactId, salutation) => {
        const updatedContacts = contacts.map(contact => 
            contact.id === contactId ? { ...contact, salutation } : contact
        );
        dispatch({
            type: ACTIONS.SET_CONTACT_TABLE,
            payload: { visible: true, groupId, contacts: updatedContacts }
        });
    };

    return (
        <div className="contact-table-container">
            <button onClick={() => setAdding(!adding)} className="add-contact-btn">
                {adding ? 'Cancel' : 'Add Contacts'}
            </button>
            {adding && (
                <div className="add-contact-dropdown">
                    {allContacts.map(contact => (
                        <div key={contact.id} className="add-contact-item">
                            <span>{contact.name}</span>
                            <button onClick={() => handleAddContact(contact.id)}>Add</button>
                        </div>
                    ))}
                </div>
            )}
            <table className="contact-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Contact</th>
                        <th>Custom Name</th>
                        <th>Salutation</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {contacts.map(contact => (
                        <tr key={contact.id}>
                            <td>{contact.name}</td>
                            <td>{contact.phone}</td>
                            <td>
                                <input 
                                    type="text" 
                                    value={contact.customName || ''} 
                                    onChange={(e) => handleCustomNameChange(contact.id, e.target.value)}
                                />
                            </td>
                            <td>
                                <select 
                                    value={contact.salutation || 'informal'}
                                    onChange={(e) => handleSalutationChange(contact.id, e.target.value)}
                                >
                                    <option value="informal">Informal</option>
                                    <option value="formal">Formal</option>
                                    <option value="very formal">Very Formal</option>
                                </select>
                            </td>
                            <td>
                                <button onClick={() => handleRemoveContact(contact.id)}>Remove</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default ContactTable;
