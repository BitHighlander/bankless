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
      session_index INTEGER NOT NULL,
      time DATE NOT NULL,
      type TEXT NOT NULL,
      depositAddress TEXT,
      address TEXT,
      txid TEXT,
      status TEXT,
      amountIn REAL,
      amountOut REAL,
      percentage REAL,
      SESSION_FUNDING_USD REAL,
      SESSION_FUNDING_DAI REAL,
      SESSION_FULFILLED INTEGER DEFAULT 0
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

function storeSession(sessionId, sessionData) {
    return new Promise<void>((resolve, reject) => {
        // Check if sessionData.session_index is provided, otherwise set a default value
        const sessionIndex = sessionData.session_index !== undefined ? sessionData.session_index : 0;
        if(!sessionData.time) sessionData.time = new Date().getTime()
        db.run(
            'INSERT INTO sessions (session_id, session_index, time, type, depositAddress, address, txid, status, amountIn, amountOut, percentage, SESSION_FUNDING_USD, SESSION_FUNDING_DAI, SESSION_FULFILLED) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                sessionId,
                sessionIndex,
                sessionData.time,
                sessionData.type,
                sessionData.depositAddress,
                sessionData.address,
                sessionData.txid,
                sessionData.status,
                sessionData.amountIn,
                sessionData.amountOut,
                sessionData.percentage,
                sessionData.SESSION_FUNDING_USD,
                sessionData.SESSION_FUNDING_DAI,
                sessionData.SESSION_FULFILLED ? 1 : 0,
            ],
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
            'SELECT * FROM sessions WHERE session_id = ?',
            [sessionId],
            function (err, row) {
                if (err) {
                    console.error('Error retrieving session:', err.message);
                    reject(err);
                } else {
                    if (row) {
                        resolve(row);
                    } else {
                        resolve(null);
                    }
                }
            }
        );
    });
}

// Function to update a session in the database
function updateSession(sessionId, sessionData) {
    return new Promise<void>((resolve, reject) => {
        db.run(
            'UPDATE sessions SET session_index = ?, time = ?, type = ?, address = ?, txid = ?, status = ?, amountIn = ?, amountOut = ?, percentage = ?, SESSION_FUNDING_USD = ?, SESSION_FUNDING_DAI = ?, SESSION_FULFILLED = ? WHERE session_id = ?',
            [
                sessionData.session_index,
                sessionData.time,
                sessionData.type,
                sessionData.address,
                sessionData.txid,
                sessionData.status,
                sessionData.amountIn,
                sessionData.amountOut,
                sessionData.percentage,
                sessionData.SESSION_FUNDING_USD,
                sessionData.SESSION_FUNDING_DAI,
                sessionData.SESSION_FULFILLED ? 1 : 0,
                sessionId,
            ],
            function (err) {
                if (err) {
                    console.error('Error updating session:', err.message);
                    reject(err);
                } else {
                    if (this.changes > 0) {
                        console.log('Session updated successfully');
                        resolve();
                    } else {
                        console.log('No session found with ID:', sessionId);
                        reject(new Error('No session found'));
                    }
                }
            }
        );
    });
}

// Function to delete a session from the database
function deleteSession(sessionId) {
    return new Promise<void>((resolve, reject) => {
        db.run('DELETE FROM sessions WHERE session_id = ?', [sessionId], function (err) {
            if (err) {
                console.error('Error deleting session:', err.message);
                reject(err);
            } else {
                if (this.changes > 0) {
                    console.log('Session deleted successfully');
                    resolve();
                } else {
                    console.log('No session found with ID:', sessionId);
                    reject(new Error('No session found'));
                }
            }
        });
    });
}

// Function to get all sessions from the database with pagination
function getAllSessions(limit, skip) {
    return new Promise<any[]>((resolve, reject) => {
        db.all(
            'SELECT * FROM sessions LIMIT ? OFFSET ?',
            [limit, skip],
            function (err, rows) {
                if (err) {
                    console.error('Error retrieving sessions:', err.message);
                    reject(err);
                } else {
                    resolve(rows);
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

function getSessionByAddressOwner(address) {
    return new Promise<any>((resolve, reject) => {
        db.get(
            'SELECT * FROM sessions WHERE address = ?',
            [address],
            function (err, row) {
                if (err) {
                    console.error('Error retrieving session by address:', err.message);
                    reject(err);
                } else {
                    if (row) {
                        resolve(row);
                    } else {
                        resolve(null);
                    }
                }
            }
        );
    });
}

function getSessionByAddressDeposit(address) {
    return new Promise<any>((resolve, reject) => {
        db.get(
            'SELECT * FROM sessions WHERE depositAddress = ?',
            [address],
            function (err, row) {
                if (err) {
                    console.error('Error retrieving session by address:', err.message);
                    reject(err);
                } else {
                    if (row) {
                        resolve(row);
                    } else {
                        resolve(null);
                    }
                }
            }
        );
    });
}

// Export the functions
module.exports = {
    storeSession,
    getSessionByAddressDeposit,
    getSessionByAddressOwner,
    getSession,
    updateSession,
    deleteSession,
    getAllSessions,
    addCapitalEntry,
    updateCapitalEntry,
    deleteCapitalEntry,
    getAllCapEntries,
    addNewAddress,
    getNextIndex,
};
