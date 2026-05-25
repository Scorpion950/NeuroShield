const express = require('express');
const { randomUUID: uuidv4 } = require('crypto');
const { query, queryOne, execute } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

// GET /api/incidents
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status, severity, limit = 20, offset = 0 } = req.query;
    const conditions = ['1=1'];
    const params = [];
    let p = 1;

    if (status) { conditions.push(`status = $${p++}`); params.push(status); }
    if (severity) { conditions.push(`severity = $${p++}`); params.push(severity); }

    params.push(parseInt(limit), parseInt(offset));
    const incidents = await query(
      `SELECT * FROM incidents WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC LIMIT $${p++} OFFSET $${p++}`,
      params
    );

    const total = await queryOne('SELECT COUNT(*) as count FROM incidents');
    const parsed = incidents.map(i => ({
      ...i,
      alert_ids: i.alert_ids ? JSON.parse(i.alert_ids) : [],
      timeline: i.timeline ? JSON.parse(i.timeline) : []
    }));
    res.json({ success: true, incidents: parsed, total: parseInt(total?.count || 0) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch incidents.' });
  }
});

// POST /api/incidents
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, description, severity, alert_ids, assigned_to } = req.body;
    if (!title || !severity) return res.status(400).json({ success: false, message: 'Title and severity required.' });

    const id = uuidv4();
    const timeline = [{ time: new Date().toISOString(), event: `Incident created by ${req.user.username}` }];

    await execute(
      `INSERT INTO incidents (id, title, description, severity, status, alert_ids, assigned_to, timeline) VALUES ($1, $2, $3, $4, 'open', $5, $6, $7)`,
      [id, title, description || '', severity, JSON.stringify(alert_ids || []), assigned_to || null, JSON.stringify(timeline)]
    );

    res.status(201).json({ success: true, message: 'Incident created.', incidentId: id });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create incident.' });
  }
});

// PATCH /api/incidents/:id
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const { status, notes, assigned_to } = req.body;
    const incident = await queryOne('SELECT * FROM incidents WHERE id = $1', [req.params.id]);
    if (!incident) return res.status(404).json({ success: false, message: 'Incident not found.' });

    const timeline = incident.timeline ? JSON.parse(incident.timeline) : [];
    if (status && status !== incident.status) {
      timeline.push({ time: new Date().toISOString(), event: `Status changed to "${status}" by ${req.user.username}` });
    }

    const resolvedClause = status === 'resolved' ? ', resolved_at = NOW()' : '';
    await execute(
      `UPDATE incidents SET status = $1, notes = $2, assigned_to = $3, timeline = $4, updated_at = NOW()${resolvedClause} WHERE id = $5`,
      [status || incident.status, notes || incident.notes, assigned_to || incident.assigned_to, JSON.stringify(timeline), req.params.id]
    );

    res.json({ success: true, message: 'Incident updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update incident.' });
  }
});

// DELETE /api/incidents/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await execute('DELETE FROM incidents WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Incident deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete incident.' });
  }
});

module.exports = router;
