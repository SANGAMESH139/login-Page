const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { first_name, last_name, email, username, password, phone } = req.body;

  // Validation
  if (!first_name || !last_name || !email || !username || !password) {
    return res.status(400).json({ error: 'All required fields must be filled' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  // Check if user already exists
  const existingUser = db.prepare('SELECT user_id FROM users WHERE email = ? OR username = ?').get(email, username);
  if (existingUser) {
    return res.status(409).json({ error: 'Email or username already exists' });
  }

  // Hash password and insert user
  const hashedPassword = bcrypt.hashSync(password, 10);

  const stmt = db.prepare(
    'INSERT INTO users (first_name, last_name, email, username, password, phone) VALUES (?, ?, ?, ?, ?, ?)'
  );

  try {
    const result = stmt.run(first_name, last_name, email, username, hashedPassword, phone || null);
    res.status(201).json({ message: 'User registered successfully', user_id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { login, password } = req.body;

  if (!login || !password) {
    return res.status(400).json({ error: 'Username/email and password are required' });
  }

  // Find user by email or username
  const user = db.prepare('SELECT * FROM users WHERE email = ? OR username = ?').get(login, login);

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const validPassword = bcrypt.compareSync(password, user.password);
  if (!validPassword) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Generate JWT token
  const token = jwt.sign(
    { user_id: user.user_id, username: user.username, email: user.email },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  // Update updated_at
  db.prepare('UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE user_id = ?').run(user.user_id);

  res.json({
    message: 'Login successful',
    token,
    user: {
      user_id: user.user_id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      username: user.username,
      phone: user.phone,
    },
  });
});

// GET /api/auth/me - Get current user profile
router.get('/me', authenticateToken, (req, res) => {
  const user = db.prepare('SELECT user_id, first_name, last_name, email, username, phone, created_at, updated_at FROM users WHERE user_id = ?').get(req.user.user_id);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({ user });
});

module.exports = router;
