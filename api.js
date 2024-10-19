const BASE_URL = `https://bulkwhatsapp.onrender.com:3001`;
const fetch = require('node-fetch');
const express = require('express');
const app = express();
app.use(express.json());
    const BASE_URL = `https://bulkwhatsapp.onrender.com:${3001}`;
    app.use(express.json()); // Parse JSON bodies

    let latestQrCode = null; // Store the latest QR code in memory

    // Fetch groups data
    app.get('/api/groups-data', async (req, res) => {
        try {
            const groups = await fetchGroupsWithContactCount();
            res.json(groups);
        } catch (error) {
            console.error('Error fetching groups:', error);
            res.status(500).json({ error: 'Failed to fetch groups' });
        }
    });

    // Serve QR code image
    app.get('/api/qr-code/:filename', (req, res) => {
        const filename = req.params.filename;
        const filePath = path.join(__dirname, 'uploads', filename);

        res.sendFile(filePath, (err) => {
            if (err) {
                console.error('Error sending file:', err);
                res.status(err.status).end();
            } else {
                console.log('Sent:', filename);
            }
        });
    });

    // Fetch contacts
    app.get('/api/contacts', (req, res) => {
        const db = new sqlite3.Database(process.env.DB_PATH || 'contacts.db');
        db.all("SELECT id, name, phone, custom_name FROM contacts WHERE name IS NOT NULL AND name != 'Unknown'", [], (err, rows) => {
            if (err) return res.status(500).send(err);
            res.json(rows);
        });
    });

    // Fetch all groups
    app.get('/api/groups', (req, res) => {
        const db = new sqlite3.Database(process.env.DB_PATH || 'contacts.db');
        db.all("SELECT id, name FROM groups", [], (err, rows) => {
            if (err) return res.status(500).send(err);
            res.json(rows);
        });
    });

    // Fetch contacts for a specific group
    app.get('/api/groups/:groupId/contacts', (req, res) => {
        const groupId = req.params.groupId;
        const db = new sqlite3.Database(process.env.DB_PATH || 'contacts.db');
        const query = `
            SELECT c.id, c.name, c.phone, c.custom_name
            FROM contacts c
            INNER JOIN group_contacts gc ON c.id = gc.contact_id
            WHERE gc.group_id = ?
        `;
        db.all(query, [groupId], (err, rows) => {
            if (err) return res.status(500).send(err);
            res.json(rows);
        });
    });
    // Add a contact to a group (POST)
app.post('/api/addtogroup', async (req, res) => {
    try {
        const response = await fetch(`${BASE_URL}/api/addtogroup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body) // Forward request body from frontend to backend
        });

        const result = await response.json();
        res.status(response.status).json(result); // Send the backend's response back to frontend
    } catch (error) {
        console.error('Error adding contact to group:', error);
        res.status(500).json({ error: 'Failed to add contact to group' });
    }
});

// Update a contact in a group (POST)
app.post('/api/groups/:groupId/contacts/:contactId', async (req, res) => {
    const { groupId, contactId } = req.params;
    try {
        const response = await fetch(`${BASE_URL}/api/groups/${groupId}/contacts/${contactId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body) // Forward request body from frontend to backend
        });

        const result = await response.json();
        res.status(response.status).json(result);
    } catch (error) {
        console.error('Error updating contact:', error);
        res.status(500).json({ error: 'Failed to update contact' });
    }
});

// Send a message to contacts (POST)
app.post('/api/send-message', async (req, res) => {
    try {
        const response = await fetch(`${BASE_URL}/api/send-message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body) // Forward the request to backend
        });

        const result = await response.json();
        res.status(response.status).json(result); // Send the backend's response back to frontend
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});
