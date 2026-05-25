const express = require('express');
const { ingestLog } = require('../services/threatDetection');
const router = express.Router();

// MiniBank fake user database
const USERS = {
  'john.doe':  { password: 'password123', role: 'user',  balance: 15000, account: 'ACC-001' },
  'jane.smith':{ password: 'securepass',  role: 'user',  balance: 8500,  account: 'ACC-002' },
  'admin':     { password: 'admin@minibank', role: 'admin', balance: 0,   account: 'ACC-ADMIN' },
  'bob.wilson':{ password: 'bob1234',     role: 'user',  balance: 22000, account: 'ACC-003' }
};

const MINIBANK_APP = { id: 'app-minibank-001', name: 'MiniBank' };

const ATTACK_IPS = [
  '185.220.101.45','94.102.49.190','45.141.84.120',
  '185.107.56.33','92.63.197.48','162.247.74.74',
  '198.96.155.3','199.249.230.87','103.28.52.93','91.108.4.44'
];
const ATTACK_USERNAMES = ['admin','root','administrator','john.doe','jane.smith','system','sa','postgres'];
const SQL_PAYLOADS = [
  "' OR 1=1 --","'; DROP TABLE users; --",
  "' UNION SELECT username, password FROM users --",
  "admin'--","1; EXEC xp_cmdshell('whoami')--"
];

function randomFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomIp() { return ATTACK_IPS[Math.floor(Math.random() * ATTACK_IPS.length)]; }
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

// ─── AUTH ───────────────────────────────────────────────────────────────
// POST /api/minibank/auth/login
router.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const ip = req.ip || '::1';
  const userAgent = req.headers['user-agent'] || '';

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password required.' });
  }

  const user = USERS[username];
  if (!user || user.password !== password) {
    await ingestLog({
      level: 'warn',
      message: `Failed login attempt for user "${username}"`,
      ip_address: ip, username,
      endpoint: '/auth/login', method: 'POST', status_code: 401,
      payload: { username }, metadata: { user_agent: userAgent }
    }, MINIBANK_APP);
    return res.status(401).json({ success: false, message: 'Invalid credentials.' });
  }

  const token = Buffer.from(`${username}:${Date.now()}`).toString('base64');
  await ingestLog({
    level: 'info',
    message: `Successful login for user "${username}"`,
    ip_address: ip, username,
    endpoint: '/auth/login', method: 'POST', status_code: 200,
    metadata: { user_agent: userAgent, role: user.role }
  }, MINIBANK_APP);

  return res.json({
    success: true, message: 'Login successful', token,
    user: { username, role: user.role, account: user.account, balance: user.balance }
  });
});

// POST /api/minibank/auth/logout
router.post('/auth/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully.' });
});

