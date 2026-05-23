const express = require('express');
const { sendLog } = require('../services/logForwarder');
const router = express.Router();

// Admin routes - all should be protected
router.use((req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    const ip = req.ip || '127.0.0.1';
    sendLog({
      level: 'error',
      message: `Unauthorized access attempt to admin endpoint "${req.path}" from IP ${ip}`,
      ip_address: ip,
      username: req.headers['x-user'] || 'anonymous',
      endpoint: '/admin' + req.path,
      method: req.method,
      status_code: 403,
      metadata: { attempted_path: req.path }
    });
    return res.status(403).json({ success: false, message: 'Admin access denied. Authentication required.' });
  }
  // Minimal token validation for demo
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const [username] = decoded.split(':');
    req.adminUser = username;
    next();
  } catch (e) {
    return res.status(401).json({ success: false, message: 'Invalid token.' });
  }
});

// GET /admin/dashboard
router.get('/dashboard', (req, res) => {
  res.json({
    success: true,
    data: {
      totalAccounts: 4,
      totalBalance: 45500,
      recentTransactions: 128,
      systemStatus: 'operational'
    }
  });
});

// GET /admin/users
router.get('/users', (req, res) => {
  res.json({
    success: true,
    users: [
      { username: 'john.doe', account: 'ACC-001', balance: 15000, status: 'active' },
      { username: 'jane.smith', account: 'ACC-002', balance: 8500, status: 'active' },
      { username: 'bob.wilson', account: 'ACC-003', balance: 22000, status: 'active' }
    ]
  });
});

// POST /admin/users/:username/promote
router.post('/users/:username/promote', (req, res) => {
  const { username } = req.params;
  const { role } = req.body;
  const ip = req.ip || '127.0.0.1';

  sendLog({
    level: 'warn',
    message: `Privilege escalation attempt: User "${req.adminUser}" tried to promote "${username}" to role "${role}"`,
    ip_address: ip,
    username: req.adminUser,
    endpoint: `/admin/users/${username}/promote`,
    method: 'POST',
    status_code: 200,
    payload: { target_user: username, new_role: role, isAdmin: true, role: 'admin' },
    metadata: { privilege_escalation: true }
  });

  res.json({ success: true, message: `User ${username} promoted to ${role}` });
});

module.exports = router;
