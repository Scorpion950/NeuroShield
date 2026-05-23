const express = require('express');
const { getDb } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

// GET /api/dashboard/stats
router.get('/stats', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const today = new Date().toISOString().split('T')[0];
    const todayStart = today + 'T00:00:00.000Z';

    const totalToday = db.prepare('SELECT COUNT(*) as count FROM alerts WHERE created_at >= ?').get(todayStart);
    const criticalCount = db.prepare("SELECT COUNT(*) as count FROM alerts WHERE severity = 'critical' AND created_at >= ?").get(todayStart);
    const appsCount = db.prepare("SELECT COUNT(*) as count FROM applications WHERE status = 'active'").get();
    const aiActions = db.prepare("SELECT COUNT(*) as count FROM alerts WHERE ai_explanation IS NOT NULL AND created_at >= ?").get(todayStart);
    const activeAlerts = db.prepare("SELECT COUNT(*) as count FROM alerts WHERE status = 'active'").get();
    const resolvedToday = db.prepare("SELECT COUNT(*) as count FROM alerts WHERE status = 'resolved' AND created_at >= ?").get(todayStart);
    const falsePositives = db.prepare("SELECT COUNT(*) as count FROM alerts WHERE is_false_positive = 1 AND created_at >= ?").get(todayStart);
    const logsProcessed = db.prepare('SELECT COUNT(*) as count FROM logs WHERE created_at >= ?').get(todayStart);

    res.json({
      success: true,
      stats: {
        total_alerts_today: totalToday?.count || 0,
        critical_threats: criticalCount?.count || 0,
        apps_monitored: appsCount?.count || 0,
        ai_actions_taken: aiActions?.count || 0,
        active_alerts: activeAlerts?.count || 0,
        resolved_today: resolvedToday?.count || 0,
        false_positives_today: falsePositives?.count || 0,
        logs_processed_today: logsProcessed?.count || 0
      }
    });
  } catch (err) {
    console.error('[Dashboard] Stats error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch stats.' });
  }
});

// GET /api/dashboard/recent-alerts
router.get('/recent-alerts', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const alerts = db.prepare(`
      SELECT * FROM alerts ORDER BY created_at DESC LIMIT 10
    `).all().map(a => ({ ...a, metadata: a.metadata ? JSON.parse(a.metadata) : {} }));
    res.json({ success: true, alerts });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch recent alerts.' });
  }
});

// GET /api/dashboard/system-health
router.get('/system-health', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const lastMinute = new Date(Date.now() - 60000).toISOString();
    const logsLastMin = db.prepare('SELECT COUNT(*) as count FROM logs WHERE created_at >= ?').get(lastMinute);
    const alertsLastMin = db.prepare('SELECT COUNT(*) as count FROM alerts WHERE created_at >= ?').get(lastMinute);
    const activeApps = db.prepare("SELECT COUNT(*) as count FROM applications WHERE status = 'active'").get();
    const totalLogs = db.prepare('SELECT COUNT(*) as count FROM logs').get();
    const totalAlerts = db.prepare('SELECT COUNT(*) as count FROM alerts').get();

    res.json({
      success: true,
      health: {
        platform_status: 'operational',
        detection_engine: 'active',
        logs_per_minute: logsLastMin?.count || 0,
        alerts_per_minute: alertsLastMin?.count || 0,
        active_apps: activeApps?.count || 0,
        total_logs_processed: totalLogs?.count || 0,
        total_alerts_generated: totalAlerts?.count || 0,
        uptime: process.uptime(),
        memory_usage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch system health.' });
  }
});

module.exports = router;
