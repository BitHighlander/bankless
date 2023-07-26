// Import required modules
const sqlite3 = require('sqlite3').verbose();

// Create a new SQLite database
const db = new sqlite3.Database('sessions.db');

// Create the sessions, capTable, and addressIndex tables if they don't exist
db.serialize(() => {
    db.run(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      data TEXT NOT NULL
    )
  `);

    db.run(`
    CREATE TABLE IF NOT EXISTS capTable (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      address TEXT NOT NULL,
      lpTokens REAL NOT NULL,
      percentage REAL NOT NULL
    )
  `);

    db.run(`
    CREATE TABLE IF NOT EXISTS addressIndex (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      address TEXT NOT NULL,
      \`sessionId\` TEXT NOT NULL
    )
  `);
});

// Function to store a session in the database
function storeSession(sessionId, sessionData) {
    return new Promise<void>((resolve, reject) => {
        db.run(
            'INSERT INTO sessions (session_id, data) VALUES (?, ?)',
            [sessionId, JSON.stringify(sessionData)],
            function (err) {
                if (err) {
                    console.error('Error storing session:', err.message);
                    reject(err);
                } else {
                    console.log('Session stored successfully with ID:', this.lastID);
                    resolve();
                }
            }
        );
    });
}

// Function to retrieve a session from the database
function getSession(sessionId) {
    return new Promise<any>((resolve, reject) => {
        db.get(
            'SELECT data FROM sessions WHERE session_id = ?',
            [sessionId],
            function (err, row) {
                if (err) {
                    console.error('Error retrieving session:', err.message);
                    reject(err);
                } else {
                    if (row) {
                        const sessionData = JSON.parse(row.data);
                        resolve(sessionData);
                    } else {
                        resolve(null);
                    }
                }
            }
        );
    });
}

// Function to add a capital entry to the capTable
function addCapitalEntry(address, lpTokens, percentage) {
    return new Promise<void>((resolve, reject) => {
        db.run(
            'INSERT INTO capTable (address, lpTokens, percentage) VALUES (?, ?, ?)',
            [address, lpTokens, percentage],
            function (err) {
                if (err) {
                    console.error('Error adding capital entry:', err.message);
                    reject(err);
                } else {
                    console.log('Capital entry added successfully with ID:', this.lastID);
                    resolve();
                }
            }
        );
    });
}

// Function to update a capital entry in the capTable
function updateCapitalEntry(entryId, lpTokens, percentage) {
    return new Promise<void>((resolve, reject) => {
        db.run(
            'UPDATE capTable SET lpTokens = ?, percentage = ? WHERE id = ?',
            [lpTokens, percentage, entryId],
            function (err) {
                if (err) {
                    console.error('Error updating capital entry:', err.message);
                    reject(err);
                } else {
                    if (this.changes > 0) {
                        console.log('Capital entry updated successfully');
                        resolve();
                    } else {
                        console.log('No capital entry found with ID:', entryId);
                        reject(new Error('No capital entry found'));
                    }
                }
            }
        );
    });
}

// Function to delete a capital entry from the capTable
function deleteCapitalEntry(entryId) {
    return new Promise<void>((resolve, reject) => {
        db.run('DELETE FROM capTable WHERE id = ?', [entryId], function (err) {
            if (err) {
                console.error('Error deleting capital entry:', err.message);
                reject(err);
            } else {
                if (this.changes > 0) {
                    console.log('Capital entry deleted successfully');
                    resolve();
                } else {
                    console.log('No capital entry found with ID:', entryId);
                    reject(new Error('No capital entry found'));
                }
            }
        });
    });
}

// Function to get all entries from the capTable
function getAllCapEntries() {
    return new Promise<any[]>((resolve, reject) => {
        db.all('SELECT * FROM capTable', function (err, rows) {
            if (err) {
                console.error('Error retrieving capital entries:', err.message);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

// Function to add a new address to the addressIndex with sessionId
function addNewAddress(address, sessionId) {
    return new Promise<void>((resolve, reject) => {
        db.run(
            'INSERT INTO addressIndex (address, `sessionId`) VALUES (?, ?)',
            [address, sessionId],
            function (err) {
                if (err) {
                    console.error('Error adding new address:', err.message);
                    reject(err);
                } else {
                    console.log('New address added successfully with ID:', this.lastID);
                    resolve();
                }
            }
        );
    });
}

// Function to get the next index from the addressIndex
function getNextIndex() {
    return new Promise<number>((resolve, reject) => {
        db.get(
            'SELECT id FROM addressIndex ORDER BY id DESC LIMIT 1',
            function (err, row) {
                if (err) {
                    console.error('Error retrieving next index:', err.message);
                    reject(err);
                } else {
                    if (row) {
                        resolve(row.id + 1);
                    } else {
                        resolve(1); // If no entries exist, start with index 1
                    }
                }
            }
        );
    });
}

// Export the functions
module.exports = {
    storeSession,
    getSession,
    addCapitalEntry,
    updateCapitalEntry,
    deleteCapitalEntry,
    getAllCapEntries,
    addNewAddress,
    getNextIndex,
};
