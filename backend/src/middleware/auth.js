const jwt = require('jsonwebtoken');
const { getDb } = require('../config/database');
const config = require('../config/config');

function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.JWT_SECRET);
    const db = getDb();
    const user = db.prepare('SELECT id, username, email, role, is_active FROM users WHERE id = ?').get(decoded.id);
    if (!user || !user.is_active) {
      return res.status(401).json({ success: false, message: 'Invalid or expired session.' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
}

function superAdminOnly(req, res, next) {
  if (req.user && req.user.role === 'super_admin') return next();
  return res.status(403).json({ success: false, message: 'Super admin access required.' });
}

module.exports = { authMiddleware, superAdminOnly };
