const express = require('express');
const { query, queryOne, execute } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// GET /api/blocked-ips
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { active } = req.query;
    let sql = 'SELECT * FROM blocked_ips';
    const params = [];
    if (active !== undefined) { sql += ' WHERE is_active = $1'; params.push(active === 'true' ? 1 : 0); }
    sql += ' ORDER BY created_at DESC';
    const ips = await query(sql, params);
    res.json({ success: true, blocked_ips: ips, total: ips.length });
  } catch (err) {
    console.error('[BlockedIPs] GET error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch blocked IPs.' });
  }
});

// POST /api/blocked-ips
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { ip_address, reason, alert_id, expires_at } = req.body;
    if (!ip_address) return res.status(400).json({ success: false, message: 'ip_address is required.' });

    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
    if (!ipv4Regex.test(ip_address) && !ipv6Regex.test(ip_address) && ip_address !== '::1' && ip_address !== 'localhost') {
      return res.status(400).json({ success: false, message: 'Invalid IP address format.' });
    }

    const existing = await queryOne('SELECT * FROM blocked_ips WHERE ip_address = $1', [ip_address]);
    if (existing) {
      if (existing.is_active) return res.status(409).json({ success: false, message: `IP ${ip_address} is already blocked.` });
      await execute(
        'UPDATE blocked_ips SET is_active = 1, reason = $1, blocked_by = $2, alert_id = $3, expires_at = $4, created_at = NOW() WHERE ip_address = $5',
        [reason || 'Manual block', req.user.username, alert_id || null, expires_at || null, ip_address]
      );
      const updated = await queryOne('SELECT * FROM blocked_ips WHERE ip_address = $1', [ip_address]);
      return res.json({ success: true, message: `IP ${ip_address} has been re-blocked.`, blocked_ip: updated });
    }

    const id = uuidv4();
    await execute(
      'INSERT INTO blocked_ips (id, ip_address, reason, blocked_by, alert_id, expires_at, is_active) VALUES ($1, $2, $3, $4, $5, $6, 1)',
      [id, ip_address, reason || 'Manual block', req.user.username, alert_id || null, expires_at || null]
    );
    const blockedIp = await queryOne('SELECT * FROM blocked_ips WHERE id = $1', [id]);
    res.status(201).json({ success: true, message: `IP ${ip_address} has been blocked.`, blocked_ip: blockedIp });
  } catch (err) {
    console.error('[BlockedIPs] POST error:', err);
    res.status(500).json({ success: false, message: 'Failed to block IP.' });
  }
});

// DELETE /api/blocked-ips/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const entry = await queryOne('SELECT * FROM blocked_ips WHERE id = $1', [req.params.id]);
    if (!entry) return res.status(404).json({ success: false, message: 'Blocked IP entry not found.' });
    await execute('UPDATE blocked_ips SET is_active = 0 WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: `IP ${entry.ip_address} has been unblocked.` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to unblock IP.' });
  }
});

// GET /api/blocked-ips/check/:ip
router.get('/check/:ip', async (req, res) => {
  try {
    const entry = await queryOne('SELECT * FROM blocked_ips WHERE ip_address = $1 AND is_active = 1', [req.params.ip]);
    if (entry) {
      if (entry.expires_at && new Date(entry.expires_at) < new Date()) {
        await execute('UPDATE blocked_ips SET is_active = 0 WHERE id = $1', [entry.id]);
        return res.json({ blocked: false });
      }
      return res.json({ blocked: true, reason: entry.reason, blocked_by: entry.blocked_by, since: entry.created_at });
    }
    res.json({ blocked: false });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Check failed.' });
  }
});

module.exports = router;
