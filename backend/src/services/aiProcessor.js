const config = require('../config/config');
const { GoogleGenerativeAI } = require('@google/generative-ai');

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


// ─────────────────────────────────────────────────────────────────────────────
// Chatbot: Gemini-powered context-aware chat with rule-based fallback
// ─────────────────────────────────────────────────────────────────────────────

const FALLBACK_RULES = [
  {
    keywords: ['top threat', 'main threat', 'biggest threat', 'most common'],
    answer: (ctx) => `Based on the last 24 hours, your top threats are:\n${ctx.topThreats.map((t, i) => `${i + 1}. **${t.attack_type}** — ${t.count} incident(s) (max severity: ${t.max_severity})`).join('\n')}\n\nFocus your defences on blocking repeated offenders at the firewall level.`
  },
  {
    keywords: ['risk level', 'current risk', 'risk status', 'how bad'],
    answer: (ctx) => `The current system risk level is **${ctx.riskLevel}**.\n\n• 🔴 Critical alerts: ${ctx.critical}\n• 🟠 High alerts: ${ctx.high}\n• 🟡 Medium alerts: ${ctx.medium}\n• 🟢 Low alerts: ${ctx.low}\n\nTotal alerts in the last 24 hours: **${ctx.totalAlerts}**.`
  },
  {
    keywords: ['brute force', 'brute-force', 'password attack', 'credential'],
    answer: () => `**Brute Force Attack Mitigation:**\n1. Block the offending IP at the firewall immediately\n2. Enable account lockout after 5 failed attempts\n3. Enforce Multi-Factor Authentication (MFA) for all accounts\n4. Apply rate limiting on auth endpoints (e.g., 10 req/min per IP)\n5. Enable CAPTCHA on login forms\n6. Alert targeted users and force a password reset`
  },
  {
    keywords: ['sql injection', 'sqli', 'sql attack', 'database injection'],
    answer: () => `**SQL Injection Mitigation:**\n1. Use parameterized queries / prepared statements — never string concatenation\n2. Validate and sanitize ALL user inputs server-side\n3. Enable a Web Application Firewall (WAF) with SQL injection rules\n4. Block the offending IP immediately\n5. Audit database logs for any successful data exfiltration\n6. Review and harden affected endpoints`
  },
  {
    keywords: ['block ip', 'which ip', 'suspicious ip', 'ip to block', 'ips to block'],
    answer: (ctx) => `IPs from recent **high/critical** alerts that you should consider blocking:\n${ctx.suspiciousIPs.length > 0 ? ctx.suspiciousIPs.map(ip => `• \`${ip}\``).join('\n') : '• No specific IPs flagged in the last 24 hours.'}\n\nBlock these at your firewall or load balancer level.`
  },
  {
    keywords: ['summary', 'summarize', 'what happened', 'today', 'overview'],
    answer: (ctx) => `**Security Summary for today:**\n\n• Total alerts: **${ctx.totalAlerts}**\n• Risk level: **${ctx.riskLevel}**\n• Critical: ${ctx.critical} | High: ${ctx.high} | Medium: ${ctx.medium} | Low: ${ctx.low}\n\n**Top attack types:**\n${ctx.topThreats.slice(0, 3).map((t, i) => `${i + 1}. ${t.attack_type} (${t.count} incidents)`).join('\n') || 'None detected'}\n\n${ctx.critical > 0 ? '⚠️ IMMEDIATE ACTION REQUIRED — critical threats detected.' : ctx.high > 0 ? 'Review high-severity alerts promptly.' : '✅ No critical threats. Continue monitoring.'}`
  },
  {
    keywords: ['privilege escalation', 'privilege', 'escalation', 'admin access'],
    answer: () => `**Privilege Escalation Mitigation:**\n1. Immediately lock the affected account\n2. Audit all recent actions performed by that user\n3. Review role and permission assignments in the database\n4. Enforce server-side role validation — never trust client-supplied roles\n5. Implement the Principle of Least Privilege (PoLP)\n6. Initiate a full incident response process`
  },
  {
    keywords: ['ddos', 'dos attack', 'excessive request', 'rate limit', 'flood'],
    answer: () => `**DDoS / Excessive Requests Mitigation:**\n1. Apply IP-level rate limiting at your load balancer\n2. Enable CDN/DDoS protection (e.g., Cloudflare)\n3. Temporarily block the offending IP range\n4. Implement request throttling on API endpoints\n5. Add CAPTCHA for suspicious traffic patterns\n6. Review auto-scaling rules to absorb legitimate traffic spikes`
  },
  {
    keywords: ['help', 'what can you do', 'what can i ask', 'capabilities', 'hi', 'hello'],
    answer: () => `I'm the **NeuroShield AI Security Assistant**! Here's what I can help with:\n\n• 📊 **Threat overview** — "What are my top threats today?"\n• 🔴 **Risk level** — "What is the current risk level?"\n• 🛡️ **Remediation** — "How do I mitigate SQL injection?"\n• 🚫 **IP blocking** — "Which IPs should I block?"\n• 📋 **Daily summary** — "Summarize today's incidents"\n• 🔑 **Attack explanations** — "Explain brute force attacks"\n\nJust ask naturally!`
  }
];

async function generateChatResponse(userMessage, conversationHistory = [], dbContext = {}) {
  const ctx = {
    totalAlerts: dbContext.totalAlerts || 0,
    critical: dbContext.critical || 0,
    high: dbContext.high || 0,
    medium: dbContext.medium || 0,
    low: dbContext.low || 0,
    riskLevel: dbContext.riskLevel || 'LOW',
    topThreats: dbContext.topThreats || [],
    suspiciousIPs: dbContext.suspiciousIPs || [],
    recentAlerts: dbContext.recentAlerts || []
  };

  let geminiError = null;
  const apiKey = process.env.GEMINI_API_KEY;

  // ── Gemini path ──────────────────────────────────────────────────────────
  if (apiKey && apiKey.trim().length > 0) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

      const systemContext = `You are the NeuroShield AI Security Assistant — an expert cybersecurity analyst embedded in the NeuroShield threat detection platform. Answer concisely and helpfully. Use markdown formatting (bold, bullet lists) in responses.

