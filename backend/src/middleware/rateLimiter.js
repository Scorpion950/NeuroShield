const rateLimit = require('express-rate-limit');

// General API Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests from this IP, please try again after 15 minutes' }
});

// Strict Login Rate Limiter to prevent brute force on admin panel
const loginLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 5, // Limit each IP to 5 login requests per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts, please try again after an hour' }
});

// Ingestion Rate Limiter to prevent log spamming
const ingestLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: 300, // Limit each IP to 300 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Log ingestion rate limit exceeded, please slow down' }
});

module.exports = { apiLimiter, loginLimiter, ingestLimiter };
