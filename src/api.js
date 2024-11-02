import axios from 'axios';

const BASE_URL = 'https://thatsbulky.com'; // Use the actual backend API URL here

// Fetch login status from the backend
export const fetchLoginStatus = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/api/status`);
        return response.data; // Returns the response data directly
    } catch (error) {
        console.error('Error fetching login status:', error);
        throw error; // Propagate the error for handling in the caller
    }
};

// Fetch all contacts from the backend
export const fetchContacts = async () => {
    try {
        const response = await fetch(`${BASE_URL}/api/contacts`);
        if (!response.ok) {
            throw new Error('Failed to fetch contacts');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching contacts:', error);
        throw error;
    }
};

// Fetch groups and their contact counts
export const fetchGroups = async () => {
    try {
        const response = await fetch(`${BASE_URL}/api/groups-data`);
        if (!response.ok) {
            throw new Error('Failed to fetch groups');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching groups:', error);
        throw error;
    }
};

// Fetch contacts for a specific group
export const fetchGroupContacts = async (groupId) => {
    try {
        const response = await fetch(`${BASE_URL}/api/groups/${groupId}/contacts`);
        if (!response.ok) {
            throw new Error('Failed to fetch group contacts');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching group contacts:', error);
        throw error;
    }
};

// Create a new group with selected contacts
export const createGroup = async (groupName, contactIds) => {
    try {
        const response = await fetch(`${BASE_URL}/api/groups`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: groupName, contactIds }),
        });

        if (!response.ok) {
            const result = await response.json();
            throw new Error(result.error || 'Failed to create group');
        }

        return await response.json(); // Return the created group
    } catch (error) {
        console.error('Error creating group:', error);
        throw error;
    }
};

// Update a contact's details in a group
export const updateContactInGroup = async (groupId, contactId, contactData) => {
    try {
        const response = await fetch(`${BASE_URL}/api/groups/${groupId}/contacts/${contactId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(contactData),
        });

        if (!response.ok) {
            throw new Error('Failed to update contact');
        }

        return await response.json();
    } catch (error) {
        console.error('Error updating contact:', error);
        throw error;
    }
};

// Remove a contact from a group
export const removeContactFromGroup = async (groupId, contactId) => {
    try {
        const response = await fetch(`${BASE_URL}/api/removecontact`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ groupId, contactIds: [contactId] }),
        });

        if (!response.ok) {
            throw new Error('Failed to remove contact from group');
        }

        return await response.json();
    } catch (error) {
        console.error('Error removing contact from group:', error);
        throw error;
    }
};

// Add a contact to a group
export const addContactToGroup = async (groupId, contactId) => {
    try {
        const response = await fetch(`${BASE_URL}/api/addtogroup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ groupId, id: contactId }),
        });

        if (!response.ok) {
            throw new Error('Failed to add contact to group');
        }

        return await response.json();
    } catch (error) {
        console.error('Error adding contact to group:', error);
        throw error;
    }
};

// Send a message to contacts (POST)
export const sendMessageToGroup = async (groupId, messages) => {
  try {
      const response = await fetch(`${BASE_URL}/api/send-message`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({
              message: messages[0].message, // Send the first message text
              contactIds: messages.map(m => m.phone), // Extract contactIds from the messages array
          }),
      });

      const data = await response.json();
      if (!response.ok) {
          console.error('Failed to send message:', data);
          throw new Error(data.error || 'Failed to send message');
      }
      return data;
  } catch (error) {
      console.error('Error sending message:', error);
      throw error;
  }
};
export const fetchQRCode = async () => {
    try {
        const timestamp = new Date().getTime();
        const imagePath = `${BASE_URL}/api/qrcode?q=${timestamp}`; // QR code from storage
        const response = await axios.get(imagePath, { responseType: 'blob' });
        
        return URL.createObjectURL(response.data); // Create a local URL for the blob
    } catch (error) {
        console.error('Error loading QR code:', error);
        throw error; // Propagate the error
    }
};
