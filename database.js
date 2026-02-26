const Database = require('better-sqlite3');
const path = require('path');

const fs = require('fs');

// Use /tmp for Vercel serverless environment since it's the only writable directory
let dbPath;
if (process.env.NODE_ENV === 'production') {
  dbPath = path.join('/tmp', 'users.db');
  // Copy the initial database over to /tmp if it doesn't exist yet
  if (!fs.existsSync(dbPath)) {
    const initialDbPath = path.join(__dirname, 'users.db');
    if (fs.existsSync(initialDbPath)) {
      fs.copyFileSync(initialDbPath, dbPath);
    }
  }
} else {
  dbPath = path.join(__dirname, 'users.db');
}

const db = new Database(dbPath);

// Disable WAL mode for Vercel serverless environment because WAL creates
// users.db-wal and users.db-shm files, which are not copied to /tmp in the
// fs.copyFileSync block above, leading to corrupted or missing data on cold starts.
if (process.env.NODE_ENV !== 'production') {
  db.pragma('journal_mode = WAL');
}

// Create users table
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

module.exports = db;
