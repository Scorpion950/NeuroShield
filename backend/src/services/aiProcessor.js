const config = require('../config/config');

// AI explanation templates for each attack type
const AI_TEMPLATES = {
  [config.ATTACK_TYPES.BRUTE_FORCE]: (alert) => ({
    explanation: `🔴 **Brute Force Attack Analysis**\n\nMultiple consecutive failed authentication attempts have been detected from IP address **${alert.ip_address || 'Unknown'}**, indicating an automated credential attack. The attacker is systematically trying different password combinations to gain unauthorized access.\n\n**Attack Pattern:** ${alert.metadata?.attempt_count || 'Multiple'} failed attempts within a short window, typical of automated tools like Hydra or Burp Suite.`,
    risk_assessment: `This attack poses a **${alert.severity.toUpperCase()}** risk. If successful, it could lead to full account takeover, data exfiltration, and lateral movement within the network.`,
    supporting_evidence: [
      `${alert.metadata?.attempt_count || 'Multiple'} failed login attempts detected`,
      `All attempts originating from IP: ${alert.ip_address || 'Unknown'}`,
      `Target accounts: ${alert.metadata?.target_usernames?.join(', ') || alert.username || 'Unknown'}`,
      `Attack window: Within last 5 minutes`
    ],
    recommendations: [
      'Immediately block IP address ' + (alert.ip_address || 'source IP') + ' at firewall level',
      'Enable Multi-Factor Authentication (MFA) for all accounts',
      'Implement account lockout after 5 failed attempts',
      'Apply rate limiting on authentication endpoints',
      'Review affected accounts for compromise indicators',
      'Enable CAPTCHA on login forms'
    ],
    mitigation_priority: 'IMMEDIATE'
  }),

  [config.ATTACK_TYPES.SQL_INJECTION]: (alert) => ({
    explanation: `🔴 **SQL Injection Attack Analysis**\n\nA SQL injection payload was detected in a request to **${alert.endpoint || 'Unknown Endpoint'}**. The attacker is attempting to manipulate backend database queries to extract sensitive data, bypass authentication, or corrupt data.\n\n**Attack Pattern:** Malicious SQL syntax embedded in user input fields, attempting to alter query logic.`,
    risk_assessment: `This attack poses a **${alert.severity.toUpperCase()}** risk. SQL injection can expose entire databases, enable authentication bypass, allow data manipulation, and potentially execute OS commands.`,
    supporting_evidence: [
      `Malicious SQL payload detected in ${alert.endpoint || 'request'}`,
      `${alert.metadata?.matched_patterns || 1} SQL injection pattern(s) matched`,
      `Source IP: ${alert.ip_address || 'Unknown'}`,
      `Attack method: ${alert.metadata?.method || 'POST'}`
    ],
    recommendations: [
      'Immediately sanitize and validate all user inputs server-side',
      'Use parameterized queries/prepared statements exclusively',
      'Block IP address ' + (alert.ip_address || 'source IP') + ' immediately',
      'Audit and review affected endpoint: ' + (alert.endpoint || 'endpoint'),
      'Enable Web Application Firewall (WAF) rules for SQL injection',
      'Review database logs for any successful exfiltration'
    ],
    mitigation_priority: 'IMMEDIATE'
  }),

  [config.ATTACK_TYPES.SUSPICIOUS_LOGIN]: (alert) => ({
    explanation: `🟡 **Suspicious Login Analysis**\n\nA successful login for account **"${alert.username || 'Unknown'}"** has been flagged with suspicious indicators: ${alert.metadata?.flags?.join(', ') || 'unusual patterns'}. This may indicate compromised credentials or unauthorized access from an unusual location.`,
    risk_assessment: `This activity poses a **${alert.severity.toUpperCase()}** risk. Suspicious logins from unknown locations or devices can indicate account takeover or credential theft.`,
    supporting_evidence: [
      `Login from unusual IP: ${alert.ip_address || 'Unknown'}`,
      `Suspicious flags: ${alert.metadata?.flags?.join(', ') || 'unusual location/device'}`,
      `Account targeted: ${alert.username || 'Unknown'}`,
      `Country of origin: ${alert.metadata?.country || 'Unknown'}`
    ],
    recommendations: [
      'Force password reset for account: ' + (alert.username || 'affected account'),
      'Enable MFA immediately for the affected account',
      'Review recent account activity for unauthorized changes',
      'Block IP: ' + (alert.ip_address || 'source IP') + ' if not a legitimate user',
      'Notify the account owner via secondary contact',
      'Review access logs for data exfiltration'
    ],
    mitigation_priority: 'HIGH'
  }),

  [config.ATTACK_TYPES.UNAUTHORIZED_ACCESS]: (alert) => ({
    explanation: `🔴 **Unauthorized Admin Access Analysis**\n\nAn attempt to access a privileged endpoint **"${alert.endpoint || 'Admin Area'}"** was made without proper authorization. This could be an insider threat, privilege escalation attempt, or external attacker probing for access control weaknesses.`,
    risk_assessment: `This attack poses a **${alert.severity.toUpperCase()}** risk. Unauthorized access to admin interfaces can lead to complete system compromise.`,
    supporting_evidence: [
      `Unauthorized access attempt to: ${alert.endpoint || 'admin endpoint'}`,
      `HTTP Status returned: ${alert.metadata?.status_code || '403 Forbidden'}`,
      `User attempting access: ${alert.username || 'Anonymous'}`,
      `Source IP: ${alert.ip_address || 'Unknown'}`
    ],
    recommendations: [
      'Review and strengthen access control policies',
      'Implement IP allowlisting for admin endpoints',
      'Audit user account: ' + (alert.username || 'attempting user'),
      'Enable admin activity audit logging',
      'Consider adding additional authentication layers for admin access',
      'Block repeated unauthorized access attempts from ' + (alert.ip_address || 'source IP')
    ],
    mitigation_priority: 'HIGH'
  }),

  [config.ATTACK_TYPES.PRIVILEGE_ESCALATION]: (alert) => ({
    explanation: `🔴 **Privilege Escalation Analysis**\n\nAn attempt to escalate user privileges was detected for account **"${alert.username || 'Unknown'}"**. The request contained parameters attempting to modify user roles or grant administrative access without authorization.`,
    risk_assessment: `This attack poses a **CRITICAL** risk. Successful privilege escalation gives attackers full administrative control over the system.`,
    supporting_evidence: [
      `Privilege escalation parameters detected: ${alert.metadata?.matched_indicators?.join(', ') || 'role modification'}`,
      `Endpoint targeted: ${alert.endpoint || 'Unknown'}`,
      `User account: ${alert.username || 'Unknown'}`,
      `Source IP: ${alert.ip_address || 'Unknown'}`
    ],
    recommendations: [
      'Immediately lock account: ' + (alert.username || 'affected account'),
      'Review all recent actions by this user',
      'Audit role and permission assignments in the database',
      'Implement server-side role validation (never trust client-side)',
      'Block IP: ' + (alert.ip_address || 'source IP'),
      'Initiate full security incident response'
    ],
    mitigation_priority: 'CRITICAL'
  }),

  [config.ATTACK_TYPES.EXCESSIVE_REQUESTS]: (alert) => ({
    explanation: `🟡 **Excessive Requests / DDoS Analysis**\n\nIP address **${alert.ip_address || 'Unknown'}** has sent an abnormally high volume of requests (${alert.metadata?.request_count || 'many'} requests, ~${alert.metadata?.requests_per_second || 'high'} req/s). This pattern indicates either a DDoS attack, aggressive scraping, or automated abuse.`,
    risk_assessment: `This poses a **${alert.severity.toUpperCase()}** risk. Excessive requests can degrade service availability and impact legitimate users.`,
    supporting_evidence: [
      `${alert.metadata?.request_count || 'High'} requests in short window`,
      `Rate: ~${alert.metadata?.requests_per_second || 'High'} requests/second`,
      `Source IP: ${alert.ip_address || 'Unknown'}`,
      `Target application: ${alert.source_app || 'Unknown'}`
    ],
    recommendations: [
      'Apply rate limiting rules for IP: ' + (alert.ip_address || 'source IP'),
      'Temporarily block the offending IP at load balancer level',
      'Enable CDN/DDoS protection for the application',
      'Implement CAPTCHA for suspicious request patterns',
      'Review server capacity and auto-scaling rules',
      'Analyze traffic to distinguish DDoS from legitimate traffic spikes'
    ],
    mitigation_priority: 'HIGH'
  }),

  [config.ATTACK_TYPES.ABNORMAL_BEHAVIOR]: (alert) => ({
    explanation: `🟡 **Abnormal User Behavior Analysis**\n\nAccount **"${alert.username || 'Unknown'}"** is exhibiting behavioral patterns inconsistent with normal usage: ${alert.metadata?.flags?.join(', ') || 'unusual patterns'}. This could indicate a compromised account, insider threat, or automated bot activity.`,
    risk_assessment: `This poses a **${alert.severity.toUpperCase()}** risk. Abnormal behavior may indicate ongoing data exfiltration or system abuse.`,
    supporting_evidence: [
      `Accessing from ${alert.metadata?.unique_ips || 'multiple'} different IP addresses`,
      `Accessing ${alert.metadata?.unique_endpoints || 'many'} different endpoints`,
      `Request rate: ${alert.metadata?.request_rate || 'High'} requests/minute`,
      `Flags triggered: ${alert.metadata?.flags?.join(', ') || 'multiple'}`
    ],
    recommendations: [
      'Temporarily suspend account: ' + (alert.username || 'affected account') + ' for review',
      'Request re-authentication with MFA',
      'Review all recent actions and data accessed by this account',
      'Check for session hijacking indicators',
      'Implement behavioral analytics baseline for this user',
      'Notify account owner and verify activity legitimacy'
    ],
    mitigation_priority: 'MEDIUM'
  })
};