// ─── BANKING API ─────────────────────────────────────────────────────────
// GET /api/minibank/balance
router.get('/balance', (req, res) => {
  const { account } = req.query;
  const ip = req.ip || '::1';

  if (account && /('|"|;|--|UNION|SELECT|DROP|OR\s+1=1)/i.test(account)) {
    ingestLog({
      level: 'error',
      message: `SQL injection attempt in /balance from IP ${ip}`,
      ip_address: ip, username: req.headers['x-user'] || 'anonymous',
      endpoint: '/api/balance', method: 'GET', status_code: 400,
      payload: { account }, metadata: { injection_detected: true }
    }, MINIBANK_APP).catch(() => {});
    return res.status(400).json({ success: false, message: 'Invalid account parameter.' });
  }

  res.json({ success: true, balance: 15000, account: account || 'ACC-001', currency: 'USD' });
});

// POST /api/minibank/transfer
router.post('/transfer', (req, res) => {
  const { from, to, amount, memo } = req.body;
  const ip = req.ip || '::1';
  const payloadStr = JSON.stringify({ from, to, amount, memo });

  if (/('|"|;|--|UNION|SELECT|DROP|INSERT|DELETE|UPDATE)/i.test(payloadStr)) {
    ingestLog({
      level: 'error',
      message: `SQL injection in transfer endpoint from IP ${ip}`,
      ip_address: ip, username: req.headers['x-user'] || 'anonymous',
      endpoint: '/api/transfer', method: 'POST', status_code: 400,
      payload: req.body, metadata: { sql_injection: true }
    }, MINIBANK_APP).catch(() => {});
    return res.status(400).json({ success: false, message: 'Invalid transfer data.' });
  }

  res.json({ success: true, transactionId: 'TXN-' + Date.now(), amount, status: 'completed' });
});

// GET /api/minibank/transactions
router.get('/transactions', (req, res) => {
  res.json({
    success: true,
    transactions: [
      { id: 'TXN-001', type: 'credit', amount: 5000, description: 'Salary', date: new Date(Date.now() - 86400000).toISOString() },
      { id: 'TXN-002', type: 'debit',  amount: 200,  description: 'Utility Bill', date: new Date(Date.now() - 3600000).toISOString() },
      { id: 'TXN-003', type: 'credit', amount: 1500, description: 'Freelance', date: new Date().toISOString() },
    ]
  });
});

// ─── ATTACK SIMULATIONS ───────────────────────────────────────────────────
// POST /api/minibank/simulate/brute-force
router.post('/simulate/brute-force', async (req, res) => {
  const { attempts = 10, username = 'admin', interval_ms = 200 } = req.body;
  const ip = randomIp();
  const count = Math.min(parseInt(attempts), 50);

  res.json({ success: true, message: `Starting brute force: ${count} attempts on "${username}"`, ip });

  (async () => {
    for (let i = 0; i < count; i++) {
      await ingestLog({
        level: 'warn',
        message: `Failed login attempt ${i + 1}/${count} for "${username}"`,
        ip_address: ip, username,
        endpoint: '/auth/login', method: 'POST', status_code: 401,
        payload: { username, password: `attempt_${i + 1}` },
        metadata: { attempt_number: i + 1, attack_type: 'brute_force' }
      }, MINIBANK_APP);
      await delay(parseInt(interval_ms));
    }
  })();
});

// POST /api/minibank/simulate/sql-injection
router.post('/simulate/sql-injection', async (req, res) => {
  const { target_endpoint = '/api/balance', count = 5 } = req.body;
  const ip = randomIp();
  const attackCount = Math.min(parseInt(count), 20);

  res.json({ success: true, message: `Simulating ${attackCount} SQL injection attempts on ${target_endpoint}`, ip });

  (async () => {
    for (let i = 0; i < attackCount; i++) {
      const payload = SQL_PAYLOADS[i % SQL_PAYLOADS.length];
      await ingestLog({
        level: 'error',
        message: `SQL injection payload in request to ${target_endpoint}`,
        ip_address: ip, username: randomFrom(ATTACK_USERNAMES),
        endpoint: target_endpoint, method: 'POST', status_code: 400,
        payload: { account: payload }, metadata: { attack_type: 'sql_injection', payload_preview: payload.substring(0, 50) }
      }, MINIBANK_APP);
      await delay(300);
    }
  })();
});

// POST /api/minibank/simulate/suspicious-login
router.post('/simulate/suspicious-login', async (req, res) => {
  const { username = 'john.doe', country = 'RU', count = 3 } = req.body;
  const ip = randomIp();
  const loginCount = Math.min(parseInt(count), 10);

  res.json({ success: true, message: `Simulating ${loginCount} suspicious logins for "${username}" from ${country}`, ip });

  (async () => {
    for (let i = 0; i < loginCount; i++) {
      await ingestLog({
        level: 'warn',
        message: `Suspicious login for "${username}" from ${country}`,
        ip_address: ip, username,
        endpoint: '/auth/login', method: 'POST', status_code: 200,
        metadata: { country, new_device: true, new_location: true, vpn: Math.random() > 0.5, tor: Math.random() > 0.8 }
      }, MINIBANK_APP);
      await delay(500);
    }
  })();
});

// POST /api/minibank/simulate/api-abuse
router.post('/simulate/api-abuse', async (req, res) => {
  const { requests = 60, endpoint = '/api/transactions' } = req.body;
  const ip = randomIp();
  const reqCount = Math.min(parseInt(requests), 200);

  res.json({ success: true, message: `Simulating API abuse: ${reqCount} requests to ${endpoint}`, ip });

  (async () => {
    for (let i = 0; i < reqCount; i++) {
      await ingestLog({
        level: 'info',
        message: `API request ${i + 1}/${reqCount} to ${endpoint}`,
        ip_address: ip, username: 'bot_user',
        endpoint, method: 'GET', status_code: 200,
        metadata: { request_index: i + 1, automated: true }
      }, MINIBANK_APP);
      await delay(50);
    }
  })();
});

// POST /api/minibank/simulate/unauthorized-admin
router.post('/simulate/unauthorized-admin', async (req, res) => {
  const { username = 'john.doe', count = 5 } = req.body;
  const ip = randomIp();
  const adminPaths = ['/admin/dashboard','/admin/users','/admin/settings','/admin/logs','/management/panel'];
  const attemptCount = Math.min(parseInt(count), 15);

  res.json({ success: true, message: `Simulating ${attemptCount} unauthorized admin access attempts for "${username}"`, ip });

  (async () => {
    for (let i = 0; i < attemptCount; i++) {
      const adminPath = adminPaths[i % adminPaths.length];
      await ingestLog({
        level: 'error',
        message: `Unauthorized admin access attempt to "${adminPath}" by "${username}"`,
        ip_address: ip, username,
        endpoint: adminPath, method: 'GET', status_code: 403,
        metadata: { access_denied: true }
      }, MINIBANK_APP);
      await delay(400);
    }
  })();
});

// POST /api/minibank/simulate/privilege-escalation
router.post('/simulate/privilege-escalation', async (req, res) => {
  const { username = 'bob.wilson' } = req.body;
  const ip = randomIp();

  res.json({ success: true, message: `Simulating privilege escalation by "${username}"`, ip });

  (async () => {
    const escalationPayloads = [
      { role: 'admin', isAdmin: true, username },
      { user_type: 'admin', escalate: true, grant_admin: 1 },
      { sudo: true, promote: 'superadmin', role: 'superadmin' },
      { change_role: 'admin', admin: '1', privilege: 'escalate' }
    ];
    for (const payload of escalationPayloads) {
      await ingestLog({
        level: 'critical',
        message: `Privilege escalation attempt by "${username}"`,
        ip_address: ip, username,
        endpoint: '/api/users/profile', method: 'PUT', status_code: 403,
        payload, metadata: { privilege_escalation: true, target_role: 'admin' }
      }, MINIBANK_APP);
      await delay(300);
    }
  })();
});

// POST /api/minibank/simulate/abnormal-behavior
router.post('/simulate/abnormal-behavior', async (req, res) => {
  const { username = 'jane.smith', requests = 40 } = req.body;
  const ips = [randomIp(), randomIp(), randomIp()];
  const endpoints = ['/api/balance','/api/transactions','/api/transfer','/admin','/api/accounts','/api/loans'];
  const reqCount = Math.min(parseInt(requests), 60);

  res.json({ success: true, message: `Simulating abnormal behavior for "${username}": ${reqCount} requests from multiple IPs`, ips });

  (async () => {
    for (let i = 0; i < reqCount; i++) {
      await ingestLog({
        level: 'info',
        message: `Abnormal access: "${username}" accessing multiple endpoints`,
        ip_address: ips[i % ips.length], username,
        endpoint: endpoints[i % endpoints.length], method: i % 3 === 0 ? 'POST' : 'GET', status_code: 200,
        metadata: { after_hours: true, multiple_locations: true, automated_pattern: true }
      }, MINIBANK_APP);
      await delay(100);
    }
  })();
});

// POST /api/minibank/simulate/all
router.post('/simulate/all', async (req, res) => {
  res.json({ success: true, message: 'Starting comprehensive attack simulation — all scenarios running sequentially' });
  (async () => {
    const ip = randomIp();
    for (let i = 0; i < 8; i++) {
      await ingestLog({ level: 'warn', message: `Brute force attempt ${i+1}`, ip_address: ip, username: 'admin', endpoint: '/auth/login', method: 'POST', status_code: 401, payload: { username: 'admin' } }, MINIBANK_APP);
      await delay(150);
    }
    await delay(1000);
    for (let i = 0; i < 3; i++) {
      await ingestLog({ level: 'error', message: 'SQL injection attempt', ip_address: randomIp(), username: 'anonymous', endpoint: '/api/balance', method: 'GET', status_code: 400, payload: { account: SQL_PAYLOADS[i] } }, MINIBANK_APP);
      await delay(300);
    }
    await delay(1000);
    await ingestLog({ level: 'critical', message: 'Privilege escalation by bob.wilson', ip_address: randomIp(), username: 'bob.wilson', endpoint: '/api/users/profile', method: 'PUT', status_code: 403, payload: { role: 'admin', isAdmin: true } }, MINIBANK_APP);
    await delay(1000);
    await ingestLog({ level: 'warn', message: 'Suspicious login from CN', ip_address: randomIp(), username: 'john.doe', endpoint: '/auth/login', method: 'POST', status_code: 200, metadata: { country: 'CN', new_device: true, tor: true } }, MINIBANK_APP);
  })();
});

module.exports = router;
