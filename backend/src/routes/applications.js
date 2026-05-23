const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

// GET /api/applications
router.get('/', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const apps = db.prepare('SELECT * FROM applications ORDER BY created_at DESC').all();
    // Attach API key info
    const withKeys = apps.map(app => {
      const keys = db.prepare('SELECT id, name, key_value, is_active, created_at, last_used FROM api_keys WHERE application_id = ?').all(app.id);
      const recentAlerts = db.prepare('SELECT id, title, severity, created_at FROM alerts WHERE source_app_id = ? ORDER BY created_at DESC LIMIT 5').all(app.id);
      return { ...app, api_keys: keys, recent_alerts: recentAlerts };
    });
    res.json({ success: true, applications: withKeys });
  } catch (err) {
    console.error('[Applications] GET error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch applications.' });
  }
});

// GET /api/applications/:id
router.get('/:id', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const app = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id);
    if (!app) return res.status(404).json({ success: false, message: 'Application not found.' });
    const keys = db.prepare('SELECT * FROM api_keys WHERE application_id = ?').all(app.id);
    const alerts = db.prepare('SELECT * FROM alerts WHERE source_app_id = ? ORDER BY created_at DESC LIMIT 20').all(app.id);
    res.json({ success: true, application: { ...app, api_keys: keys, alerts } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch application.' });
  }
});

// POST /api/applications
router.post('/', authMiddleware, (req, res) => {
  try {
    const { name, description, url, type } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Application name required.' });
    const db = getDb();
    const id = 'app-' + uuidv4().split('-')[0];
    db.prepare(`INSERT INTO applications (id, name, description, url, type, status) VALUES (?, ?, ?, ?, ?, 'active')`).run(id, name, description || '', url || '', type || 'web');
    res.status(201).json({ success: true, message: 'Application registered.', applicationId: id });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to register application.' });
  }
});

// PUT /api/applications/:id
router.put('/:id', authMiddleware, (req, res) => {
  try {
    const { name, description, url, type, status } = req.body;
    const db = getDb();
    db.prepare('UPDATE applications SET name = ?, description = ?, url = ?, type = ?, status = ? WHERE id = ?')
      .run(name, description, url, type, status, req.params.id);
    res.json({ success: true, message: 'Application updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update application.' });
  }
});

// DELETE /api/applications/:id
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM applications WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Application removed.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to remove application.' });
  }
});

module.exports = router;
