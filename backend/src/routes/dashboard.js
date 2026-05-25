const express = require('express');
const { query, queryOne, execute } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

// GET /api/dashboard/stats
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const cutoff = new Date(Math.min(
      new Date().setHours(0, 0, 0, 0),
      Date.now() - 24 * 60 * 60 * 1000
    )).toISOString();

    const [totalToday, criticalCount, appsCount, aiActions, activeAlerts, resolvedToday, falsePositives, logsProcessed] = await Promise.all([
      queryOne('SELECT COUNT(*) as count FROM alerts WHERE created_at >= $1', [cutoff]),
      queryOne("SELECT COUNT(*) as count FROM alerts WHERE severity = 'critical' AND created_at >= $1", [cutoff]),
      queryOne("SELECT COUNT(*) as count FROM applications WHERE status = 'active'"),
      queryOne('SELECT COUNT(*) as count FROM alerts WHERE ai_explanation IS NOT NULL AND created_at >= $1', [cutoff]),
      queryOne("SELECT COUNT(*) as count FROM alerts WHERE status = 'active'"),
      queryOne("SELECT COUNT(*) as count FROM alerts WHERE status = 'resolved' AND updated_at >= $1", [cutoff]),
      queryOne('SELECT COUNT(*) as count FROM alerts WHERE is_false_positive = 1 AND created_at >= $1', [cutoff]),
      queryOne('SELECT COUNT(*) as count FROM logs WHERE created_at >= $1', [cutoff]),
    ]);

    res.json({
      success: true,
      stats: {
        total_alerts_today: parseInt(totalToday?.count || 0),
        critical_threats: parseInt(criticalCount?.count || 0),
        apps_monitored: parseInt(appsCount?.count || 0),
        ai_actions_taken: parseInt(aiActions?.count || 0),
        active_alerts: parseInt(activeAlerts?.count || 0),
        resolved_today: parseInt(resolvedToday?.count || 0),
        false_positives_today: parseInt(falsePositives?.count || 0),
        logs_processed_today: parseInt(logsProcessed?.count || 0)
      }
    });
  } catch (err) {
    console.error('[Dashboard] Stats error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch stats.' });
  }
});

// GET /api/dashboard/recent-alerts
router.get('/recent-alerts', authMiddleware, async (req, res) => {
  try {
    const alerts = await query('SELECT * FROM alerts ORDER BY created_at DESC LIMIT 10');
    const parsed = alerts.map(a => ({ ...a, metadata: a.metadata ? JSON.parse(a.metadata) : {} }));
    res.json({ success: true, alerts: parsed });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch recent alerts.' });
  }
});

// GET /api/dashboard/system-health
router.get('/system-health', authMiddleware, async (req, res) => {
  try {
    const lastMinute = new Date(Date.now() - 60000).toISOString();

    const [logsLastMin, alertsLastMin, activeApps, totalLogs, totalAlerts] = await Promise.all([
      queryOne('SELECT COUNT(*) as count FROM logs WHERE created_at >= $1', [lastMinute]),
      queryOne('SELECT COUNT(*) as count FROM alerts WHERE created_at >= $1', [lastMinute]),
      queryOne("SELECT COUNT(*) as count FROM applications WHERE status = 'active'"),
      queryOne('SELECT COUNT(*) as count FROM logs'),
      queryOne('SELECT COUNT(*) as count FROM alerts'),
    ]);

    res.json({
      success: true,
      health: {
        platform_status: 'operational',
        detection_engine: 'active',
        logs_per_minute: parseInt(logsLastMin?.count || 0),
        alerts_per_minute: parseInt(alertsLastMin?.count || 0),
        active_apps: parseInt(activeApps?.count || 0),
        total_logs_processed: parseInt(totalLogs?.count || 0),
        total_alerts_generated: parseInt(totalAlerts?.count || 0),
        uptime: process.uptime(),
        memory_usage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch system health.' });
  }
});

module.exports = router;
