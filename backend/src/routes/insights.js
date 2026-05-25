const express = require('express');
const { query, queryOne } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');
const { generateDailySummary, generateAIExplanation, generateChatResponse } = require('../services/aiProcessor');
const router = express.Router();

// GET /api/insights/summary
router.get('/summary', authMiddleware, async (req, res) => {
  try {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const [alerts, topThreats, affectedApps] = await Promise.all([
      query('SELECT * FROM alerts WHERE created_at >= $1 ORDER BY created_at DESC', [cutoff]),
      query(`SELECT attack_type, COUNT(*) as count, MAX(severity) as max_severity
             FROM alerts WHERE created_at >= $1 GROUP BY attack_type ORDER BY count DESC LIMIT 5`, [cutoff]),
      query(`SELECT source_app, COUNT(*) as alert_count
             FROM alerts WHERE created_at >= $1 GROUP BY source_app ORDER BY alert_count DESC`, [cutoff]),
    ]);

    const summary = generateDailySummary(alerts);
    res.json({ success: true, summary, topThreats, affectedApps, alertCount: alerts.length });
  } catch (err) {
    console.error('[Insights] Summary error:', err);
    res.status(500).json({ success: false, message: 'Failed to generate summary.' });
  }
});

// GET /api/insights/alert/:id
router.get('/alert/:id', authMiddleware, async (req, res) => {
  try {
    const alert = await queryOne('SELECT * FROM alerts WHERE id = $1', [req.params.id]);
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found.' });

    alert.metadata = alert.metadata ? JSON.parse(alert.metadata) : {};
    const aiResult = generateAIExplanation(alert);

    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const related = await query(
      'SELECT id, title, severity, created_at, attack_type FROM alerts WHERE (attack_type = $1 OR ip_address = $2) AND id != $3 AND created_at >= $4 LIMIT 5',
      [alert.attack_type, alert.ip_address, alert.id, since24h]
    );

    const timeline = [{ time: alert.created_at, event: 'Alert created', severity: alert.severity }];
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
router.get('/trends', authMiddleware, async (req, res) => {
  try {
    const { hours = 24 } = req.query;
    const since = new Date(Date.now() - parseInt(hours) * 60 * 60 * 1000).toISOString();

    const [hourlyTrends, attackDistribution, severityDistribution, appDistribution] = await Promise.all([
      query(`
        SELECT date_trunc('hour', created_at) as hour,
               COUNT(*) as total,
               SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical,
               SUM(CASE WHEN severity = 'high' THEN 1 ELSE 0 END) as high,
               SUM(CASE WHEN severity = 'medium' THEN 1 ELSE 0 END) as medium,
               SUM(CASE WHEN severity = 'low' THEN 1 ELSE 0 END) as low
        FROM alerts WHERE created_at >= $1
        GROUP BY hour ORDER BY hour ASC
      `, [since]),
      query('SELECT attack_type, COUNT(*) as count FROM alerts WHERE created_at >= $1 GROUP BY attack_type ORDER BY count DESC', [since]),
      query('SELECT severity, COUNT(*) as count FROM alerts WHERE created_at >= $1 GROUP BY severity', [since]),
      query('SELECT source_app, COUNT(*) as count FROM alerts WHERE created_at >= $1 GROUP BY source_app ORDER BY count DESC', [since]),
    ]);

    res.json({ success: true, hourlyTrends, attackDistribution, severityDistribution, appDistribution });
  } catch (err) {
    console.error('[Insights] Trends error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch trends.' });
  }
});

// POST /api/insights/chat
router.post('/chat', authMiddleware, async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required.' });
    }

    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const [alerts, topThreats, suspiciousIPRows] = await Promise.all([
      query('SELECT * FROM alerts WHERE created_at >= $1 ORDER BY created_at DESC', [cutoff]),
      query(`SELECT attack_type, COUNT(*) as count, MAX(severity) as max_severity
             FROM alerts WHERE created_at >= $1 GROUP BY attack_type ORDER BY count DESC LIMIT 5`, [cutoff]),
      query(`SELECT DISTINCT ip_address FROM alerts
             WHERE created_at >= $1 AND severity IN ('critical','high') AND ip_address IS NOT NULL LIMIT 10`, [cutoff]),
    ]);

    const critical = alerts.filter(a => a.severity === 'critical').length;
    const high = alerts.filter(a => a.severity === 'high').length;
    const medium = alerts.filter(a => a.severity === 'medium').length;
    const low = alerts.filter(a => a.severity === 'low').length;
    const riskLevel = critical > 0 ? 'CRITICAL' : high > 3 ? 'HIGH' : high > 0 ? 'MEDIUM' : 'LOW';
    const suspiciousIPs = suspiciousIPRows.map(r => r.ip_address);
    const recentAlerts = alerts.filter(a => ['critical', 'high'].includes(a.severity)).slice(0, 10);

    const dbContext = { totalAlerts: alerts.length, critical, high, medium, low, riskLevel, topThreats, suspiciousIPs, recentAlerts };
    const result = await generateChatResponse(message.trim(), conversationHistory, dbContext);
    res.json({ success: true, reply: result.reply, source: result.source });
  } catch (err) {
    console.error('[Insights] Chat error:', err);
    res.status(500).json({ success: false, message: 'Failed to generate chat response.' });
  }
});

module.exports = router;
