const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../data/bsciam.db');
const DB_DIR = path.dirname(DB_PATH);

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

/**
 * Initialize the database and create tables if they don't exist
 */
function initDatabase() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Error opening database:', err);
        return reject(err);
      }
      console.log('📦 Connected to SQLite database');
    });

    // Create files table
    const createFilesTable = `
      CREATE TABLE IF NOT EXISTS files (
        id TEXT PRIMARY KEY,
        wallet_address TEXT NOT NULL,
        encrypted_data TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        size INTEGER NOT NULL,
        uploaded_at TEXT NOT NULL,
        metadata TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (wallet_address) REFERENCES users(wallet_address)
      )
    `;

    // Create users table (for reference, if needed)
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        wallet_address TEXT PRIMARY KEY,
        username TEXT,
        email TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create index for faster queries
    const createIndex = `
      CREATE INDEX IF NOT EXISTS idx_wallet_address ON files(wallet_address)
    `;

    db.serialize(() => {
      db.run(createUsersTable, (err) => {
        if (err) {
          console.error('Error creating users table:', err);
          return reject(err);
        }
      });

      db.run(createFilesTable, (err) => {
        if (err) {
          console.error('Error creating files table:', err);
          return reject(err);
        }
        console.log('✅ Files table ready');
      });

      db.run(createIndex, (err) => {
        if (err) {
          console.error('Error creating index:', err);
          return reject(err);
        }
        console.log('✅ Database indexes created');
      });

      db.close((err) => {
        if (err) {
          console.error('Error closing database:', err);
          return reject(err);
        }
        console.log('✅ Database initialization complete');
        resolve();
      });
    });
  });
}

/**
 * Get database connection
 */
function getDatabase() {
  return new sqlite3.Database(DB_PATH);
}

module.exports = {
  initDatabase,
  getDatabase,
  DB_PATH
};

