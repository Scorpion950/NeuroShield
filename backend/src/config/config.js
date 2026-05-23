const path = require('path');

module.exports = {
  PORT: process.env.PORT || 5000,
  MINIBANK_PORT: process.env.MINIBANK_PORT || 5001,
  JWT_SECRET: process.env.JWT_SECRET || 'neuroshield-super-secret-jwt-key-2024',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  DB_PATH: process.env.DB_PATH || path.join(__dirname, '../../data/neuroshield.db'),
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  MINIBANK_URL: process.env.MINIBANK_URL || 'http://localhost:5001',
  NEUROSHIELD_URL: process.env.NEUROSHIELD_URL || 'http://localhost:5000',
  CORS_ORIGINS: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5001'],
  RATE_LIMIT: {
    windowMs: 15 * 60 * 1000,
    max: 1000
  },
  THREAT_THRESHOLDS: {
    BRUTE_FORCE_ATTEMPTS: 5,
    BRUTE_FORCE_WINDOW_MS: 5 * 60 * 1000,
    API_ABUSE_REQUESTS: 50,
    API_ABUSE_WINDOW_MS: 60 * 1000,
    SUSPICIOUS_IP_COUNTRIES: ['CN', 'RU', 'KP', 'IR'],
  },
  SEVERITY_LEVELS: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
  },
  ATTACK_TYPES: {
    BRUTE_FORCE: 'Brute Force Attack',
    SQL_INJECTION: 'SQL Injection',
    API_ABUSE: 'API Abuse',
    UNAUTHORIZED_ACCESS: 'Unauthorized Admin Access',
    PRIVILEGE_ESCALATION: 'Privilege Escalation',
    SUSPICIOUS_LOGIN: 'Suspicious Login',
    EXCESSIVE_REQUESTS: 'Excessive Requests',
    ABNORMAL_BEHAVIOR: 'Abnormal User Behavior',
    XSS: 'Cross-Site Scripting (XSS)',
    CREDENTIAL_STUFFING: 'Credential Stuffing'
  }
};
