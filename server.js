const fs = require('fs');
const path = require('path');
const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose(); 
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

dotenv.config(); // Load initial environment variables

const app = express();
const server = http.createServer(app);
const db = new sqlite3.Database(process.env.DB_PATH || 'contacts.db');
const SECRET_KEY = process.env.SECRET_KEY;

const clients = {}; // Store client instances by token
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const userToken = req.headers.authorization.split(' ')[1];
        const userDir = path.join(__dirname, 'uploads', userToken); // Use user token for unique storage
        fs.mkdirSync(userDir, { recursive: true });
        cb(null, userDir);
    },
    filename: (req, file, cb) => {
        cb(null, 'qrcode.png');
    }
});
const upload = multer({ storage });

app.use(express.json());
app.use(cors({ origin: 'https://thatsbulky.com', credentials: true }));
app.use(express.static(path.join(__dirname, 'uploads')));

// Middleware for authentication
const authenticateUser = (req, res, next) => {
    const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
    if (!token) return res.status(403).json({ error: 'Token is required' });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(401).json({ error: 'Invalid token' });
        req.user = user; 
        next();
    });
};

// API for QR code generation
app.post('/api/qr-code', authenticateUser, upload.single('qrCode'), (req, res) => {
    const file = req.file;

    if (!file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    console.log('QR code image saved to storage:', file.path);
    res.status(200).json({ message: 'QR code saved successfully' });
});

// Create and initialize client instance for user
const getClient = (token, user) => {
    if (!clients[token]) {
        const client = new Client({
            puppeteer: {
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                ]
            },
        });

        client.on('qr', async (qr) => {
            const userDir = path.join(__dirname, 'uploads', token);
            await qrcode.toFile(path.join(userDir, 'qrcode.png'), qr);
            console.log(`QR Code saved for user ${user.username}`);
        });

        client.on('ready', async () => {
            console.log(`User ${user.username} logged in successfully`);
            await saveContactsToDatabase(client, user.db_path); // Pass user-specific DB path
        });

        client.on('disconnected', (reason) => {
            console.log(`Client disconnected for user ${user.username}: ${reason}`);
            delete clients[token]; // Remove client from the map on disconnect
        });

        client.initialize();
        clients[token] = client;
    }
    return clients[token];
};

// User registration endpoint
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;

    db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, row) => {
        if (err) {
            console.error('Error checking for existing user:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        if (row) {
            return res.status(409).json({ error: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const dbPath = `./users/contacts_${username}.db`;

        db.run(`INSERT INTO users (username, password, db_path) VALUES (?, ?, ?)`,
            [username, hashedPassword, dbPath], (insertErr) => {
                if (insertErr) {
                    console.error('Error inserting new user:', insertErr);
                    return res.status(500).json({ error: 'Database error' });
                }
                res.status(201).json({ message: 'User registered successfully' });
            });
    });
});

// User login endpoint
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, user) => {
        if (err) {
            console.error('Error retrieving user:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(403).json({ error: 'Invalid password' });
        }

        const token = jwt.sign({ username, db_path: user.db_path }, SECRET_KEY, { expiresIn: '1h' });
        getClient(token, user); // Initialize client for this user
        res.json({ token, message: 'Login successful' });
    });
});

// Function to save contacts to user's database
async function saveContactsToDatabase(client, userDbPath) {
    const contacts = await client.getContacts();
    const userDb = new sqlite3.Database(userDbPath);

    userDb.serialize(() => {
        userDb.run('BEGIN TRANSACTION');

        contacts.forEach((contact) => {
            const phoneNumber = contact.id._serialized || contact.id.user;
            const contactName = contact.name || 'Unknown';

            if (phoneNumber.endsWith('@c.us')) {
                const cleanPhoneNumber = phoneNumber.replace(/@c\.us$/, '');
                if (contactName && contactName !== 'Unknown') {
                    userDb.get(`SELECT id FROM contacts WHERE phone = ?`, [cleanPhoneNumber], (err, row) => {
                        if (!row) {
                            userDb.run(`INSERT INTO contacts (name, phone) VALUES (?, ?)`, [contactName, cleanPhoneNumber]);
                        }
                    });
                }
            }
        });

        userDb.run('COMMIT', (err) => {
            if (err) {
                console.error('Error committing the transaction:', err);
            } else {
                console.log('Transaction committed successfully for user database.');
            }
            userDb.close(); // Close the database after all operations are completed
        });
    });
}


