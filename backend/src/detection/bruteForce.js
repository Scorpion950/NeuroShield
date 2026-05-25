const config = require('../config/config');

// Track request windows per IP/user
const requestWindows = new Map();

function detectBruteForce(logEntry) {
  const { ip_address, username, status_code, endpoint, method } = logEntry;
  const isFailedLogin = (
    (endpoint && (endpoint.includes('/login') || endpoint.includes('/auth') || endpoint.includes('/signin'))) &&
    method === 'POST' &&
    (status_code === 401 || status_code === 403 || status_code === 400)
  );

  if (!isFailedLogin) return null;

  const key = `brute:${ip_address}`;
  const now = Date.now();
  const window = requestWindows.get(key) || { count: 0, first: now, ips: new Set(), usernames: new Set() };

  if (now - window.first > config.THREAT_THRESHOLDS.BRUTE_FORCE_WINDOW_MS) {
    window.count = 0;
    window.first = now;
    window.ips = new Set();
    window.usernames = new Set();
  }

  window.count++;
  if (ip_address) window.ips.add(ip_address);
  if (username) window.usernames.add(username);
  requestWindows.set(key, window);

  // Fire alert on every attempt after threshold
  if (window.count < config.THREAT_THRESHOLDS.BRUTE_FORCE_ATTEMPTS) return null;

  const severity = window.count >= 20 ? 'critical' : window.count >= 10 ? 'high' : 'medium';
  return {
    detected: true,
    attack_type: config.ATTACK_TYPES.BRUTE_FORCE,
    severity,
    title: `Brute Force Attack Detected - ${window.count} Failed Attempts`,
    description: `${window.count} consecutive failed login attempts detected from IP ${ip_address}${username ? ` targeting account "${username}"` : ''} within the last ${Math.round(config.THREAT_THRESHOLDS.BRUTE_FORCE_WINDOW_MS / 60000)} minutes.`,
    metadata: { attempt_count: window.count, unique_ips: [...window.ips], target_usernames: [...window.usernames] }
  };
}

function detectSuspiciousLogin(logEntry) {
  const { ip_address, username, status_code, endpoint, payload, metadata } = logEntry;
  if (!endpoint || !endpoint.includes('/login')) return null;
  if (status_code !== 200) return null;

  const suspiciousCountries = ['CN', 'RU', 'KP', 'IR', 'SY'];
  const meta = metadata ? (typeof metadata === 'string' ? JSON.parse(metadata) : metadata) : {};
  const country = meta.country || '';
  const isNewDevice = meta.new_device || false;
  const isNewLocation = meta.new_location || false;
  const isVpn = meta.vpn || false;
  const isTor = meta.tor || false;

  const flags = [];
  if (suspiciousCountries.includes(country)) flags.push(`unusual country (${country})`);
  // Only flag new_device + new_location together (not individually — too noisy for legit users)
  if (isNewDevice && isNewLocation) flags.push('new device from new location');
  if (isVpn) flags.push('VPN detected');
  if (isTor) flags.push('Tor exit node detected');

  // Require at least 2 suspicious signals OR one of the high-confidence ones (VPN from suspicious country, Tor)
  const isHighConfidence = isTor || (isVpn && suspiciousCountries.includes(country)) || suspiciousCountries.includes(country);
  if (flags.length >= 2 || isHighConfidence) {
    const severity = isTor || (isVpn && suspiciousCountries.includes(country)) ? 'high' : 'medium';
    return {
      detected: true,
      attack_type: config.ATTACK_TYPES.SUSPICIOUS_LOGIN,
      severity,
      title: `Suspicious Login Detected for "${username || 'Unknown'}"`,
      description: `Successful login with suspicious indicators: ${flags.join(', ')}. IP: ${ip_address}, Account: ${username || 'Unknown'}.`,
      metadata: { flags, country, ip_address, username }
    };
  }
  return null;
}

function detectExcessiveRequests(logEntry, windowMap) {
  const { ip_address, endpoint, application_id } = logEntry;
  if (!ip_address) return null;

  const key = `excess:${ip_address}:${application_id}`;
  const now = Date.now();
  const window = windowMap.get(key) || { count: 0, first: now };

  if (now - window.first > config.THREAT_THRESHOLDS.API_ABUSE_WINDOW_MS) {
    window.count = 0;
    window.first = now;
  }

  window.count++;
  windowMap.set(key, window);

  if (window.count >= config.THREAT_THRESHOLDS.API_ABUSE_REQUESTS) {
    const rps = Math.round(window.count / ((now - window.first) / 1000));
    const severity = window.count >= 200 ? 'critical' : window.count >= 100 ? 'high' : 'medium';
    return {
      detected: true,
      attack_type: config.ATTACK_TYPES.EXCESSIVE_REQUESTS,
      severity,
      title: `Excessive Request Rate from ${ip_address}`,
      description: `IP ${ip_address} has sent ${window.count} requests in ${Math.round(config.THREAT_THRESHOLDS.API_ABUSE_WINDOW_MS / 1000)}s (~${rps} req/s). Possible DDoS or automated scraping.`,
      metadata: { request_count: window.count, requests_per_second: rps, ip_address }
    };
  }
  return null;
}

module.exports = { detectBruteForce, detectSuspiciousLogin, detectExcessiveRequests, requestWindows };
