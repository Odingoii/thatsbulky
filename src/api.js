// Fetch all contacts
const getContacts = async () => {
  return await window.api.getContacts();
};

// Create a group with selected contacts
const createGroup = async ({ name, contactIds }) => {
  try {
    const response = await window.api.createGroup({ name, contactIds });
    return response; // Return the created group data if needed
  } catch (error) {
    console.error('Error creating group:', error);
    throw error; // Throw the error for handling in the component
  }
};

// Get all groups
const getGroups = async () => {
  return await window.api.getGroups();
};

// Get contacts of a specific group
const getGroupContacts = async (groupId) => {
  return await window.api.getGroupContacts(groupId);
};

// Send a message to a group
const sendMessageToGroup = async (groupId, message) => {
  return await window.api.sendMessageToGroup({ groupId, message });
};

// Fetch QR Code image URL
const fetchQrCode = async () => {
  return await window.api.fetchQrCode();
};

// Export all functions
export {
  getContacts,
  createGroup,
  getGroups,
  getGroupContacts,
  sendMessageToGroup,
  fetchQrCode,
};
