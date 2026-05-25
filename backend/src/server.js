require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initializeDatabase } = require('./config/database');
const { addSseClient, removeSseClient } = require('./services/threatDetection');
const config = require('./config/config');

// Routes
const authRoutes = require('./routes/auth');
const alertsRoutes = require('./routes/alerts');
const applicationsRoutes = require('./routes/applications');
const apiKeysRoutes = require('./routes/apikeys');
const insightsRoutes = require('./routes/insights');
const dashboardRoutes = require('./routes/dashboard');
const ingestRoutes = require('./routes/ingest');
const incidentsRoutes = require('./routes/incidents');
const blockedIpsRoutes = require('./routes/blockedIps');
const minibankRoutes = require('./routes/minibank');

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5001',
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : [])
];

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging (dev only)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/applications', applicationsRoutes);
app.use('/api/apikeys', apiKeysRoutes);
app.use('/api/insights', insightsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ingest', ingestRoutes);
app.use('/api/incidents', incidentsRoutes);
app.use('/api/blocked-ips', blockedIpsRoutes);
app.use('/api/minibank', minibankRoutes);

// SSE endpoint - replaces WebSocket for Vercel compatibility
app.get('/api/events/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  // Send connected event
  res.write(`data: ${JSON.stringify({ type: 'connected', data: { message: 'Connected to NeuroShield Live Feed', timestamp: new Date().toISOString() } })}\n\n`);

  addSseClient(res);
  console.log('[SSE] Client connected');

  // Heartbeat every 25s to prevent proxy timeouts
  const heartbeat = setInterval(() => {
    try { res.write(': heartbeat\n\n'); } catch (e) { clearInterval(heartbeat); }
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    removeSseClient(res);
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'operational', platform: 'NeuroShield', version: '2.0.0', timestamp: new Date().toISOString() });
});

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  const frontendDist = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.path} not found.` });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[Server] Error:', err);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

const PORT = config.PORT || 5000;

if (process.env.VERCEL) {
  // Vercel serverless environment
  initializeDatabase().catch(console.error);
  module.exports = app;
} else {
  // Local development
  initializeDatabase()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`\n🛡️  NeuroShield Platform running on port ${PORT}`);
        console.log(`📡 SSE live feed at http://localhost:${PORT}/api/events/stream`);
        console.log(`🔗 API available at http://localhost:${PORT}/api\n`);
      });
    })
    .catch(err => {
      console.error('\n❌ [Server] Database connection failed:', err.message);
      console.error('⚠️  Make sure DATABASE_URL is set in backend/.env');
      console.error('    Get a free DB at: https://console.neon.tech\n');
      // Still start server so frontend loads, API calls will fail gracefully
      app.listen(PORT, () => {
        console.log(`⚠️  NeuroShield running on port ${PORT} (NO DATABASE — API calls will fail)`);
      });
    });

  module.exports = app;
}
