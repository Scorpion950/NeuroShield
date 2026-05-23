const express = require('express');
const { sendLog } = require('../services/logForwarder');
const router = express.Router();

const ATTACK_IPS = [
  '185.220.101.45', '94.102.49.190', '45.141.84.120',
  '185.107.56.33', '92.63.197.48', '162.247.74.74',
  '198.96.155.3', '199.249.230.87', '103.28.52.93', '91.108.4.44'
];

const ATTACK_USERNAMES = ['admin', 'root', 'administrator', 'john.doe', 'jane.smith', 'system', 'sa', 'postgres'];
const SQL_PAYLOADS = [
  "' OR 1=1 --",
  "'; DROP TABLE users; --",
  "' UNION SELECT username, password FROM users --",
  "admin'--",
  "1; EXEC xp_cmdshell('whoami')--",
  "' OR '1'='1'; SELECT * FROM accounts--"
];

const COUNTRIES = ['CN', 'RU', 'KP', 'IR', 'US', 'DE', 'IN'];

function randomFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randomIp() { return ATTACK_IPS[Math.floor(Math.random() * ATTACK_IPS.length)]; }
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

// POST /simulate/brute-force
router.post('/brute-force', async (req, res) => {
  const { attempts = 10, username = 'admin', interval_ms = 200 } = req.body;
  const ip = randomIp();
  const count = Math.min(parseInt(attempts), 50);

  res.json({ success: true, message: `Starting brute force simulation: ${count} attempts on "${username}"`, ip });

  // Run in background
  (async () => {
    for (let i = 0; i < count; i++) {
      await sendLog({
        level: 'warn',
        message: `Failed login attempt ${i + 1}/${count} for user "${username}" - Invalid credentials`,
        ip_address: ip,
        username,
        endpoint: '/auth/login',
        method: 'POST',
        status_code: 401,
        payload: { username, password: `attempt_${i + 1}` },
        metadata: { attempt_number: i + 1, attack_type: 'brute_force' }
      });
      await delay(parseInt(interval_ms));
    }
  })();
});

// POST /simulate/sql-injection
router.post('/sql-injection', async (req, res) => {
  const { target_endpoint = '/api/balance', count = 5 } = req.body;
  const ip = randomIp();
  const attackCount = Math.min(parseInt(count), 20);

  res.json({ success: true, message: `Simulating ${attackCount} SQL injection attempts on ${target_endpoint}`, ip });

  (async () => {
    for (let i = 0; i < attackCount; i++) {
      const payload = SQL_PAYLOADS[i % SQL_PAYLOADS.length];
      await sendLog({
        level: 'error',
        message: `SQL injection payload detected in request to ${target_endpoint}`,
        ip_address: ip,
        username: randomFrom(ATTACK_USERNAMES),
        endpoint: target_endpoint,
        method: 'POST',
        status_code: 400,
        payload: { account: payload, query: payload },
        metadata: { attack_type: 'sql_injection', payload_preview: payload.substring(0, 50) }
      });
      await delay(300);
    }
  })();
});

// POST /simulate/suspicious-login
router.post('/suspicious-login', async (req, res) => {
  const { username = 'john.doe', country = 'RU', count = 3 } = req.body;
  const ip = randomIp();
  const loginCount = Math.min(parseInt(count), 10);

  res.json({ success: true, message: `Simulating ${loginCount} suspicious logins for "${username}" from ${country}`, ip });

  (async () => {
    for (let i = 0; i < loginCount; i++) {
      await sendLog({
        level: 'warn',
        message: `Suspicious login for "${username}" from unusual location (${country})`,
        ip_address: ip,
        username,
        endpoint: '/auth/login',
        method: 'POST',
        status_code: 200,
        metadata: {
          country,
          new_device: true,
          new_location: true,
          vpn: Math.random() > 0.5,
          tor: Math.random() > 0.8
        }
      });
      await delay(500);
    }
  })();
});

// POST /simulate/api-abuse
router.post('/api-abuse', async (req, res) => {
  const { requests = 60, endpoint = '/api/transactions' } = req.body;
  const ip = randomIp();
  const reqCount = Math.min(parseInt(requests), 200);

  res.json({ success: true, message: `Simulating API abuse: ${reqCount} rapid requests to ${endpoint}`, ip });

  (async () => {
    for (let i = 0; i < reqCount; i++) {
      await sendLog({
        level: 'info',
        message: `API request ${i + 1}/${reqCount} to ${endpoint}`,
        ip_address: ip,
        username: 'bot_user',
        endpoint,
        method: 'GET',
        status_code: 200,
        metadata: { request_index: i + 1, automated: true }
      });
      await delay(50);
    }
  })();
});

// POST /simulate/unauthorized-admin
router.post('/unauthorized-admin', async (req, res) => {
  const { username = 'john.doe', count = 5 } = req.body;
  const ip = randomIp();
  const adminPaths = ['/admin/dashboard', '/admin/users', '/admin/settings', '/admin/logs', '/management/panel'];
  const attemptCount = Math.min(parseInt(count), 15);

  res.json({ success: true, message: `Simulating ${attemptCount} unauthorized admin access attempts for "${username}"`, ip });

  (async () => {
    for (let i = 0; i < attemptCount; i++) {
      const path = adminPaths[i % adminPaths.length];
      await sendLog({
        level: 'error',
        message: `Unauthorized admin access attempt to "${path}" by user "${username}"`,
        ip_address: ip,
        username,
        endpoint: path,
        method: 'GET',
        status_code: 403,
        metadata: { access_denied: true, attempted_resource: path }
      });
      await delay(400);
    }
  })();
});

