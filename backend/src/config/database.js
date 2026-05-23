const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const config = require('./config');

let db;

function getDb() {
  if (!db) {
    const dbDir = path.dirname(config.DB_PATH);
    if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
    db = new Database(config.DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

function initializeDatabase() {
  const db = getDb();

  // Users table (admin accounts)
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      email TEXT,
      role TEXT DEFAULT 'admin',
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME,
      is_active INTEGER DEFAULT 1
    )
  `);

  // Applications table (connected apps)
  db.exec(`
    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      url TEXT,
      type TEXT DEFAULT 'web',
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_seen DATETIME,
      total_alerts INTEGER DEFAULT 0,
      critical_alerts INTEGER DEFAULT 0,
      is_internal INTEGER DEFAULT 0
    )
  `);

  // API Keys table
  db.exec(`
    CREATE TABLE IF NOT EXISTS api_keys (
      id TEXT PRIMARY KEY,
      key_value TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      application_id TEXT,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_used DATETIME,
      is_active INTEGER DEFAULT 1,
      permissions TEXT DEFAULT 'ingest',
      FOREIGN KEY (application_id) REFERENCES applications(id)
    )
  `);

  // Alerts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS alerts (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      severity TEXT NOT NULL,
      attack_type TEXT NOT NULL,
      source_app TEXT,
      source_app_id TEXT,
      ip_address TEXT,
      username TEXT,
      endpoint TEXT,
      raw_log TEXT,
      ai_explanation TEXT,
      ai_recommendation TEXT,
      status TEXT DEFAULT 'active',
      is_false_positive INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      resolved_at DATETIME,
      resolved_by TEXT,
      metadata TEXT
    )
  `);

  // Incidents table
  db.exec(`
    CREATE TABLE IF NOT EXISTS incidents (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      severity TEXT NOT NULL,
      status TEXT DEFAULT 'open',
      alert_ids TEXT,
      assigned_to TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      resolved_at DATETIME,
      timeline TEXT,
      notes TEXT
    )
  `);

  // Logs table (raw ingested logs)
  db.exec(`
    CREATE TABLE IF NOT EXISTS logs (
      id TEXT PRIMARY KEY,
      application_id TEXT,
      source_app TEXT,
      level TEXT DEFAULT 'info',
      message TEXT NOT NULL,
      ip_address TEXT,
      username TEXT,
      endpoint TEXT,
      method TEXT,
      status_code INTEGER,
      payload TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      processed INTEGER DEFAULT 0,
      alert_id TEXT
    )
  `);

  // System stats table
  db.exec(`
    CREATE TABLE IF NOT EXISTS system_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      metric TEXT NOT NULL,
      value REAL NOT NULL,
      recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Seed default admin accounts
  seedAdmins(db);
  // Seed MiniBank application
  seedMiniBank(db);

  console.log('[DB] Database initialized successfully');
  return db;
}

function seedAdmins(db) {
  const admins = [
    { id: 'admin-yash-001', username: 'yash', password: 'Yash123', email: 'yash@neuroshield.io' },
    { id: 'admin-shravani-001', username: 'shravani', password: 'Shravani', email: 'shravani@neuroshield.io' }
  ];

  for (const admin of admins) {
    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(admin.username);
    if (!existing) {
      const hash = bcrypt.hashSync(admin.password, 10);
      db.prepare(`
        INSERT INTO users (id, username, password, email, role, created_by)
        VALUES (?, ?, ?, ?, 'super_admin', 'system')
      `).run(admin.id, admin.username, hash, admin.email);
      console.log(`[DB] Admin account created: ${admin.username}`);
    }
  }
}

function seedMiniBank(db) {
  const existing = db.prepare("SELECT id FROM applications WHERE id = 'app-minibank-001'").get();
  if (!existing) {
    db.prepare(`
      INSERT INTO applications (id, name, description, url, type, status, is_internal)
      VALUES ('app-minibank-001', 'MiniBank', 'Simulated Banking Application - Internal Demo', 'http://localhost:5001', 'banking', 'active', 1)
    `).run();
    console.log('[DB] MiniBank application registered');
  }

  // Seed MiniBank API key
  const existingKey = db.prepare("SELECT id FROM api_keys WHERE id = 'key-minibank-001'").get();
  if (!existingKey) {
    db.prepare(`
      INSERT INTO api_keys (id, key_value, name, application_id, created_by, is_active, permissions)
      VALUES ('key-minibank-001', 'mb-api-key-neuroshield-internal-2024', 'MiniBank Internal Key', 'app-minibank-001', 'system', 1, 'ingest')
    `).run();
    console.log('[DB] MiniBank API key created');
  }
}

module.exports = { getDb, initializeDatabase };
