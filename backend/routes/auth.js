const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

function issueToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

// POST /api/auth/signup  { name, contact, password, role }
router.post('/signup', (req, res) => {
  const { password, role } = req.body || {};
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  const contact = typeof req.body?.contact === 'string' ? req.body.contact.trim() : '';
  if (!name || !contact || typeof password !== 'string' || !password || !role) {
    return res.status(400).json({ error: 'name, contact, password and role are required' });
  }
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
  if (!['public', 'dept'].includes(role)) {
    return res.status(400).json({ error: 'role must be "public" or "dept"' });
  }
  const existing = db.prepare('SELECT id FROM users WHERE contact = ?').get(contact);
  if (existing) return res.status(409).json({ error: 'An account with this contact already exists' });

  const password_hash = bcrypt.hashSync(password, 10);
  const info = db
    .prepare('INSERT INTO users (name, contact, password_hash, role) VALUES (?, ?, ?, ?)')
    .run(name, contact, password_hash, role);

  const user = { id: info.lastInsertRowid, name, role };
  res.status(201).json({ token: issueToken(user), user });
});

// POST /api/auth/login  { contact, password }
router.post('/login', (req, res) => {
  const { password } = req.body || {};
  const contact = typeof req.body?.contact === 'string' ? req.body.contact.trim() : '';
  if (!contact || typeof password !== 'string' || !password) return res.status(400).json({ error: 'contact and password are required' });

  const row = db.prepare('SELECT * FROM users WHERE contact = ?').get(contact);
  if (!row || !bcrypt.compareSync(password, row.password_hash)) {
    return res.status(401).json({ error: 'Invalid contact or password' });
  }
  const user = { id: row.id, name: row.name, role: row.role };
  res.json({ token: issueToken(user), user });
});

module.exports = router;
