const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { query, queryOne, execute } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');
const config = require('../config/config');

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required.' });
    }

    const user = await queryOne('SELECT * FROM users WHERE username = $1 AND is_active = 1', [username]);

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ success: false, message: 'Invalid username or password.' });
    }

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRES_IN
    });

    execute('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]).catch(() => {});

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: { id: user.id, username: user.username, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error('[Auth] Login error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error: ' + err.message });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => {
  res.json({ success: true, user: req.user });
});

// POST /api/auth/users - Create new admin (super_admin only)
router.post('/users', authMiddleware, async (req, res) => {
  try {
    const SUPER_ADMINS = ['yash', 'shravani'];
    if (!SUPER_ADMINS.includes(req.user.username?.toLowerCase())) {
      return res.status(403).json({ success: false, message: 'Only super admins can create admin accounts.' });
    }

    const { username, password, email, role } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password required.' });
    }

    const existing = await queryOne('SELECT id FROM users WHERE username = $1', [username]);
    if (existing) {
      return res.status(409).json({ success: false, message: 'Username already exists.' });
    }

    const hash = bcrypt.hashSync(password, 10);
    const id = uuidv4();
    await execute(
      'INSERT INTO users (id, username, password, email, role, created_by) VALUES ($1, $2, $3, $4, $5, $6)',
      [id, username, hash, email || null, role || 'admin', req.user.username]
    );

    return res.status(201).json({ success: true, message: 'Admin account created successfully.', userId: id });
  } catch (err) {
    console.error('[Auth] Create user error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

// GET /api/auth/users
router.get('/users', authMiddleware, async (req, res) => {
  const users = await query('SELECT id, username, email, role, created_by, created_at, last_login, is_active FROM users ORDER BY created_at DESC');
  res.json({ success: true, users });
});

// PUT /api/auth/users/:id
router.put('/users/:id', authMiddleware, async (req, res) => {
  try {
    const { email, role, is_active, password } = req.body;
    const user = await queryOne('SELECT * FROM users WHERE id = $1', [req.params.id]);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const params = [email || user.email, role || user.role, is_active !== undefined ? is_active : user.is_active];
    let sql = 'UPDATE users SET email = $1, role = $2, is_active = $3';

    if (password) {
      sql += ', password = $4';
      params.push(bcrypt.hashSync(password, 10));
      sql += ` WHERE id = $${params.length + 1}`;
    } else {
      sql += ` WHERE id = $4`;
    }
    params.push(req.params.id);

    await execute(sql, params);
    return res.json({ success: true, message: 'User updated successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

// DELETE /api/auth/users/:id
router.delete('/users/:id', authMiddleware, async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account.' });
    }
    await execute('UPDATE users SET is_active = 0 WHERE id = $1', [req.params.id]);
    return res.json({ success: true, message: 'User deactivated successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

module.exports = router;
