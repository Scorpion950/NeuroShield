const express = require('express');
const { randomUUID: uuidv4 } = require('crypto');
const { query, queryOne, execute } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

function generateApiKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let key = 'ns-';
  for (let i = 0; i < 40; i++) key += chars[Math.floor(Math.random() * chars.length)];
  return key;
}

// GET /api/apikeys
router.get('/', authMiddleware, async (req, res) => {
  try {
    const keys = await query(`
      SELECT ak.*, a.name as app_name FROM api_keys ak
      LEFT JOIN applications a ON ak.application_id = a.id
      ORDER BY ak.created_at DESC
    `);
    res.json({ success: true, apiKeys: keys });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch API keys.' });
  }
});

// POST /api/apikeys
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, application_id, permissions } = req.body;
    if (!name || !application_id) {
      return res.status(400).json({ success: false, message: 'Name and application ID required.' });
    }
    const app = await queryOne('SELECT id FROM applications WHERE id = $1', [application_id]);
    if (!app) return res.status(404).json({ success: false, message: 'Application not found.' });

    const id = 'key-' + uuidv4().split('-')[0];
    const keyValue = generateApiKey();
    await execute(
      'INSERT INTO api_keys (id, key_value, name, application_id, created_by, permissions) VALUES ($1, $2, $3, $4, $5, $6)',
      [id, keyValue, name, application_id, req.user.username, permissions || 'ingest']
    );

    res.status(201).json({ success: true, message: 'API key generated.', key: { id, key_value: keyValue, name } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to generate API key.' });
  }
});

// PATCH /api/apikeys/:id/revoke
router.patch('/:id/revoke', authMiddleware, async (req, res) => {
  try {
    await execute('UPDATE api_keys SET is_active = 0 WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'API key revoked.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to revoke API key.' });
  }
});

// PATCH /api/apikeys/:id/activate
router.patch('/:id/activate', authMiddleware, async (req, res) => {
  try {
    await execute('UPDATE api_keys SET is_active = 1 WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'API key activated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to activate API key.' });
  }
});

// DELETE /api/apikeys/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const key = await queryOne('SELECT * FROM api_keys WHERE id = $1', [req.params.id]);
    if (key && key.id === 'key-minibank-001') {
      return res.status(403).json({ success: false, message: 'Cannot delete internal MiniBank API key.' });
    }
    await execute('DELETE FROM api_keys WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'API key deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete API key.' });
  }
});

module.exports = router;
