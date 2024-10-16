const { contextBridge, ipcRenderer } = require('electron');

// Request the server port from the main process
ipcRenderer.send('get-server-port');

// Listen for the correct server port and load the React app
ipcRenderer.on('server-port', (event, reactUrl) => {
    window.location = reactUrl; // Load the React app using the server port
});

console.log('Preload script running...');

// Expose API methods to the renderer process
contextBridge.exposeInMainWorld('api', {
    // Fetch contacts from the database
    getContacts: async () => await ipcRenderer.invoke('api:getContacts'),

    // Create a new group
    createGroup: async (groupData) => {
        try {
            return await ipcRenderer.invoke('api:createGroup', groupData);
        } catch (error) {
            console.error('Error in createGroup:', error);
        }
    },

    // Fetch all groups with contact counts
    getGroups: async () => await ipcRenderer.invoke('api:getGroups'),

    // Fetch all contacts in a specific group
    getGroupContacts: async (groupId) => {
        console.log(`LOG: getGroupContacts called with groupId: ${groupId}`);
        const response = await ipcRenderer.invoke('api:getGroupContacts', groupId);
        console.log('LOG: getGroupContacts response: ', response);
        return response; // Ensure you're returning the response
    },

    // Send a message to a group of contacts
    sendMessageToGroup: async (data) => await ipcRenderer.invoke('api:sendMessageToGroup', data),

    // Fetch the QR code for a specific operation (WhatsApp, etc.)
    fetchQrCode: async () => await ipcRenderer.invoke('api:fetchQrCode'),

    // Send QR code (base64) to the backend
    sendQrCodeToApi: async (qrCodeBase64) => await ipcRenderer.invoke('api:sendQrCode', qrCodeBase64),

    // Add a contact to a specific group
    addContactToGroup: async (groupId, contact) => {
        console.log(`Attempting to add contact to group ${groupId}`);
        try {
            const response = await ipcRenderer.invoke('api:addContactToGroup', groupId, contact);
            console.log('Successfully added contact to group', response);
            return response; // Return the response for further handling
        } catch (err) {
            console.error('Error while adding contact to group:', err);
            throw new Error('Failed to add contact to group.');
        }
    },

// Update a contact's details in a group
updateContactInGroup: async (groupId, contactId, updatedData) => {
    try {
        console.log(`Updating contact ${contactId} in group ${groupId} with data:`, updatedData);
        const response = await ipcRenderer.invoke('api:updateContactInGroup', { groupId, contactId, updatedData });

        // Check if the response contains an error
        if (response.error) {
            console.error('Error response from IPC:', response.error);
            throw new Error(response.error); // Throw the error from the response
        }

        return response; // Return the response for further handling
    } catch (err) {
        console.error('Error while updating contact in group:', err.message || err);
        throw new Error('Failed to update contact in group. Please try again.'); // More user-friendly message
    }
},



// Remove a contact from a group
removeContactFromGroup: async (groupId, contactId) => {
    console.log(`Attempting to remove contact ${contactId} from group ${groupId}`);
    try {
        const response = await ipcRenderer.invoke('api:removeContactFromGroup', { groupId, contactId }); // Send as an object
        console.log('Successfully removed contact from group', response);
        return response; // Return the response to handle it in the frontend
    } catch (err) {
        console.error('Error while removing contact from group:', err);
        throw new Error('Failed to remove contact from group.');
    }
},


    // Save contacts to the database
    saveContactsToDatabase: async () => {
        try {
            const response = await ipcRenderer.invoke('api:saveContactsToDatabase');
            return response; // Return response for further handling
        } catch (err) {
            console.error('Error while saving contacts to database:', err);
            throw new Error('Failed to save contacts to the database.');
        }
    }
});

console.log('API methods exposed to renderer process');
