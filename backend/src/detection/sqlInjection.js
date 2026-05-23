const config = require('../config/config');

const SQL_PATTERNS = [
  /(\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b|\bUNION\b|\bALTER\b|\bCREATE\b|\bEXEC\b|\bEXECUTE\b)/i,
  /('|\"|;|--|\/\*|\*\/|xp_|INFORMATION_SCHEMA|sysobjects|syscolumns)/,
  /(\bOR\b\s+['"]?\d+['"]?\s*=\s*['"]?\d+['"]?)/i,
  /(\bAND\b\s+['"]?\d+['"]?\s*=\s*['"]?\d+['"]?)/i,
  /(SLEEP\s*\(|BENCHMARK\s*\(|WAITFOR\s+DELAY)/i,
  /(CONCAT\s*\(|GROUP_CONCAT\s*\(|LOAD_FILE\s*\(|INTO\s+OUTFILE)/i,
  /(\bCHAR\s*\(|0x[0-9a-f]+)/i,
  /(admin'--|'OR'1'='1|' OR 1=1|' OR '1'='1)/i
];

const XSS_PATTERNS = [
  /<script[\s\S]*?>[\s\S]*?<\/script>/i,
  /javascript:/i,
  /on\w+\s*=\s*["']?[^"']*["']?/i,
  /<iframe|<img|<svg|<object/i,
  /eval\s*\(|alert\s*\(|document\.cookie/i
];

function detectSQLInjection(logEntry) {
  const { payload, endpoint, method } = logEntry;
  if (!payload) return null;

  const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const decodedPayload = decodeURIComponent(payloadStr);

  let matchedPatterns = [];
  for (const pattern of SQL_PATTERNS) {
    if (pattern.test(decodedPayload)) {
      matchedPatterns.push(pattern.source.substring(0, 40));
    }
  }

  if (matchedPatterns.length === 0) return null;

  const severity = matchedPatterns.length >= 3 ? 'critical' : matchedPatterns.length >= 2 ? 'high' : 'medium';
  const truncated = payloadStr.length > 100 ? payloadStr.substring(0, 100) + '...' : payloadStr;

  return {
    detected: true,
    attack_type: config.ATTACK_TYPES.SQL_INJECTION,
    severity,
    title: `SQL Injection Attempt Detected on ${endpoint || 'Unknown Endpoint'}`,
    description: `Malicious SQL payload detected in ${method || 'request'} to ${endpoint || 'endpoint'}. Pattern matched: ${matchedPatterns.length} SQL injection signature(s). Payload excerpt: "${truncated}"`,
    metadata: { matched_patterns: matchedPatterns.length, endpoint, method, payload_excerpt: truncated }
  };
}

function detectXSS(logEntry) {
  const { payload, endpoint, method } = logEntry;
  if (!payload) return null;

  const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const matched = XSS_PATTERNS.some(p => p.test(payloadStr));

  if (!matched) return null;

  return {
    detected: true,
    attack_type: config.ATTACK_TYPES.XSS || 'XSS Attack',
    severity: 'high',
    title: `Cross-Site Scripting (XSS) Attempt on ${endpoint || 'Unknown Endpoint'}`,
    description: `XSS payload detected in request to ${endpoint || 'endpoint'}. Malicious script injection attempted.`,
    metadata: { endpoint, method }
  };
}

module.exports = { detectSQLInjection, detectXSS };
