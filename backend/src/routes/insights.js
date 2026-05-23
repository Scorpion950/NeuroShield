const express = require('express');
const { getDb } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');
const { generateDailySummary, generateAIExplanation } = require('../services/aiProcessor');
const router = express.Router();

// GET /api/insights/summary
router.get('/summary', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const today = new Date().toISOString().split('T')[0];
    const alerts = db.prepare(`
      SELECT * FROM alerts WHERE created_at >= ? ORDER BY created_at DESC
    `).all(today + 'T00:00:00.000Z');

    const summary = generateDailySummary(alerts);
    const topThreats = db.prepare(`
      SELECT attack_type, COUNT(*) as count, MAX(severity) as max_severity
      FROM alerts WHERE created_at >= ? GROUP BY attack_type ORDER BY count DESC LIMIT 5
    `).all(today + 'T00:00:00.000Z');

    const affectedApps = db.prepare(`
      SELECT source_app, COUNT(*) as alert_count FROM alerts WHERE created_at >= ? GROUP BY source_app ORDER BY alert_count DESC
    `).all(today + 'T00:00:00.000Z');

    res.json({ success: true, summary, topThreats, affectedApps, alertCount: alerts.length });
  } catch (err) {
    console.error('[Insights] Summary error:', err);
    res.status(500).json({ success: false, message: 'Failed to generate summary.' });
  }
});

// GET /api/insights/alert/:id
router.get('/alert/:id', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const alert = db.prepare('SELECT * FROM alerts WHERE id = ?').get(req.params.id);
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found.' });

    alert.metadata = alert.metadata ? JSON.parse(alert.metadata) : {};
    const aiResult = generateAIExplanation(alert);

    // Get related alerts (same attack type or IP)
    const related = db.prepare(`
      SELECT id, title, severity, created_at, attack_type FROM alerts
      WHERE (attack_type = ? OR ip_address = ?) AND id != ? AND created_at >= datetime('now', '-24 hours')
      LIMIT 5
    `).all(alert.attack_type, alert.ip_address, alert.id);

    // Build timeline
    const timeline = [];
    timeline.push({ time: alert.created_at, event: 'Alert created', severity: alert.severity });
    if (alert.updated_at !== alert.created_at) {
      timeline.push({ time: alert.updated_at, event: `Status changed to ${alert.status}` });
    }
    if (alert.resolved_at) {
      timeline.push({ time: alert.resolved_at, event: `Resolved by ${alert.resolved_by}` });
    }

    res.json({ success: true, alert, aiAnalysis: aiResult, relatedAlerts: related, timeline });
  } catch (err) {
    console.error('[Insights] Alert insight error:', err);
    res.status(500).json({ success: false, message: 'Failed to generate alert insight.' });
  }
});

// GET /api/insights/trends
router.get('/trends', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { hours = 24 } = req.query;
    const since = `datetime('now', '-${parseInt(hours)} hours')`;

    const hourlyTrends = db.prepare(`
      SELECT strftime('%Y-%m-%dT%H:00:00', created_at) as hour,
             COUNT(*) as total,
             SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical,
             SUM(CASE WHEN severity = 'high' THEN 1 ELSE 0 END) as high,
             SUM(CASE WHEN severity = 'medium' THEN 1 ELSE 0 END) as medium,
             SUM(CASE WHEN severity = 'low' THEN 1 ELSE 0 END) as low
      FROM alerts WHERE created_at >= ${since}
      GROUP BY hour ORDER BY hour ASC
    `).all();

    const attackDistribution = db.prepare(`
      SELECT attack_type, COUNT(*) as count FROM alerts WHERE created_at >= ${since}
      GROUP BY attack_type ORDER BY count DESC
    `).all();

    const severityDistribution = db.prepare(`
      SELECT severity, COUNT(*) as count FROM alerts WHERE created_at >= ${since}
      GROUP BY severity
    `).all();

    const appDistribution = db.prepare(`
      SELECT source_app, COUNT(*) as count FROM alerts WHERE created_at >= ${since}
      GROUP BY source_app ORDER BY count DESC
    `).all();

    res.json({ success: true, hourlyTrends, attackDistribution, severityDistribution, appDistribution });
  } catch (err) {
    console.error('[Insights] Trends error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch trends.' });
  }
});

module.exports = router;