LIVE SECURITY CONTEXT (last 24 hours):
- Total alerts: ${ctx.totalAlerts}
- Critical: ${ctx.critical} | High: ${ctx.high} | Medium: ${ctx.medium} | Low: ${ctx.low}
- Current risk level: ${ctx.riskLevel}
- Top threats: ${ctx.topThreats.map(t => `${t.attack_type} (${t.count} incidents, max severity: ${t.max_severity})`).join(', ') || 'None'}
- Suspicious IPs: ${ctx.suspiciousIPs.join(', ') || 'None identified'}
- Recent critical/high alerts: ${ctx.recentAlerts.slice(0, 5).map(a => `${a.title} [${a.severity}]`).join('; ') || 'None'}

Use this live data to give accurate, context-aware answers. When asked about specific threats or remediation, provide actionable steps. Keep answers under 300 words unless detail is needed.`;

      const history = conversationHistory.slice(-8).map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

      const chat = model.startChat({
        history: [
          { role: 'user', parts: [{ text: systemContext }] },
          { role: 'model', parts: [{ text: 'Understood. I am the NeuroShield AI Security Assistant, ready to help with threat analysis and security recommendations based on live data.' }] },
          ...history
        ]
      });

      const result = await chat.sendMessage(userMessage);
      return { reply: result.response.text(), source: 'gemini' };
    } catch (err) {
      console.error('[ChatBot] Gemini error, falling back to rules:', err.message);
      geminiError = err.message;
    }
  }

  // ── Rule-based fallback ───────────────────────────────────────────────────
  const msgLower = userMessage.toLowerCase();
  for (const rule of FALLBACK_RULES) {
    if (rule.keywords.some(kw => msgLower.includes(kw))) {
      return { reply: rule.answer(ctx), source: 'rules' };
    }
  }

  const offlineReason = geminiError ? `(Google API Error: ${geminiError})` : '(invalid/missing API key in Vercel Environment Variables)';

  return {
    reply: `I am the NeuroShield AI. I heard you say: "${userMessage}".\n\n*Note: My advanced Gemini connection is currently offline ${offlineReason}, so I am operating in **rules-based mode**.*\n\nI can still help you with live data! Try asking:\n• 📊 "What are my top threats?"\n• 🔴 "What is the current risk level?"\n• 🚫 "Which IPs should I block?"\n• 🛡️ "How to mitigate brute force?"\n\n*(To enable full conversational AI, please ensure your GEMINI_API_KEY is active and Vercel has been redeployed.)*`,
    source: 'rules'
  };
}

module.exports = { generateAIExplanation, generateDailySummary, generateChatResponse };
