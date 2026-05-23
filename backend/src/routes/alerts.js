const express = require('express');
const { getDb } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

// GET /api/alerts
router.get('/', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { severity, status, attack_type, app, search, limit = 50, offset = 0, from, to } = req.query;

    let query = 'SELECT * FROM alerts WHERE 1=1';
    const params = [];

    if (severity) { query += ' AND severity = ?'; params.push(severity); }
    if (status) { query += ' AND status = ?'; params.push(status); }
    if (attack_type) { query += ' AND attack_type = ?'; params.push(attack_type); }
    if (app) { query += ' AND (source_app = ? OR source_app_id = ?)'; params.push(app, app); }
    if (search) { query += ' AND (title LIKE ? OR description LIKE ? OR ip_address LIKE ? OR username LIKE ?)'; const s = `%${search}%`; params.push(s, s, s, s); }
    if (from) { query += ' AND created_at >= ?'; params.push(from); }
    if (to) { query += ' AND created_at <= ?'; params.push(to); }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const alerts = db.prepare(query).all(...params);
    const totalQuery = query.replace('SELECT *', 'SELECT COUNT(*) as count').replace(/LIMIT \? OFFSET \?/, '').replace(/ORDER BY created_at DESC/, '');
    const total = db.prepare(totalQuery.split('LIMIT')[0]).get(...params.slice(0, -2));

    // Parse metadata JSON
    const parsedAlerts = alerts.map(a => ({
      ...a,
      metadata: a.metadata ? JSON.parse(a.metadata) : {}
    }));

    res.json({ success: true, alerts: parsedAlerts, total: total?.count || 0 });
  } catch (err) {
    console.error('[Alerts] GET error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch alerts.' });
  }
});

// GET /api/alerts/:id
router.get('/:id', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const alert = db.prepare('SELECT * FROM alerts WHERE id = ?').get(req.params.id);
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found.' });
    alert.metadata = alert.metadata ? JSON.parse(alert.metadata) : {};
    res.json({ success: true, alert });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch alert.' });
  }
});

// PATCH /api/alerts/:id/status
router.patch('/:id/status', authMiddleware, (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['active', 'investigating', 'resolved', 'false_positive'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }

    const db = getDb();
    const extra = status === 'resolved' ? ', resolved_at = CURRENT_TIMESTAMP, resolved_by = ?' : '';
    const params = status === 'resolved'
      ? [status, req.user.username, req.params.id]
      : [status, req.params.id];

    db.prepare(`UPDATE alerts SET status = ?, updated_at = CURRENT_TIMESTAMP${extra} WHERE id = ?`).run(...params);
    if (status === 'false_positive') {
      db.prepare('UPDATE alerts SET is_false_positive = 1 WHERE id = ?').run(req.params.id);
    }
    res.json({ success: true, message: 'Alert status updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update alert.' });
  }
});

// POST /api/alerts/bulk-action
router.post('/bulk-action', authMiddleware, (req, res) => {
  try {
    const { ids, action, status } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Alert IDs required.' });
    }
    const db = getDb();
    const placeholders = ids.map(() => '?').join(',');

    if (action === 'update_status') {
      db.prepare(`UPDATE alerts SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id IN (${placeholders})`).run(status, ...ids);
    } else if (action === 'delete') {
      db.prepare(`DELETE FROM alerts WHERE id IN (${placeholders})`).run(...ids);
    } else if (action === 'mark_false_positive') {
      db.prepare(`UPDATE alerts SET is_false_positive = 1, status = 'false_positive' WHERE id IN (${placeholders})`).run(...ids);
    }
    res.json({ success: true, message: `Bulk action "${action}" applied to ${ids.length} alerts.` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Bulk action failed.' });
  }
});

// DELETE /api/alerts/:id
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM alerts WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Alert deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete alert.' });
  }
});

module.exports = router;
