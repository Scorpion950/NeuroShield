const config = require('../config/config');

const ADMIN_PATHS = [
  '/admin', '/admin/', '/api/admin', '/dashboard/admin',
  '/manage', '/management', '/control', '/panel',
  '/superuser', '/root', '/system', '/internal'
];

const PRIVILEGE_ESCALATION_INDICATORS = [
  'role=admin', 'role=superadmin', 'isAdmin=true', 'admin=1',
  'privilege=', 'escalate', 'sudo', 'grant_admin', 'make_admin',
  'change_role', 'promote', 'user_type=admin'
];

function detectUnauthorizedAccess(logEntry) {
  const { endpoint, status_code, username, ip_address, method } = logEntry;
  if (!endpoint) return null;

  const isAdminPath = ADMIN_PATHS.some(path => endpoint.toLowerCase().startsWith(path));
  const isUnauthorized = status_code === 401 || status_code === 403;

  if (isAdminPath && isUnauthorized) {
    return {
      detected: true,
      attack_type: config.ATTACK_TYPES.UNAUTHORIZED_ACCESS,
      severity: 'high',
      title: `Unauthorized Admin Access Attempt on ${endpoint}`,
      description: `${method || 'Request'} to privileged endpoint "${endpoint}" was rejected with ${status_code}. User: ${username || 'Anonymous'}, IP: ${ip_address || 'Unknown'}.`,
      metadata: { endpoint, status_code, username, ip_address }
    };
  }
  return null;
}

function detectPrivilegeEscalation(logEntry) {
  const { payload, endpoint, username, ip_address, method, status_code } = logEntry;
  if (!payload && !endpoint) return null;

  const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload || '');
  const combined = `${payloadStr} ${endpoint || ''}`.toLowerCase();

  const matched = PRIVILEGE_ESCALATION_INDICATORS.filter(indicator =>
    combined.includes(indicator.toLowerCase())
  );

  if (matched.length === 0) return null;

  return {
    detected: true,
    attack_type: config.ATTACK_TYPES.PRIVILEGE_ESCALATION,
    severity: 'critical',
    title: `Privilege Escalation Attempt Detected`,
    description: `Attempt to escalate privileges detected in ${method || 'request'} to ${endpoint || 'unknown endpoint'}. Suspicious parameters: ${matched.join(', ')}. User: ${username || 'Anonymous'}, IP: ${ip_address || 'Unknown'}.`,
    metadata: { matched_indicators: matched, endpoint, username, ip_address, status_code }
  };
}

function detectAbnormalBehavior(logEntry, userActivityMap) {
  const { username, endpoint, ip_address, metadata } = logEntry;
  if (!username) return null;

  const meta = metadata ? (typeof metadata === 'string' ? JSON.parse(metadata) : metadata) : {};
  const key = `behavior:${username}`;
  const now = Date.now();
  const activity = userActivityMap.get(key) || {
    requests: 0, endpoints: new Set(), ips: new Set(), first: now, last: now
  };

  activity.requests++;
  if (endpoint) activity.endpoints.add(endpoint);
  if (ip_address) activity.ips.add(ip_address);
  activity.last = now;
  userActivityMap.set(key, activity);

  const timeWindow = (activity.last - activity.first) / 1000 / 60; // minutes
  const uniqueIPs = activity.ips.size;
  const uniqueEndpoints = activity.endpoints.size;
  const requestRate = timeWindow > 0 ? activity.requests / timeWindow : activity.requests;

  // Flags: Multiple IPs + high request rate + many endpoints
  const flags = [];
  if (uniqueIPs >= 3) flags.push(`accessing from ${uniqueIPs} different IPs`);
  if (requestRate > 30) flags.push(`unusually high request rate (${Math.round(requestRate)}/min)`);
  if (uniqueEndpoints > 15) flags.push(`accessing ${uniqueEndpoints} different endpoints`);
  if (meta.after_hours) flags.push('after-hours access');

  if (flags.length >= 2) {
    return {
      detected: true,
      attack_type: config.ATTACK_TYPES.ABNORMAL_BEHAVIOR,
      severity: flags.length >= 3 ? 'high' : 'medium',
      title: `Abnormal User Behavior Detected for "${username}"`,
      description: `Account "${username}" is exhibiting unusual behavior patterns: ${flags.join(', ')}.`,
      metadata: { username, flags, unique_ips: uniqueIPs, unique_endpoints: uniqueEndpoints, request_rate: Math.round(requestRate) }
    };
  }
  return null;
}

module.exports = { detectUnauthorizedAccess, detectPrivilegeEscalation, detectAbnormalBehavior };
