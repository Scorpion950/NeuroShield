const axios = require('axios');

const NEUROSHIELD_URL = process.env.NEUROSHIELD_URL || 'http://localhost:5000';
const MINIBANK_API_KEY = process.env.MINIBANK_API_KEY || 'mb-api-key-neuroshield-internal-2024';

async function sendLog(logData) {
  try {
    await axios.post(`${NEUROSHIELD_URL}/api/ingest/log`, logData, {
      headers: { 'X-API-Key': MINIBANK_API_KEY, 'Content-Type': 'application/json' },
      timeout: 3000
    });
  } catch (err) {
    // Silent fail - don't crash MiniBank if NeuroShield is down
    if (process.env.LOG_FORWARDER_DEBUG) {
      console.error('[MiniBank LogForwarder] Failed to send log:', err.message);
    }
  }
}

function createRequestLogger(appName = 'MiniBank') {
  return (req, res, next) => {
    const start = Date.now();
    const originalEnd = res.end.bind(res);

    res.end = function (...args) {
      const duration = Date.now() - start;
      const logData = {
        level: res.statusCode >= 400 ? 'warn' : 'info',
        message: `${req.method} ${req.path} ${res.statusCode} ${duration}ms`,
        ip_address: req.ip || req.connection?.remoteAddress || '127.0.0.1',
        username: req.body?.username || req.headers['x-user'] || null,
        endpoint: req.path,
        method: req.method,
        status_code: res.statusCode,
        payload: ['POST', 'PUT', 'PATCH'].includes(req.method) ? req.body : null,
        metadata: { duration_ms: duration, user_agent: req.headers['user-agent'] }
      };
      sendLog(logData);
      return originalEnd(...args);
    };
    next();
  };
}

module.exports = { sendLog, createRequestLogger };
