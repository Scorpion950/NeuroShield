require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
const { initializeDatabase } = require('./config/database');
const { setWsClients } = require('./services/threatDetection');
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

// Initialize DB
initializeDatabase();

const app = express();

// Middleware
app.use(cors({ origin: config.CORS_ORIGINS, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  }
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/applications', applicationsRoutes);
app.use('/api/apikeys', apiKeysRoutes);
app.use('/api/insights', insightsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ingest', ingestRoutes);
app.use('/api/incidents', incidentsRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'operational', platform: 'NeuroShield', version: '1.0.0', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.path} not found.` });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[Server] Error:', err);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

// Create HTTP server
const server = http.createServer(app);

// WebSocket Server
const wss = new WebSocket.Server({ server, path: '/ws' });
const wsClients = new Set();

wss.on('connection', (ws, req) => {
  wsClients.add(ws);
  console.log(`[WS] Client connected. Total: ${wsClients.size}`);

  // Send welcome message
  ws.send(JSON.stringify({
    type: 'connected',
    data: { message: 'Connected to NeuroShield Real-Time Feed', timestamp: new Date().toISOString() }
  }));

  ws.on('message', (msg) => {
    try {
      const parsed = JSON.parse(msg);
      if (parsed.type === 'ping') ws.send(JSON.stringify({ type: 'pong' }));
    } catch (e) {}
  });

  ws.on('close', () => {
    wsClients.delete(ws);
    console.log(`[WS] Client disconnected. Total: ${wsClients.size}`);
  });

  ws.on('error', () => wsClients.delete(ws));
});

// Pass ws clients to threat detection service
setWsClients(wsClients);

// System health broadcast every 30s
setInterval(() => {
  const healthMsg = JSON.stringify({
    type: 'health_update',
    data: {
      uptime: process.uptime(),
      memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      connected_clients: wsClients.size,
      timestamp: new Date().toISOString()
    }
  });
  wsClients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) client.send(healthMsg);
  });
}, 30000);

const PORT = config.PORT;
server.listen(PORT, () => {
  console.log(`\n🛡️  NeuroShield Platform running on port ${PORT}`);
  console.log(`📡 WebSocket server ready at ws://localhost:${PORT}/ws`);
  console.log(`🔗 API available at http://localhost:${PORT}/api\n`);
});

module.exports = { app, server };
