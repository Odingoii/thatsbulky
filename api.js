const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const fetch = require('node-fetch');
const path = require('path'); // For serving files
const app = express();
const db = new sqlite3.Database(process.env.DB_PATH || 'contacts.db');

app.use(express.json()); // Parse JSON bodies

// Base URL for external API calls
const BASE_URL = 'http://localhost:3001'; // Adjust this to your actual base URL

// Fetch groups data with contact count
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
    db.all("SELECT id, name, phone, custom_name FROM contacts WHERE name IS NOT NULL AND name != 'Unknown'", [], (err, rows) => {
        if (err) return res.status(500).send(err);
        res.json(rows);
    });
});

// Fetch all groups
app.get('/api/groups', (req, res) => {
    db.all("SELECT id, name FROM groups", [], (err, rows) => {
        if (err) return res.status(500).send(err);
        res.json(rows);
    });
});

// Fetch contacts for a specific group
app.get('/api/groups/:groupId/contacts', (req, res) => {
    const groupId = req.params.groupId;
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
app.post(`${BASE_URL}/api/addtogroup`, async (req, res) => {
    const { name, contactIds } = req.body;

    // Validate input
    if (!name || !Array.isArray(contactIds) || contactIds.length === 0) {
        return res.status(400).json({ error: 'Invalid input: group name and at least one contact ID are required.' });
    }

    try {
        // Step 1: Insert the new group into the 'groups' table
        const insertGroupQuery = 'INSERT INTO groups (name) VALUES (?)';
        const insertGroupResult = await new Promise((resolve, reject) => {
            db.run(insertGroupQuery, [name], function(err) {
                if (err) {
                    return reject(err);
                }
                resolve(this.lastID);
            });
        });

        // Step 2: Insert contact IDs into the 'group_contacts' table
        const insertContactQuery = 'INSERT INTO group_contacts (group_id, contact_id) VALUES (?, ?)';
        await Promise.all(contactIds.map(contactId => {
            return new Promise((resolve, reject) => {
                db.run(insertContactQuery, [insertGroupResult, contactId], (err) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve();
                });
            });
        }));

        // Step 3: Send a success response back to the frontend
        res.status(201).json({ success: true, groupId: insertGroupResult });
    } catch (error) {
        console.error('Error adding contact to group:', error);
        res.status(500).json({ error: 'Failed to add contact to group' });
    }
});

// Update a contact in a group (PUT)
app.put('/api/groups/:groupId/contacts/:contactId', async (req, res) => {
    const { groupId, contactId } = req.params;
    const { name, phone, custom_name } = req.body;

    const updateContactQuery = `UPDATE contacts SET name = ?, phone = ?, custom_name = ? WHERE id = ?`;
    db.run(updateContactQuery, [name, phone, custom_name, contactId], function(err) {
        if (err) {
            console.error('Error updating contact:', err);
            return res.status(500).json({ error: 'Failed to update contact' });
        }
        res.status(200).json({ success: true });
    });
});

// Send a message to contacts (POST)
app.post('/api/send-message', async (req, res) => {
    try {
        const response = await fetch(`${BASE_URL}/api/send-message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body)
        });

        const result = await response.json();
        res.status(response.status).json(result);
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

// Function to fetch groups with contact count
async function fetchGroupsWithContactCount() {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT g.id, g.name, COUNT(gc.contact_id) AS contactCount
            FROM groups g
            LEFT JOIN group_contacts gc ON g.id = gc.group_id
            GROUP BY g.id
        `;
        db.all(query, [], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
