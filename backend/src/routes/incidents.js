const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

// GET /api/incidents
router.get('/', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { status, severity, limit = 20, offset = 0 } = req.query;
    let query = 'SELECT * FROM incidents WHERE 1=1';
    const params = [];
    if (status) { query += ' AND status = ?'; params.push(status); }
    if (severity) { query += ' AND severity = ?'; params.push(severity); }
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const incidents = db.prepare(query).all(...params).map(i => ({
      ...i,
      alert_ids: i.alert_ids ? JSON.parse(i.alert_ids) : [],
      timeline: i.timeline ? JSON.parse(i.timeline) : []
    }));

    const total = db.prepare('SELECT COUNT(*) as count FROM incidents').get();
    res.json({ success: true, incidents, total: total?.count || 0 });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch incidents.' });
  }
});

// POST /api/incidents
router.post('/', authMiddleware, (req, res) => {
  try {
    const { title, description, severity, alert_ids, assigned_to } = req.body;
    if (!title || !severity) return res.status(400).json({ success: false, message: 'Title and severity required.' });

    const db = getDb();
    const id = uuidv4();
    const timeline = [{ time: new Date().toISOString(), event: `Incident created by ${req.user.username}` }];

    db.prepare(`
      INSERT INTO incidents (id, title, description, severity, status, alert_ids, assigned_to, timeline)
      VALUES (?, ?, ?, ?, 'open', ?, ?, ?)
    `).run(id, title, description || '', severity, JSON.stringify(alert_ids || []), assigned_to || null, JSON.stringify(timeline));

    res.status(201).json({ success: true, message: 'Incident created.', incidentId: id });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create incident.' });
  }
});

// PATCH /api/incidents/:id
router.patch('/:id', authMiddleware, (req, res) => {
  try {
    const { status, notes, assigned_to } = req.body;
    const db = getDb();
    const incident = db.prepare('SELECT * FROM incidents WHERE id = ?').get(req.params.id);
    if (!incident) return res.status(404).json({ success: false, message: 'Incident not found.' });

    const timeline = incident.timeline ? JSON.parse(incident.timeline) : [];
    if (status && status !== incident.status) {
      timeline.push({ time: new Date().toISOString(), event: `Status changed to "${status}" by ${req.user.username}` });
    }

    db.prepare(`
      UPDATE incidents SET status = ?, notes = ?, assigned_to = ?, timeline = ?,
      updated_at = CURRENT_TIMESTAMP ${status === 'resolved' ? ', resolved_at = CURRENT_TIMESTAMP' : ''} WHERE id = ?
    `).run(status || incident.status, notes || incident.notes, assigned_to || incident.assigned_to, JSON.stringify(timeline), req.params.id);

    res.json({ success: true, message: 'Incident updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update incident.' });
  }
});

// DELETE /api/incidents/:id
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM incidents WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Incident deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete incident.' });
  }
});

module.exports = router;