app.get('/api/groups-data',authenticateUser, async (req, res) => {
    try {
        const groups = await fetchGroupsWithContactCount();
        res.json(groups); // Send the groups data as a JSON response
    } catch (error) {
        console.error('Error fetching groups:', error);
        res.status(500).json({ error: 'Failed to fetch groups' });
    }
});

// POST endpoint to update contact details in a group
app.post('/api/groups/:groupId/contacts/:contactId',authenticateUser, async (req, res) => {
    const { groupId, contactId } = req.params; // Extract groupId and contactId from URL params
    const { name, phone, custom_name } = req.body; // Extract the updated contact fields from the request body

    // Validate that at least one field is present for the update
    if (!name && !phone && !custom_name) {
        return res.status(400).json({ error: 'At least one field (name, phone, custom_name) must be provided for update' });
    }

    const db = new sqlite3.Database(process.env.DB_PATH || 'contacts.db');

    try {
        // Step 1: Check if the contact exists in the group
        const checkContactInGroup = `SELECT * FROM group_contacts WHERE group_id = ? AND contact_id = ?`;

        const row = await new Promise((resolve, reject) => {
            db.get(checkContactInGroup, [groupId, contactId], (err, row) => {
                if (err) {
                    console.error('Error checking contact in group:', err);
                    return reject(err);
                }
                resolve(row);
            });
        });

        if (!row) {
            // If the contact is not in the group, return an error
            return res.status(404).json({ error: 'Contact not found in the group' });
        }

        // Step 2: Update the contact's information if found
        let updateQuery = `UPDATE contacts SET `;
        const updateFields = [];
        const updateValues = [];

        // Dynamically add the fields to update based on the request body
        if (name) {
            updateFields.push('name = ?');
            updateValues.push(name);
        }
        if (phone) {
            updateFields.push('phone = ?');
            updateValues.push(phone);
        }
        if (custom_name) {
            updateFields.push('custom_name = ?');
            updateValues.push(custom_name);
        }

        updateQuery += updateFields.join(', ') + ` WHERE id = ?`;
        updateValues.push(contactId); // Add contactId at the end for the WHERE clause

        // Step 3: Execute the update query
        await new Promise((resolve, reject) => {
            db.run(updateQuery, updateValues, function (err) {
                if (err) {
                    console.error('Error updating contact:', err);
                    return reject(err);
                }
                resolve(this.changes); // this.changes gives the number of rows updated
            });
        });

        // Step 4: Return success response
        return res.status(200).json({ message: 'Contact updated successfully' });

    } catch (error) {
        console.error('Error in updating contact:', error);
        return res.status(500).json({ error: 'An error occurred while updating contact' });
    } finally {
        // Close the database connection after the operation is complete
        db.close();
    }
});
// Add contact to group API
app.post('/api/addtogroup', authenticateUser, (req, res) => {
    const { groupId, id } = req.body; // Extract groupId and contactId from the body
    const contact = { id }; // Create contact object from the body

    console.log('Received request to add contact to group:', { groupId, contact });

    try {
        // Step 1: Check if the contact exists in the contacts table
        db.get('SELECT id FROM contacts WHERE id = ?', [contact.id], (err, row) => {
            if (err) {
                console.error('Error querying contacts:', err);
                return res.status(500).json({ error: 'Database query failed' });
            }

            if (!row) {
                return res.status(404).json({ error: 'Contact not found' });
            }

            // Step 2: Insert contact into the group_contacts table
            db.run(
                `INSERT INTO group_contacts (group_id, contact_id) VALUES (?, ?)`,
                [groupId, contact.id],
                function (err) {
                    if (err) {
                        if (err.code === 'SQLITE_CONSTRAINT') {
                            return res.status(400).json({ error: 'Contact already added to this group' });
                        }
                        console.error('Error inserting contact into group:', err);
                        return res.status(500).json({ error: 'Failed to add contact to group' });
                    }

                    return res.json({ success: true, message: 'Contact added to group successfully' });
                }
            );
        });
    } catch (error) {
        console.error('Error adding contact to group:', error);
        return res.status(500).json({ error: 'Failed to add contact to group' });
    }
});
// POST route to receive the QR code from the client
app.post('/api/qr-code', authenticateUser, (req, res) => {
    const { qrCode } = req.body;

    if (!qrCode) {
        return res.status(400).json({ message: 'No QR code provided.' });
    }

    // Save the QR code in-memory (or you can store it in a database if needed)
    latestQrCode = qrCode;

    console.log('QR code received and stored in memory.');
    res.json({ message: 'QR code stored successfully.' });
});

