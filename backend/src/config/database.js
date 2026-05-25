const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

let pool;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL?.includes('neon.tech') || process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false
    });
    pool.on('error', (err) => {
      console.error('[DB] Unexpected pool error:', err.message);
    });
  }
  return pool;
}

// Helper: run a query and return all rows
async function query(sql, params = []) {
  const client = getPool();
  const result = await client.query(sql, params);
  return result.rows;
}

// Helper: run a query and return the first row
async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

// Helper: run an INSERT/UPDATE/DELETE and return rowCount
async function execute(sql, params = []) {
  const client = getPool();
  const result = await client.query(sql, params);
  return result;
}

async function initializeDatabase() {
  const client = getPool();

  await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      email TEXT,
      role TEXT DEFAULT 'admin',
      created_by TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      last_login TIMESTAMPTZ,
      is_active INTEGER DEFAULT 1
    )
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      url TEXT,
      type TEXT DEFAULT 'web',
      status TEXT DEFAULT 'active',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      last_seen TIMESTAMPTZ,
      total_alerts INTEGER DEFAULT 0,
      critical_alerts INTEGER DEFAULT 0,
      is_internal INTEGER DEFAULT 0
    )
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS api_keys (
      id TEXT PRIMARY KEY,
      key_value TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      application_id TEXT,
      created_by TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      last_used TIMESTAMPTZ,
      is_active INTEGER DEFAULT 1,
      permissions TEXT DEFAULT 'ingest'
    )
  `);

  await client.query(`
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
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      resolved_at TIMESTAMPTZ,
      resolved_by TEXT,
      metadata TEXT
    )
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS incidents (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      severity TEXT NOT NULL,
      status TEXT DEFAULT 'open',
      alert_ids TEXT,
      assigned_to TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      resolved_at TIMESTAMPTZ,
      timeline TEXT,
      notes TEXT
    )
  `);

  await client.query(`
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
      created_at TIMESTAMPTZ DEFAULT NOW(),
      processed INTEGER DEFAULT 0,
      alert_id TEXT
    )
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS system_stats (
      id SERIAL PRIMARY KEY,
      metric TEXT NOT NULL,
      value REAL NOT NULL,
      recorded_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS blocked_ips (
      id TEXT PRIMARY KEY,
      ip_address TEXT UNIQUE NOT NULL,
      reason TEXT,
      blocked_by TEXT,
      alert_id TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      expires_at TIMESTAMPTZ,
      is_active INTEGER DEFAULT 1
    )
  `);

  await seedAdmins();
  await seedMiniBank();

  console.log('[DB] PostgreSQL database initialized successfully');
}

async function seedAdmins() {
  const admins = [
    { id: 'admin-yash-001', username: 'yash', password: 'Yash123', email: 'yash@neuroshield.io' },
    { id: 'admin-shravani-001', username: 'shravani', password: 'Shravani', email: 'shravani@neuroshield.io' }
  ];

  for (const admin of admins) {
    const existing = await queryOne('SELECT id FROM users WHERE username = $1', [admin.username]);
    if (!existing) {
      const hash = bcrypt.hashSync(admin.password, 10);
      await execute(
        `INSERT INTO users (id, username, password, email, role, created_by) VALUES ($1, $2, $3, $4, 'super_admin', 'system')`,
        [admin.id, admin.username, hash, admin.email]
      );
      console.log(`[DB] Admin account created: ${admin.username}`);
    }
  }
}

async function seedMiniBank() {
  const existing = await queryOne("SELECT id FROM applications WHERE id = 'app-minibank-001'");
  if (!existing) {
    await execute(
      `INSERT INTO applications (id, name, description, url, type, status, is_internal) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      ['app-minibank-001', 'MiniBank', 'Simulated Banking Application - Internal Demo', '/minibank', 'banking', 'active', 1]
    );
    console.log('[DB] MiniBank application registered');
  }

  const existingKey = await queryOne("SELECT id FROM api_keys WHERE id = 'key-minibank-001'");
  if (!existingKey) {
    await execute(
      `INSERT INTO api_keys (id, key_value, name, application_id, created_by, is_active, permissions) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      ['key-minibank-001', 'mb-api-key-neuroshield-internal-2024', 'MiniBank Internal Key', 'app-minibank-001', 'system', 1, 'ingest']
    );
    console.log('[DB] MiniBank API key created');
  }
}

module.exports = { getPool, initializeDatabase, query, queryOne, execute };
