const { randomUUID: uuidv4 } = require('crypto');
const { query, queryOne, execute } = require('../config/database');
const { detectBruteForce, detectSuspiciousLogin, detectExcessiveRequests, requestWindows } = require('../detection/bruteForce');
const { detectSQLInjection, detectXSS } = require('../detection/sqlInjection');
const { detectUnauthorizedAccess, detectPrivilegeEscalation, detectAbnormalBehavior } = require('../detection/anomalyDetection');
const { generateAIExplanation } = require('./aiProcessor');

const excessWindowMap = new Map();
const userActivityMap = new Map();

// SSE client registry (replaces WebSocket)
let sseClients = new Set();

function addSseClient(client) { sseClients.add(client); }
function removeSseClient(client) { sseClients.delete(client); }

function broadcastAlert(alert) {
  const payload = `data: ${JSON.stringify({ type: 'new_alert', data: alert })}\n\n`;
  sseClients.forEach(client => {
    try { client.write(payload); } catch (e) { sseClients.delete(client); }
  });
}

function broadcastEvent(type, data) {
  const payload = `data: ${JSON.stringify({ type, data })}\n\n`;
  sseClients.forEach(client => {
    try { client.write(payload); } catch (e) { sseClients.delete(client); }
  });
}

function processLog(logEntry) {
  const detectors = [
    () => detectBruteForce(logEntry),
    () => detectSuspiciousLogin(logEntry),
    () => detectSQLInjection(logEntry),
    () => detectXSS(logEntry),
    () => detectUnauthorizedAccess(logEntry),
    () => detectPrivilegeEscalation(logEntry),
    () => detectExcessiveRequests(logEntry, excessWindowMap),
    () => detectAbnormalBehavior(logEntry, userActivityMap),
  ];

  const threats = [];
  for (const detector of detectors) {
    try {
      const result = detector();
      if (result && result.detected) threats.push(result);
    } catch (err) {
      console.error('[ThreatDetection] Detector error:', err.message);
    }
  }
  return threats;
}

async function createAlert(threat, logEntry, sourceApp) {
  // Check if there's an existing active alert for this IP and attack type
  if (logEntry.ip_address) {
    const existing = await queryOne(`
      SELECT id, metadata FROM alerts 
      WHERE attack_type = $1 AND ip_address = $2 AND status = 'active'
      ORDER BY created_at DESC LIMIT 1
    `, [threat.attack_type, logEntry.ip_address]);

    if (existing) {
      // Update existing alert
      const oldMeta = existing.metadata ? (typeof existing.metadata === 'string' ? JSON.parse(existing.metadata) : existing.metadata) : {};
      const newMeta = { ...oldMeta, ...threat.metadata };
      
      await execute(`
        UPDATE alerts 
        SET title = $1, description = $2, severity = $3, updated_at = NOW(), metadata = $4
        WHERE id = $5
      `, [threat.title, threat.description, threat.severity, JSON.stringify(newMeta), existing.id]);
      
      const updatedAlert = await queryOne('SELECT * FROM alerts WHERE id = $1', [existing.id]);
      broadcastAlert(updatedAlert);
      return updatedAlert;
    }
  }

  const alertId = uuidv4();
  const alertData = {
    id: alertId,
    ...threat,
    ip_address: logEntry.ip_address,
    username: logEntry.username,
    endpoint: logEntry.endpoint,
    source_app: sourceApp?.name || logEntry.source_app || 'Unknown',
    source_app_id: sourceApp?.id || logEntry.application_id || null,
    created_at: new Date().toISOString()
  };

  const aiResult = generateAIExplanation(alertData);

  await execute(`
    INSERT INTO alerts (id, title, description, severity, attack_type, source_app, source_app_id,
      ip_address, username, endpoint, raw_log, ai_explanation, ai_recommendation, status, metadata)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'active', $14)
  `, [
    alertId,
    threat.title,
    threat.description,
    threat.severity,
    threat.attack_type,
    alertData.source_app,
    alertData.source_app_id,
    logEntry.ip_address || null,
    logEntry.username || null,
    logEntry.endpoint || null,
    JSON.stringify(logEntry),
    aiResult.explanation,
    aiResult.recommendation,
    JSON.stringify(threat.metadata || {})
  ]);

  if (alertData.source_app_id) {
    const criticalExtra = threat.severity === 'critical' ? ', critical_alerts = critical_alerts + 1' : '';
    await execute(
      `UPDATE applications SET total_alerts = total_alerts + 1, last_seen = NOW()${criticalExtra} WHERE id = $1`,
      [alertData.source_app_id]
    ).catch(() => {});
  }

  const fullAlert = await queryOne('SELECT * FROM alerts WHERE id = $1', [alertId]);
  broadcastAlert(fullAlert);
  return fullAlert;
}

async function ingestLog(logEntry, sourceApp) {
  const logId = uuidv4();

  await execute(`
    INSERT INTO logs (id, application_id, source_app, level, message, ip_address, username,
      endpoint, method, status_code, payload, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
  `, [
    logId,
    sourceApp?.id || null,
    sourceApp?.name || logEntry.source_app || 'Unknown',
    logEntry.level || 'info',
    logEntry.message || '',
    logEntry.ip_address || null,
    logEntry.username || null,
    logEntry.endpoint || null,
    logEntry.method || null,
    logEntry.status_code || null,
    logEntry.payload ? JSON.stringify(logEntry.payload) : null
  ]);

  const threats = processLog({ ...logEntry, application_id: sourceApp?.id });
  const createdAlerts = [];

  for (const threat of threats) {
    const alert = await createAlert(threat, logEntry, sourceApp);
    createdAlerts.push(alert);
  }

  broadcastEvent('stats_update', { logs_processed: 1, alerts_created: createdAlerts.length });
  return { logId, threats: createdAlerts };
}

module.exports = { ingestLog, addSseClient, removeSseClient, broadcastAlert, broadcastEvent };
