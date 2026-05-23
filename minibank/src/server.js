require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { createRequestLogger } = require('./services/logForwarder');

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const apiRoutes = require('./routes/api');
const simulateRoutes = require('./routes/simulate');

const app = express();
const PORT = process.env.MINIBANK_PORT || 5001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Auto-log all requests to NeuroShield
app.use(createRequestLogger('MiniBank'));

// Routes
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/api', apiRoutes);
app.use('/simulate', simulateRoutes);

// Health
app.get('/health', (req, res) => {
  res.json({ status: 'operational', app: 'MiniBank', version: '1.0.0', timestamp: new Date().toISOString() });
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🏦 MiniBank running on http://localhost:${PORT}`);
  console.log(`🔗 Forwarding logs to NeuroShield at ${process.env.NEUROSHIELD_URL || 'http://localhost:5000'}`);
  console.log(`🎯 Attack simulations available at http://localhost:${PORT}/simulate/*\n`);
});

module.exports = app;
