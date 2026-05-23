const { getDb } = require('../config/database');

function apiKeyAuth(req, res, next) {
  try {
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;
    if (!apiKey) {
      return res.status(401).json({ success: false, message: 'API key required. Include X-API-Key header.' });
    }
    const db = getDb();
    const keyRecord = db.prepare(`
      SELECT ak.*, a.name as app_name, a.id as app_id, a.status as app_status
      FROM api_keys ak
      LEFT JOIN applications a ON ak.application_id = a.id
      WHERE ak.key_value = ? AND ak.is_active = 1
    `).get(apiKey);

    if (!keyRecord) {
      return res.status(403).json({ success: false, message: 'Invalid or revoked API key.' });
    }
    if (keyRecord.app_status && keyRecord.app_status !== 'active') {
      return res.status(403).json({ success: false, message: 'Application is not active.' });
    }

    // Update last used
    db.prepare('UPDATE api_keys SET last_used = CURRENT_TIMESTAMP WHERE key_value = ?').run(apiKey);

    req.apiKey = keyRecord;
    req.sourceApp = {
      id: keyRecord.app_id,
      name: keyRecord.app_name
    };
    next();
  } catch (err) {
    console.error('[APIKeyAuth] Error:', err);
    return res.status(500).json({ success: false, message: 'Authentication error.' });
  }
}

module.exports = { apiKeyAuth };
