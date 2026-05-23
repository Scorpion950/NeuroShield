const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../config/database');
const { detectBruteForce, detectSuspiciousLogin, detectExcessiveRequests, requestWindows } = require('../detection/bruteForce');
const { detectSQLInjection, detectXSS } = require('../detection/sqlInjection');
const { detectUnauthorizedAccess, detectPrivilegeEscalation, detectAbnormalBehavior } = require('../detection/anomalyDetection');
const { generateAIExplanation } = require('./aiProcessor');

const excessWindowMap = new Map();
const userActivityMap = new Map();

let wsClients = new Set();

function setWsClients(clients) {
  wsClients = clients;
}

function broadcastAlert(alert) {
  const payload = JSON.stringify({ type: 'new_alert', data: alert });
  wsClients.forEach(client => {
    try {
      if (client.readyState === 1) client.send(payload);
    } catch (e) {}
  });
}

function broadcastEvent(type, data) {
  const payload = JSON.stringify({ type, data });
  wsClients.forEach(client => {
    try {
      if (client.readyState === 1) client.send(payload);
    } catch (e) {}
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

function createAlert(threat, logEntry, sourceApp) {
  const db = getDb();
  const alertId = uuidv4();

  // Generate AI explanation
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

  db.prepare(`
    INSERT INTO alerts (id, title, description, severity, attack_type, source_app, source_app_id,
      ip_address, username, endpoint, raw_log, ai_explanation, ai_recommendation, status, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)
  `).run(
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
  );

  // Update application alert counts
  if (alertData.source_app_id) {
    db.prepare(`
      UPDATE applications SET total_alerts = total_alerts + 1, last_seen = CURRENT_TIMESTAMP
      ${threat.severity === 'critical' ? ', critical_alerts = critical_alerts + 1' : ''}
      WHERE id = ?
    `).run(alertData.source_app_id);
  }

  const fullAlert = db.prepare('SELECT * FROM alerts WHERE id = ?').get(alertId);
  broadcastAlert(fullAlert);

  return fullAlert;
}

function ingestLog(logEntry, sourceApp) {
  const db = getDb();
  const logId = uuidv4();

  // Store raw log
  db.prepare(`
    INSERT INTO logs (id, application_id, source_app, level, message, ip_address, username,
      endpoint, method, status_code, payload, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).run(
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
  );

  // Run detection
  const threats = processLog({ ...logEntry, application_id: sourceApp?.id });
  const createdAlerts = [];

  for (const threat of threats) {
    const alert = createAlert(threat, logEntry, sourceApp);
    createdAlerts.push(alert);
  }

  // Broadcast log stats update
  broadcastEvent('stats_update', { logs_processed: 1, alerts_created: createdAlerts.length });

  return { logId, threats: createdAlerts };
}

module.exports = { ingestLog, setWsClients, broadcastAlert, broadcastEvent };