// GET route to serve the latest QR code
// Serve the QR code image
app.get('/api/qr-code/:filename', authenticateUser, (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'uploads', filename); // Build the path to the image

    res.sendFile(filePath, (err) => {
        if (err) {
            console.error('Error sending file:', err);
            res.status(err.status).end();
        } else {
            console.log('Sent:', filename);
        }
    });
});

// Function to fetch contacts from the database
async function fetchContacts(groupId) {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(process.env.DB_PATH || 'contacts.db');
        const query = `
            SELECT c.id, c.name, c.phone, c.custom_name
            FROM contacts c
            INNER JOIN group_contacts gc ON c.id = gc.contact_id
            WHERE gc.group_id = ?
        `;
        
        db.all(query, [groupId], (err, contacts) => {
            db.close(); // Close the DB connection in the callback
            if (err) {
                return reject(new Error('Error fetching contacts'));
            }
            if (contacts.length === 0) {
                return resolve([]); // Return an empty array if no contacts found
            }
            resolve(contacts);
        });
    });
}




// Fetch contacts from the database
app.get('/api/contacts', authenticateUser, (req, res) => {
    const db = new sqlite3.Database(process.env.DB_PATH || 'contacts.db');
    db.all("SELECT id, name, phone, custom_name FROM contacts WHERE name IS NOT NULL AND name != 'Unknown'", [], (err, rows) => {
        if (err) return res.status(500).send(err);
        res.json(rows);
    });
});


// Create a new group and add contacts to it
app.post('/api/groups', authenticateUser, (req, res) => {
    const { name, contactIds } = req.body;

    // Validate input
    if (!name || !Array.isArray(contactIds) || contactIds.length === 0) {
        return res.status(400).send('Invalid input: Group name or contact IDs are missing.');
    }

    const db = new sqlite3.Database(process.env.DB_PATH || 'contacts.db');
    
    // Wrap the process in a transaction
    db.serialize(() => {
        db.run("BEGIN TRANSACTION"); // Start a transaction to ensure atomicity

        // Insert group into groups table
        db.run(`INSERT INTO groups (name) VALUES (?)`, [name], function(err) {
            if (err) {
                db.run("ROLLBACK"); // Rollback if error
                return res.status(500).send('Error inserting group: ' + err.message);
            }

            const groupId = this.lastID; // Get the new group's ID

            // Prepare placeholders for inserting contacts
            const placeholders = contactIds.map(() => '(?, ?)').join(', ');
            const sql = `INSERT INTO group_contacts (group_id, contact_id) VALUES ${placeholders}`;
            const params = contactIds.flatMap(contactId => [groupId, contactId]); // Flatten params for insertion

            // Insert contacts into group_contacts table
            db.run(sql, params, (err) => {
                if (err) {
                    db.run("ROLLBACK"); // Rollback if error
                    return res.status(500).send('Error inserting contacts into group: ' + err.message);
                }

                // Commit the transaction after successful insertions
                db.run("COMMIT", (commitErr) => {
                    if (commitErr) {
                        return res.status(500).send('Transaction commit error: ' + commitErr.message);
                    }

                    // Respond with the new group details
                    res.status(201).json({ id: groupId, name, contactIds });
                });
            });
        });
    });
});

// Fetch all groups from the database
app.get('/api/groups',authenticateUser, (req, res) => {
    const db = new sqlite3.Database(process.env.DB_PATH || 'contacts.db');
    db.all("SELECT id, name FROM groups", [], (err, rows) => {
        if (err) return res.status(500).send(err);
        res.json(rows);
    });
});

