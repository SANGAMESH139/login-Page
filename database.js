const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

class MockDatabase {
  constructor() {
    this.users = [];
    this.init();
  }

  init() {
    // Add one default user so you can log in immediately
    this.users.push({
      user_id: 1,
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      username: 'johndoe',
      password: bcrypt.hashSync('securepassword', 10), // A default password
      phone: '+1 234 567 890',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  }

  prepare(query) {
    return {
      get: (...args) => {
        if (query.includes('SELECT * FROM users WHERE email = ? OR username = ?')) {
          return this.users.find(u => u.email === args[0] || u.username === args[1]);
        }
        if (query.includes('SELECT user_id FROM users WHERE email = ? OR username = ?')) {
          const user = this.users.find(u => u.email === args[0] || u.username === args[1]);
          return user ? { user_id: user.user_id } : undefined;
        }
        if (query.includes('SELECT user_id, first_name, last_name, email, username, phone, created_at, updated_at FROM users WHERE user_id = ?')) {
          return this.users.find(u => u.user_id === args[0]);
        }
        return undefined;
      },
      run: (...args) => {
        if (query.includes('INSERT INTO users')) {
          const newUser = {
            user_id: this.users.length + 1,
            first_name: args[0],
            last_name: args[1],
            email: args[2],
            username: args[3],
            password: args[4],
            phone: args[5],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          this.users.push(newUser);
          return { lastInsertRowid: newUser.user_id };
        }
        if (query.includes('UPDATE users SET updated_at')) {
          const user = this.users.find(u => u.user_id === args[0]);
          if (user) user.updated_at = new Date().toISOString();
          return { changes: 1 };
        }
        return { lastInsertRowid: 0, changes: 0 };
      }
    };
  }
}

// In production (Vercel), we use the in-memory mock database because Serverless instances
// cannot reliably share or persist a SQLite file in /tmp across different requests.
// Locally, use better-sqlite3
if (process.env.NODE_ENV === 'production') {
  module.exports = new MockDatabase();
} else {
  const Database = require('better-sqlite3');
  const db = new Database(path.join(__dirname, 'users.db'));
  db.pragma('journal_mode = WAL');
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
}
