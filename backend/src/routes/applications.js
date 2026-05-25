const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { query, queryOne, execute } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

// GET /api/applications
router.get('/', authMiddleware, async (req, res) => {
  try {
    const apps = await query('SELECT * FROM applications ORDER BY created_at DESC');
    const withKeys = await Promise.all(apps.map(async app => {
      const keys = await query('SELECT id, name, key_value, is_active, created_at, last_used FROM api_keys WHERE application_id = $1', [app.id]);
      const recentAlerts = await query('SELECT id, title, severity, created_at FROM alerts WHERE source_app_id = $1 ORDER BY created_at DESC LIMIT 5', [app.id]);
      return { ...app, api_keys: keys, recent_alerts: recentAlerts };
    }));
    res.json({ success: true, applications: withKeys });
  } catch (err) {
    console.error('[Applications] GET error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch applications.' });
  }
});

// GET /api/applications/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const app = await queryOne('SELECT * FROM applications WHERE id = $1', [req.params.id]);
    if (!app) return res.status(404).json({ success: false, message: 'Application not found.' });
    const keys = await query('SELECT * FROM api_keys WHERE application_id = $1', [app.id]);
    const alerts = await query('SELECT * FROM alerts WHERE source_app_id = $1 ORDER BY created_at DESC LIMIT 20', [app.id]);
    res.json({ success: true, application: { ...app, api_keys: keys, alerts } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch application.' });
  }
});

// POST /api/applications
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, url, type } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Application name required.' });
    const id = 'app-' + uuidv4().split('-')[0];
    await execute(
      `INSERT INTO applications (id, name, description, url, type, status) VALUES ($1, $2, $3, $4, $5, 'active')`,
      [id, name, description || '', url || '', type || 'web']
    );
    res.status(201).json({ success: true, message: 'Application registered.', applicationId: id });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to register application.' });
  }
});

// PUT /api/applications/:id
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, description, url, type, status } = req.body;
    await execute(
      'UPDATE applications SET name = $1, description = $2, url = $3, type = $4, status = $5 WHERE id = $6',
      [name, description, url, type, status, req.params.id]
    );
    res.json({ success: true, message: 'Application updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update application.' });
  }
});

// DELETE /api/applications/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await execute('DELETE FROM applications WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Application removed.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to remove application.' });
  }
});

module.exports = router;