// Fetch contacts for a specific group
app.get('/api/groups/:groupId/contacts', authenticateUser, (req, res) => {
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
// Function to generate a random delay between message sends
function getRandomDelay(min = 3987, max = 7658) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}


// Function to send a WhatsApp message to a single contact
async function sendMessage(contactId, message) {
    try {
        const formattedContactId = `${contactId}@s.whatsapp.net`; // Formatting the contact ID
        const chat = await clientInstance.getChatById(formattedContactId); // Getting the chat by ID
        await chat.sendMessage(message); // Sending the message
        console.log(`Message sent to ${formattedContactId}`); // Log success
    } catch (error) {
        console.error(`Error sending message to ${contactId}:`, error); // Log error
        throw error; // Re-throw the error for handling in the caller function
    }
}

// API endpoint to send messages to multiple contacts with random delays
app.post('/api/send-message', authenticateUser, async (req, res) => {
    const { message, contactIds } = req.body;

    // Basic validation of the request body
    if (!message || !contactIds || contactIds.length === 0) {
        return res.status(400).send('Invalid input');
    }

    try {
        // Create an array of promises, each with a random delay
        const promises = contactIds.map(contactId => {
            return new Promise((resolve) => {
                setTimeout(async () => {
                    try {
                        await sendMessage(contactId, message); // Send message to each contact
                        resolve(); // Resolve when the message is sent successfully
                    } catch (error) {
                        resolve(); // Continue with other contacts even if one fails
                    }
                }, getRandomDelay()); // Random delay between messages
            });
        });

        // Wait for all promises to resolve
        await Promise.all(promises);

        // Send a success response after all messages are sent
        res.status(200).send('Messages sent successfully');
    } catch (error) {
        console.error('Error sending messages:', error);
        res.status(500).send('Error sending messages');
    }
});
// API endpoint to delete a group
app.delete('/api/groups/:groupId',authenticateUser, async (req, res) => {
    const { groupId } = req.params;
    const db = new sqlite3.Database(process.env.DB_PATH || 'contacts.db');

    db.serialize(() => {
        db.run(`DELETE FROM group_contacts WHERE group_id = ?`, [groupId], (err) => {
            if (err) {
                console.error('Error deleting contacts from group:', err);
                return res.status(500).json({ message: 'Error deleting contacts from group', error: err.message });
            }
        });

        db.run(`DELETE FROM groups WHERE id = ?`, [groupId], (err) => {
            if (err) {
                console.error('Error deleting group:', err);
                return res.status(500).json({ message: 'Error deleting group', error: err.message });
            }
            res.status(200).json({ message: 'Group deleted successfully' });
        });
    });

    db.close();
});

// API endpoint to remove contacts from a group
app.post('/api/removecontact',authenticateUser, async (req, res) => {
    const { groupId, contactIds } = req.body; // Retrieve groupId and contactIds from request
    const db = new sqlite3.Database(process.env.DB_PATH || 'contacts.db');

    // Prepare the SQL statement to delete contacts from the group
    const deleteContacts = db.prepare(`DELETE FROM group_contacts WHERE group_id = ? AND contact_id = ?`);

    db.serialize(() => {
        // If contactIds is not an array, wrap it into an array
        const idsToDelete = Array.isArray(contactIds) ? contactIds : [contactIds];
        
        idsToDelete.forEach(contactId => {
            deleteContacts.run(groupId, contactId, (err) => {
                if (err) {
                    console.error('Error removing contact from group:', err);
                    return res.status(500).json({ error: 'Failed to remove contact from group' });
                }
            });
        });

        deleteContacts.finalize(() => {
            res.status(200).json({ message: 'Contacts removed from group successfully' });
        });
    });

    db.close(); // Ensure the DB connection is closed after the operation
});



// Start the server
const startServer = () => {
    server.listen(PORT, () => {
        console.log(`localhost:${PORT}`);

    });
};
// Clear .env file before shutting down
process.on('SIGINT', () => {
    updateLoginStatus();
    console.log('Server shutting down, .env file cleared.');
    process.exit();
});



// Ensure that the server is started
startServer();
initializeDatabase();
getClient(); // Initialize WhatsApp client
