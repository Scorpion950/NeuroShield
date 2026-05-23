const express = require('express');
const { sendLog } = require('../services/logForwarder');
const router = express.Router();

// GET /api/balance
router.get('/balance', (req, res) => {
  const ip = req.ip || '127.0.0.1';
  const { account } = req.query;

  // Check for SQL injection in query params
  if (account && /('|"|;|--|UNION|SELECT|DROP|OR\s+1=1)/i.test(account)) {
    sendLog({
      level: 'error',
      message: `SQL injection attempt detected in /api/balance from IP ${ip}`,
      ip_address: ip,
      username: req.headers['x-user'] || 'anonymous',
      endpoint: '/api/balance',
      method: 'GET',
      status_code: 400,
      payload: { account },
      metadata: { injection_detected: true }
    });
    return res.status(400).json({ success: false, message: 'Invalid account parameter.' });
  }

  res.json({ success: true, balance: 15000, account: account || 'ACC-001', currency: 'USD' });
});

// POST /api/transfer
router.post('/transfer', (req, res) => {
  const { from, to, amount, memo } = req.body;
  const ip = req.ip || '127.0.0.1';

  // Check payload for SQL injection
  const payloadStr = JSON.stringify({ from, to, amount, memo });
  if (/('|"|;|--|UNION|SELECT|DROP|INSERT|DELETE|UPDATE)/i.test(payloadStr)) {
    sendLog({
      level: 'error',
      message: `SQL injection attempt in transfer endpoint from IP ${ip}`,
      ip_address: ip,
      username: req.headers['x-user'] || 'anonymous',
      endpoint: '/api/transfer',
      method: 'POST',
      status_code: 400,
      payload: req.body,
      metadata: { sql_injection: true }
    });
    return res.status(400).json({ success: false, message: 'Invalid transfer data.' });
  }

  res.json({ success: true, transactionId: 'TXN-' + Date.now(), amount, status: 'completed' });
});

// GET /api/transactions
router.get('/transactions', (req, res) => {
  res.json({
    success: true,
    transactions: [
      { id: 'TXN-001', type: 'credit', amount: 5000, date: new Date().toISOString() },
      { id: 'TXN-002', type: 'debit', amount: 200, date: new Date().toISOString() }
    ]
  });
});

module.exports = router;
