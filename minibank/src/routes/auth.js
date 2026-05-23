const express = require('express');
const { sendLog } = require('../services/logForwarder');
const router = express.Router();

// Fake user database
const USERS = {
  'john.doe': { password: 'password123', role: 'user', balance: 15000, account: 'ACC-001' },
  'jane.smith': { password: 'securepass', role: 'user', balance: 8500, account: 'ACC-002' },
  'admin': { password: 'admin@minibank', role: 'admin', balance: 0, account: 'ACC-ADMIN' },
  'bob.wilson': { password: 'bob1234', role: 'user', balance: 22000, account: 'ACC-003' }
};

// POST /auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const ip = req.ip || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || '';

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password required.' });
  }

  const user = USERS[username];

  if (!user || user.password !== password) {
    // Failed login - send to NeuroShield
    await sendLog({
      level: 'warn',
      message: `Failed login attempt for user "${username}" from IP ${ip}`,
      ip_address: ip,
      username,
      endpoint: '/auth/login',
      method: 'POST',
      status_code: 401,
      payload: { username },
      metadata: { user_agent: userAgent }
    });
    return res.status(401).json({ success: false, message: 'Invalid credentials.' });
  }

  // Successful login
  const token = Buffer.from(`${username}:${Date.now()}`).toString('base64');
  await sendLog({
    level: 'info',
    message: `Successful login for user "${username}" from IP ${ip}`,
    ip_address: ip,
    username,
    endpoint: '/auth/login',
    method: 'POST',
    status_code: 200,
    metadata: {
      user_agent: userAgent,
      role: user.role,
      new_device: Math.random() > 0.7,
      new_location: Math.random() > 0.8
    }
  });

  return res.json({
    success: true,
    message: 'Login successful',
    token,
    user: { username, role: user.role, account: user.account }
  });
});

// POST /auth/logout
router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully.' });
});

module.exports = router;
