const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const axios = require('axios'); // Import axios for API calls
const express = require('express'); // Import express
const sqlite3 = require('sqlite3');
const dotenv = require('dotenv');
const fs = require('fs');



// Load environment variables from .env file
dotenv.config();

// Base URL for your API, using the React port from the .env file
const BASE_URL = `https://bulkwhatsapp.onrender.com`;

// Disable hardware acceleration
app.disableHardwareAcceleration();

// Set up Express
const apiApp = express();
const EXPRESS_PORT = 3098;

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        show: false, // Initially hidden
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'), // Ensure this path is correct
            nodeIntegration: false, // Should be false for security
            contextIsolation: true // Enable context isolation for security
        }
    });

    // Load the React build
    console.log('Loading file:', path.join(__dirname, 'build/index.html'));
    mainWindow.loadFile(path.join(__dirname, 'build/index.html'));

    // Wait until the content is ready to be shown
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();

        // Open Developer Tools only in development mode
        if (process.env.NODE_ENV === 'development') {
            mainWindow.webContents.openDevTools();
        }
    });
}

// Define the API route for retrieving contacts from SQLite database
apiApp.get('/api/contacts', (req, res) => {
    const db = new sqlite3.Database(process.env.DB_PATH || 'contacts.db');
    const query = "SELECT id, name, phone FROM contacts WHERE name IS NOT NULL AND name != 'Unknown'";

    db.all(query, [], (err, rows) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.json(rows);
    });
});

// Start Express server
app.whenReady().then(() => {
    apiApp.listen(EXPRESS_PORT, () => {
        console.log(`API server running on http://localhost:${EXPRESS_PORT}`);
    });
    createWindow();
});

// IPC Handlers for interacting with the API
ipcMain.handle('api:createGroup', async (event, { name, contactIds }) => {
    try {
        // Send a POST request to create a new group with name and contact IDs
        const response = await axios.post(`${BASE_URL}/api/groups`, { name, contactIds });
        
        // Return the API response data, typically the created group data
        return response.data;
    } catch (error) {
        console.error('Error creating group:', error);

        // Send back a detailed error message
        const errorMessage = error.response?.data?.message || 'Failed to create group';
        return { error: errorMessage };
    }
});


// IPC handler to get groups data
ipcMain.handle('api:getGroups', async () => {
    try {
        const response = await axios.get(`${BASE_URL}/api/groups-data`);
        return response.data; // Return the array of groups with contact counts
    } catch (error) {
        console.error('Error in IPC handler for getGroups:', error);
        return { error: 'Failed to fetch groups' };
    }
});

ipcMain.handle('api:getGroupContacts', async (event, groupId) => {
    try {
        console.log(`LOG: Fetching group contacts for groupId: ${groupId}`);
        const response = await axios.get(`${BASE_URL}/api/groups/${groupId}/contacts`);
        console.log(`LOG: API response:`, response.data); // Log the actual API response here
        return response.data;
    } catch (error) {
        console.error('Error fetching group contacts:', error.message);
        return { error: 'Failed to fetch group contacts' };
    }
});


ipcMain.handle('api:sendMessageToGroup', async (event, { contactIds, message }) => {
    console.log('Sending message:', { message, contactIds }); // Log the payload
    try {
        const response = await axios.post(`${BASE_URL}/api/send-message`, { 
            message, 
            contactIds 
        });
        return response.data;
    } catch (error) {
        console.error('Error sending message to group:', error);
        return { error: 'Failed to send message to group' };
    }
});



let qrCodeBuffer = null; // Store the QR code image buffer in memory

ipcMain.handle('fetchQrCode', async () => {
    try {
        // Make the GET request to fetch the QR code image in binary format
        const response = await axios.get(`${BASE_URL}/api/qr-code`, {
            responseType: 'arraybuffer' // This ensures the response is treated as binary data
        });

        if (!response.data) {
            throw new Error('No image data received');
        }

        // Define the file path to save the image
        const imagePath = path.join(__dirname, 'qrcode.png');

        // Write the binary data (buffer) directly to a file
        fs.writeFileSync(imagePath, response.data);

        // Return the image path to the renderer process
        return { imagePath };
    } catch (error) {
        console.error('Error fetching QR Code or saving image:', error);
        return { error: 'Failed to fetch QR Code or save image' };
    }
});


ipcMain.handle('api:saveContactsToDatabase', async () => {
    try {
        await saveContactsToDatabase();
        return { success: true };
    } catch (error) {
        console.error('Error in api:saveContactsToDatabase:', error);
        return { error: 'Failed to save contacts to database' };
    }
});



ipcMain.handle('api:updateContactInGroup', async (event, { groupId, contactId, updatedData }) => {
    try {
        console.log('Updating contact:', { groupId, contactId, updatedData });

        // Ensure that the destructured variables are properly passed
        if (!groupId || !contactId || !updatedData) {
            throw new Error('Invalid parameters. groupId, contactId, and updatedData are required.');
        }

        // Send a POST request to the server to update the contact's details
        const response = await axios.post(`${BASE_URL}/api/groups/${groupId}/contacts/${contactId}`, updatedData);

        // Return the response from the API, typically success or error message
        return response.data;
    } catch (error) {
        console.error('Error updating contact in group:', error);
        return { error: error.response?.data || 'Failed to update contact in group' };
    }
});

// IPC handler to remove contacts from a group
// Handle removing contact from group in the backend
ipcMain.handle('api:removeContactFromGroup', async (event, { groupId, contactId }) => {
    try {
        // Send a POST request to remove the contact from the group
        const response = await axios.post(`${BASE_URL}/api/removecontact`, { groupId, contactIds: [contactId] }); // Wrap contactId in an array
        return response.data; // Send back the response from the server
    } catch (error) {
        console.error('Error removing contact from group:', error);
        return { error: 'Failed to remove contact from group' };
    }
});


// IPC handler to get all contacts from the database
ipcMain.handle('api:getContacts', async () => {
    try {
        const response = await axios.get(`${BASE_URL}/api/contacts`);
        return response.data;
    } catch (error) {
        console.error('Error fetching contacts:', error);
        return { error: 'Failed to fetch contacts' };
    }
});

// IPC handler to add a contact to a group
ipcMain.handle('api:addContactToGroup', async (event, groupId, contact) => {
    try {
        // Log the data being sent to the API
        console.log('Data being sent to the API:', {
            groupId,
            contact
        });

        // Sending both groupId and contact in the request body
        const response = await axios.post(`${BASE_URL}/api/addtogroup`, { groupId, ...contact });
        return response.data;
    } catch (error) {
        console.error('Error adding contact to group:', error);
        return { error: 'Failed to add contact to group' };
    }
});


// Create the application window
app.whenReady().then(createWindow);

// Handle window events
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// Ensure all IPC listeners are removed when the app quits to avoid memory leaks
app.on('quit', () => {
    ipcMain.removeAllListeners();
});
