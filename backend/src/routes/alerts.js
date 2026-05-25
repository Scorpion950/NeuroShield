const express = require('express');
const { query, queryOne, execute } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

// GET /api/alerts
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { severity, status, attack_type, app, search, limit = 50, offset = 0, from, to } = req.query;

    let conditions = ['1=1'];
    const params = [];
    let p = 1;

    if (severity) { conditions.push(`severity = $${p++}`); params.push(severity); }
    if (status) { conditions.push(`status = $${p++}`); params.push(status); }
    if (attack_type) { conditions.push(`attack_type = $${p++}`); params.push(attack_type); }
    if (app) { conditions.push(`(source_app = $${p} OR source_app_id = $${p})`); params.push(app); p++; }
    if (search) {
      conditions.push(`(title ILIKE $${p} OR description ILIKE $${p} OR ip_address ILIKE $${p} OR username ILIKE $${p})`);
      params.push(`%${search}%`); p++;
    }
    if (from) { conditions.push(`created_at >= $${p++}`); params.push(from); }
    if (to) { conditions.push(`created_at <= $${p++}`); params.push(to); }

    const whereClause = conditions.join(' AND ');

    const countResult = await queryOne(`SELECT COUNT(*) as count FROM alerts WHERE ${whereClause}`, params);

    const orderSql = `
      ORDER BY CASE status
        WHEN 'active' THEN 1 WHEN 'investigating' THEN 2
        WHEN 'resolved' THEN 3 WHEN 'false_positive' THEN 4 ELSE 5
      END ASC, created_at DESC
      LIMIT $${p++} OFFSET $${p++}
    `;
    params.push(parseInt(limit), parseInt(offset));

    const alerts = await query(`SELECT * FROM alerts WHERE ${whereClause} ${orderSql}`, params);
    const parsedAlerts = alerts.map(a => ({ ...a, metadata: a.metadata ? JSON.parse(a.metadata) : {} }));

    res.json({ success: true, alerts: parsedAlerts, total: parseInt(countResult?.count || 0) });
  } catch (err) {
    console.error('[Alerts] GET error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch alerts.' });
  }
});

// GET /api/alerts/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const alert = await queryOne('SELECT * FROM alerts WHERE id = $1', [req.params.id]);
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found.' });
    alert.metadata = alert.metadata ? JSON.parse(alert.metadata) : {};
    res.json({ success: true, alert });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch alert.' });
  }
});

// PATCH /api/alerts/:id/status
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['active', 'investigating', 'resolved', 'false_positive'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }

    if (status === 'resolved') {
      await execute('UPDATE alerts SET status = $1, updated_at = NOW(), resolved_at = NOW(), resolved_by = $2 WHERE id = $3',
        [status, req.user.username, req.params.id]);
    } else {
      await execute('UPDATE alerts SET status = $1, updated_at = NOW() WHERE id = $2', [status, req.params.id]);
    }
    if (status === 'false_positive') {
      await execute('UPDATE alerts SET is_false_positive = 1 WHERE id = $1', [req.params.id]);
    }
    res.json({ success: true, message: 'Alert status updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update alert.' });
  }
});

// POST /api/alerts/bulk-action
router.post('/bulk-action', authMiddleware, async (req, res) => {
  try {
    const { ids, action, status } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Alert IDs required.' });
    }
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
    if (action === 'update_status') {
      await execute(`UPDATE alerts SET status = $${ids.length + 1}, updated_at = NOW() WHERE id IN (${placeholders})`, [...ids, status]);
    } else if (action === 'delete') {
      await execute(`DELETE FROM alerts WHERE id IN (${placeholders})`, ids);
    } else if (action === 'mark_false_positive') {
      await execute(`UPDATE alerts SET is_false_positive = 1, status = 'false_positive' WHERE id IN (${placeholders})`, ids);
    }
    res.json({ success: true, message: `Bulk action "${action}" applied to ${ids.length} alerts.` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Bulk action failed.' });
  }
});

// DELETE /api/alerts/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await execute('DELETE FROM alerts WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Alert deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete alert.' });
  }
});

module.exports = router;