const DEFAULT_TEMPLATE = (alert) => ({
  explanation: `⚠️ **Security Threat Analysis**\n\nA ${alert.severity} severity security event has been detected from IP **${alert.ip_address || 'Unknown'}**. Attack type: **${alert.attack_type}**. ${alert.description}`,
  risk_assessment: `This poses a **${alert.severity.toUpperCase()}** risk and requires immediate attention.`,
  supporting_evidence: [
    `Attack type: ${alert.attack_type}`,
    `Source: ${alert.ip_address || 'Unknown'}`,
    `Application: ${alert.source_app || 'Unknown'}`,
    `Detected at: ${alert.created_at}`
  ],
  recommendations: [
    'Investigate the source IP and block if malicious',
    'Review affected systems and accounts',
    'Enable additional monitoring for this IP range',
    'Document and escalate if pattern continues'
  ],
  mitigation_priority: alert.severity === 'critical' ? 'CRITICAL' : alert.severity === 'high' ? 'HIGH' : 'MEDIUM'
});

function generateAIExplanation(alert) {
  try {
    const template = AI_TEMPLATES[alert.attack_type] || DEFAULT_TEMPLATE;
    const analysis = template(alert);

    const explanation = `${analysis.explanation}\n\n**Risk Assessment:** ${analysis.risk_assessment}`;
    const recommendation = `**Recommended Actions (Priority: ${analysis.mitigation_priority}):**\n${analysis.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}\n\n**Supporting Evidence:**\n${analysis.supporting_evidence.map(e => `• ${e}`).join('\n')}`;

    return { explanation, recommendation, analysis };
  } catch (err) {
    console.error('[AIProcessor] Template error:', err);
    return {
      explanation: `Security threat detected: ${alert.title}. ${alert.description}`,
      recommendation: 'Investigate the alert and take appropriate action based on severity level.',
      analysis: null
    };
  }
}

