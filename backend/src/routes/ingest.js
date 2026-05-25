const express = require('express');
const { apiKeyAuth } = require('../middleware/apiKeyAuth');
const { ingestLog } = require('../services/threatDetection');
const { query, queryOne, execute } = require('../config/database');
const { generateAIExplanation } = require('../services/aiProcessor');
const { broadcastAlert } = require('../services/threatDetection');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// POST /api/ingest/log
router.post('/log', apiKeyAuth, async (req, res) => {
  try {
    const { level, message, ip_address, username, endpoint, method, status_code, payload, metadata } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: 'Log message is required.' });
    }

    const logEntry = {
      level: level || 'info',
      message,
      ip_address,
      username,
      endpoint,
      method,
      status_code: status_code ? parseInt(status_code) : null,
      payload,
      metadata,
      source_app: req.sourceApp?.name,
      application_id: req.sourceApp?.id
    };

    const result = await ingestLog(logEntry, req.sourceApp);

    res.json({
      success: true,
      message: 'Log ingested successfully.',
      logId: result.logId,
      threats_detected: result.threats.length,
      alerts: result.threats.map(t => ({ id: t.id, severity: t.severity, attack_type: t.attack_type }))
    });
  } catch (err) {
    console.error('[Ingest] Log error:', err);
    res.status(500).json({ success: false, message: 'Failed to ingest log.' });
  }
});

// POST /api/ingest/batch
router.post('/batch', apiKeyAuth, async (req, res) => {
  try {
    const { logs } = req.body;
    if (!logs || !Array.isArray(logs) || logs.length === 0) {
      return res.status(400).json({ success: false, message: 'Logs array required.' });
    }
    if (logs.length > 100) {
      return res.status(400).json({ success: false, message: 'Maximum 100 logs per batch.' });
    }

    const results = [];
    let totalThreats = 0;

    for (const log of logs) {
      const logEntry = { ...log, source_app: req.sourceApp?.name, application_id: req.sourceApp?.id };
      const result = await ingestLog(logEntry, req.sourceApp);
      results.push({ logId: result.logId, threats: result.threats.length });
      totalThreats += result.threats.length;
    }

    res.json({
      success: true,
      message: `Batch ingested: ${logs.length} logs, ${totalThreats} threats detected.`,
      results,
      total_logs: logs.length,
      total_threats: totalThreats
    });
  } catch (err) {
    console.error('[Ingest] Batch error:', err);
    res.status(500).json({ success: false, message: 'Batch ingestion failed.' });
  }
});

// POST /api/ingest/event
router.post('/event', apiKeyAuth, async (req, res) => {
  try {
    const { event_type, severity, title, description, ip_address, username, endpoint, metadata } = req.body;
    if (!event_type || !title) {
      return res.status(400).json({ success: false, message: 'event_type and title are required.' });
    }

    const alertId = uuidv4();
    const alertData = {
      id: alertId, title, description, severity: severity || 'medium',
      attack_type: event_type, ip_address, username, endpoint,
      source_app: req.sourceApp?.name, source_app_id: req.sourceApp?.id,
      created_at: new Date().toISOString(), metadata
    };
    const aiResult = generateAIExplanation(alertData);

    await execute(`
      INSERT INTO alerts (id, title, description, severity, attack_type, source_app, source_app_id,
        ip_address, username, endpoint, ai_explanation, ai_recommendation, status, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'active', $13)
    `, [alertId, title, description, severity || 'medium', event_type,
       req.sourceApp?.name, req.sourceApp?.id, ip_address, username, endpoint,
       aiResult.explanation, aiResult.recommendation, JSON.stringify(metadata || {})]);

    if (req.sourceApp?.id) {
      execute('UPDATE applications SET total_alerts = total_alerts + 1, last_seen = NOW() WHERE id = $1', [req.sourceApp.id]).catch(() => {});
    }

    const fullAlert = await queryOne('SELECT * FROM alerts WHERE id = $1', [alertId]);
    broadcastAlert(fullAlert);

    res.status(201).json({ success: true, message: 'Security event recorded.', alertId });
  } catch (err) {
    console.error('[Ingest] Event error:', err);
    res.status(500).json({ success: false, message: 'Failed to record event.' });
  }
});

module.exports = router;