// POST /simulate/privilege-escalation
router.post('/privilege-escalation', async (req, res) => {
  const { username = 'bob.wilson' } = req.body;
  const ip = randomIp();

  res.json({ success: true, message: `Simulating privilege escalation attempt by "${username}"`, ip });

  (async () => {
    const escalationPayloads = [
      { role: 'admin', isAdmin: true, username },
      { user_type: 'admin', escalate: true, grant_admin: 1 },
      { sudo: true, promote: 'superadmin', role: 'superadmin' },
      { change_role: 'admin', admin: '1', privilege: 'escalate' }
    ];
    for (const payload of escalationPayloads) {
      await sendLog({
        level: 'critical',
        message: `Privilege escalation attempt by user "${username}" - attempting to gain admin access`,
        ip_address: ip,
        username,
        endpoint: '/api/users/profile',
        method: 'PUT',
        status_code: 403,
        payload,
        metadata: { privilege_escalation: true, target_role: 'admin' }
      });
      await delay(300);
    }
  })();
});

// POST /simulate/abnormal-behavior
router.post('/abnormal-behavior', async (req, res) => {
  const { username = 'jane.smith', requests = 40 } = req.body;
  const ips = [randomIp(), randomIp(), randomIp()];
  const endpoints = ['/api/balance', '/api/transactions', '/api/transfer', '/admin', '/api/accounts', '/api/loans'];
  const reqCount = Math.min(parseInt(requests), 60);

  res.json({ success: true, message: `Simulating abnormal behavior for "${username}": ${reqCount} requests from multiple IPs`, ips });

  (async () => {
    for (let i = 0; i < reqCount; i++) {
      await sendLog({
        level: 'info',
        message: `Abnormal access pattern: User "${username}" accessing multiple endpoints rapidly`,
        ip_address: ips[i % ips.length],
        username,
        endpoint: endpoints[i % endpoints.length],
        method: i % 3 === 0 ? 'POST' : 'GET',
        status_code: 200,
        metadata: { after_hours: true, multiple_locations: true, automated_pattern: true }
      });
      await delay(100);
    }
  })();
});

// POST /simulate/credential-stuffing
router.post('/credential-stuffing', async (req, res) => {
  const { count = 20 } = req.body;
  const stuffCount = Math.min(parseInt(count), 50);

  res.json({ success: true, message: `Simulating credential stuffing: ${stuffCount} attempts from different IPs` });

  (async () => {
    for (let i = 0; i < stuffCount; i++) {
      const ip = ATTACK_IPS[i % ATTACK_IPS.length];
      const username = ATTACK_USERNAMES[i % ATTACK_USERNAMES.length];
      await sendLog({
        level: 'warn',
        message: `Credential stuffing attempt for user "${username}" from IP ${ip}`,
        ip_address: ip,
        username,
        endpoint: '/auth/login',
        method: 'POST',
        status_code: 401,
        payload: { username, password: `leaked_pass_${i}` },
        metadata: { credential_stuffing: true, from_breach_db: true }
      });
      await delay(200);
    }
  })();
});

// POST /simulate/all - Run all attack scenarios
router.post('/all', async (req, res) => {
  res.json({ success: true, message: 'Starting comprehensive attack simulation - all scenarios will run sequentially' });

  (async () => {
    // Small delay between attack types
    const scenarios = [
      { type: 'brute-force', fn: () => fetch(`http://localhost:${process.env.PORT || 5001}/simulate/brute-force`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ attempts: 8 }) }) },
    ];

    // Direct simulation instead of calling own endpoints
    const runBrute = async () => {
      const ip = randomIp(); const user = 'admin';
      for (let i = 0; i < 8; i++) {
        await sendLog({ level: 'warn', message: `Failed login attempt ${i + 1} for "${user}"`, ip_address: ip, username: user, endpoint: '/auth/login', method: 'POST', status_code: 401, payload: { username: user } });
        await delay(150);
      }
    };
    const runSQLi = async () => {
      const ip = randomIp();
      for (let i = 0; i < 3; i++) {
        await sendLog({ level: 'error', message: 'SQL injection attempt on /api/balance', ip_address: ip, username: 'anonymous', endpoint: '/api/balance', method: 'GET', status_code: 400, payload: { account: SQL_PAYLOADS[i] } });
        await delay(300);
      }
    };
    const runPrivEsc = async () => {
      const ip = randomIp(); const user = 'bob.wilson';
      await sendLog({ level: 'critical', message: `Privilege escalation by "${user}"`, ip_address: ip, username: user, endpoint: '/api/users/profile', method: 'PUT', status_code: 403, payload: { role: 'admin', isAdmin: true } });
    };
    const runSuspLogin = async () => {
      const ip = randomIp();
      await sendLog({ level: 'warn', message: 'Suspicious login from CN', ip_address: ip, username: 'john.doe', endpoint: '/auth/login', method: 'POST', status_code: 200, metadata: { country: 'CN', new_device: true, tor: true } });
    };

    await runBrute();
    await delay(1000);
    await runSQLi();
    await delay(1000);
    await runPrivEsc();
    await delay(1000);
    await runSuspLogin();
  })();
});

module.exports = router;