function generateDailySummary(alerts) {
  const critical = alerts.filter(a => a.severity === 'critical').length;
  const high = alerts.filter(a => a.severity === 'high').length;
  const medium = alerts.filter(a => a.severity === 'medium').length;
  const low = alerts.filter(a => a.severity === 'low').length;

  const topAttacks = {};
  alerts.forEach(a => { topAttacks[a.attack_type] = (topAttacks[a.attack_type] || 0) + 1; });
  const sortedAttacks = Object.entries(topAttacks).sort((a, b) => b[1] - a[1]).slice(0, 3);

  return {
    summary: `**AI Security Summary - ${new Date().toLocaleDateString()}**\n\nTotal alerts today: **${alerts.length}**\n• 🔴 Critical: ${critical}\n• 🟠 High: ${high}\n• 🟡 Medium: ${medium}\n• 🟢 Low: ${low}\n\n**Top Threats:**\n${sortedAttacks.map(([type, count]) => `• ${type}: ${count} incidents`).join('\n')}`,
    priority_action: critical > 0 ? `IMMEDIATE ACTION REQUIRED: ${critical} critical threat(s) detected` : high > 0 ? `Review ${high} high-severity alert(s) promptly` : 'No immediate action required',
    risk_level: critical > 0 ? 'CRITICAL' : high > 3 ? 'HIGH' : high > 0 ? 'MEDIUM' : 'LOW'
  };
}

module.exports = { generateAIExplanation, generateDailySummary };
