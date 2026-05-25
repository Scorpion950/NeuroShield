<div align="center">

# 🛡️ NeuroShield

### AI-Powered Cybersecurity Threat Monitoring Platform

**Real-time threat detection · AI-driven analysis · Intelligent chatbot · Attack simulation**

---

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![SQLite](https://img.shields.io/badge/SQLite-3-003B57?style=flat-square&logo=sqlite&logoColor=white)](https://sqlite.org)
[![Google Gemini](https://img.shields.io/badge/Gemini-AI-4285F4?style=flat-square&logo=google&logoColor=white)](https://aistudio.google.com)
[![WebSocket](https://img.shields.io/badge/WebSocket-Real--Time-010101?style=flat-square&logo=socket.io)](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)

</div>

---

## 📖 Overview

**NeuroShield** is a full-stack AI-powered cybersecurity monitoring platform that ingests security logs from connected applications, detects threats in real time using pattern-matching and anomaly detection, and delivers intelligent insights through a modern React dashboard — including a **conversational AI Security Assistant** backed by Google Gemini.

The platform ships with **MiniBank** — a deliberately vulnerable simulated banking application — so you can trigger realistic attack scenarios and watch NeuroShield detect, classify, and analyze them instantly.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         NeuroShield                             │
│                                                                 │
│   ┌──────────────┐     ┌──────────────────┐    ┌────────────┐  │
│   │   MiniBank   │────▶│  Backend Engine  │◀──▶│  Frontend  │  │
│   │  (Port 5001) │ HTTP│   (Port 5000)    │ WS │(Port 5173) │  │
│   │  Simulator   │     │  Express + SQLite │    │React + Vite│  │
│   └──────────────┘     └────────┬─────────┘    └────────────┘  │
│                                 │                               │
│                         ┌───────▼────────┐                     │
│                         │  Google Gemini │                     │
│                         │  AI  (Optional)│                     │
│                         └────────────────┘                     │
└─────────────────────────────────────────────────────────────────┘
```

| Component | Technology | Port |
|-----------|-----------|------|
| **Backend** | Node.js · Express · SQLite · WebSocket | `5000` |
| **Frontend** | React 18 · Vite · Recharts · Lucide | `5173` |
| **MiniBank** | Node.js · Express (simulated target) | `5001` |

---

## ✨ Features

### 🖥️ Dashboard
- **Live stat cards** — total alerts, critical threats, active incidents, monitored applications
- **Real-time updates** via WebSocket connection to the backend
- **System health widget** — uptime, memory usage, connected WebSocket clients
- **Recent alerts feed** with severity color-coding and click-to-investigate links
- **Threat activity chart** — hourly breakdown of alert volume

### 🔴 Live Alerts
- Real-time alert stream with **severity filters** (Critical / High / Medium / Low)
- **Status management** — mark alerts as Active, Investigating, Resolved, or False Positive
- **Bulk actions** — resolve or dismiss multiple alerts at once
- **Search and filter** by attack type, application, time range
- Per-alert detail panel with IP address, targeted user, attack vector, and metadata
- One-click navigation to AI investigation panel for any alert

### 📊 Threat Analytics
- Interactive **attack type distribution** pie chart
- **Hourly trend chart** — visualize attack volume over 24h / 7d windows
- **Severity breakdown** by time period
- **Per-application alert counts** to identify most-targeted services

### 🤖 AI Insights
Complete AI-powered threat intelligence hub:

- **Daily Security Summary** — auto-generated narrative of the last 24h with risk level badge (LOW / MEDIUM / HIGH / CRITICAL)
- **Priority Action Banner** — surface the single most important remediation step
- **Top Threats Sidebar** — ranked attack types with incident counts and max severity
- **Affected Applications** — which integrated apps are under most pressure
- **Per-Alert AI Investigation** — deep-dive panel for any alert featuring:
  - Full AI explanation of the attack technique
  - Risk assessment with confidence level
  - Step-by-step recommended actions (numbered & prioritized)
  - Supporting evidence list extracted from log metadata
  - Event timeline with human-relative timestamps
  - Related alerts from the same IP or attack type

#### 💬 AI Security Chatbot (NEW)
An embedded conversational assistant on the AI Insights page:

| Capability | Example Prompt |
|-----------|----------------|
| **Threat overview** | *"What are my top threats today?"* |
| **Risk assessment** | *"What is the current risk level?"* |
| **IP threat intel** | *"Which IPs should I block?"* |
| **Remediation advice** | *"How do I mitigate SQL injection?"* |
| **Incident summary** | *"Summarize today's security incidents"* |
| **Attack explanations** | *"Explain brute force attacks"* |

- Powered by **Google Gemini 1.5 Flash** with live DB context injected into every prompt (alert counts, top threats, risk level, suspicious IPs)
- **Graceful fallback** — 9 rule-based keyword matchers work even without an API key
- **Multi-turn conversation** history (up to 8 previous messages sent as context)
- 6 clickable **suggested prompt chips** shown on first open
- Animated **typing indicator** while waiting for response
- Glassmorphism panel with **slide-up animation** and pulsing toggle button

### 🏢 Applications
- Register and manage **monitored applications** (name, type, API endpoint)
- View per-app alert statistics and status
- Generate and copy **API keys** for log ingestion
- Enable/disable application monitoring

### 🔑 API Keys
- Create, revoke, and delete API keys for external log ingestion
- Key masking with reveal-on-hover
- Usage tracking per key

### 📋 Incident History
- Full audit log of all security incidents
- Filter by date range, severity, and status
- Create manual incidents and link to alerts
- Track incident lifecycle from detection to resolution

### ⚙️ Settings
- **User management** — create, edit, and delete platform users with role-based access (Admin / Analyst / Viewer)
- **Platform settings** — notification preferences, detection thresholds
- **Security configuration** — JWT session management, 2FA options
- **Appearance** — theme and display preferences

---

## 🔍 Threat Detection Engine

NeuroShield detects **10 attack types** from ingested security logs:

| Attack Type | Detection Method | Severity |
|-------------|-----------------|----------|
| 🔴 **Brute Force Attack** | ≥5 failed logins from same IP within 5 min | High / Critical |
| 🔴 **SQL Injection** | Pattern matching on request payload/params | Critical |
| 🟠 **Unauthorized Admin Access** | 403 responses on `/admin/*` endpoints | High |
| 🔴 **Privilege Escalation** | `role`, `isAdmin`, `sudo` params in PUT requests | Critical |
| 🟡 **Suspicious Login** | Geo-anomaly, new device, TOR/VPN flags | Medium / High |
| 🟡 **Excessive Requests / DDoS** | >50 requests/min from single IP | Medium / High |
| 🟡 **Abnormal User Behavior** | Multiple IPs, many endpoints, after-hours activity | Medium |
| 🟠 **API Abuse** | Automated scraping patterns | High |
| 🟡 **Credential Stuffing** | Many accounts tried from rotating IPs | Medium / High |
| 🟡 **Cross-Site Scripting (XSS)** | XSS payload detection in input fields | Medium |

Each detected threat triggers:
1. Alert stored in SQLite database
2. WebSocket push notification to all connected dashboards
3. AI explanation and remediation advice generated

---

## 🎯 MiniBank — Attack Simulator

MiniBank is a purposely vulnerable Express app pre-integrated with NeuroShield's log ingestor. Use it to generate realistic attack data for demonstrations or testing.

### Simulation Endpoints

All endpoints accept `POST` requests to `http://localhost:5001/simulate/*`:

| Endpoint | Description | Key Parameters |
|----------|------------|----------------|
| `/simulate/brute-force` | Repeated failed login attempts | `attempts` (max 50), `username`, `interval_ms` |
| `/simulate/sql-injection` | SQL payloads sent to API endpoint | `target_endpoint`, `count` (max 20) |
| `/simulate/suspicious-login` | Login from suspicious geo-location | `username`, `country`, `count` |
| `/simulate/api-abuse` | Rapid automated requests | `requests` (max 200), `endpoint` |
| `/simulate/unauthorized-admin` | Access denied on admin paths | `username`, `count` |
| `/simulate/privilege-escalation` | Role escalation payload injection | `username` |
| `/simulate/abnormal-behavior` | Multi-IP erratic access patterns | `username`, `requests` |
| `/simulate/credential-stuffing` | Rotating credentials from breach DB | `count` (max 50) |
| `/simulate/all` | Runs all scenarios sequentially | — |

**Example:**
```bash
# Run a brute force simulation — 15 attempts, 300ms apart
curl -X POST http://localhost:5001/simulate/brute-force \
  -H "Content-Type: application/json" \
  -d '{"attempts": 15, "username": "admin", "interval_ms": 300}'

# Run all attack scenarios at once
curl -X POST http://localhost:5001/simulate/all
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18 or higher
- **npm** 9 or higher

### 1. Clone & Install

```bash
git clone <repository-url>
cd NeuroShield

# Install dependencies for all three services at once
npm run install:all
```

### 2. Configure Environment

```bash
# Copy the example environment file
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```env
PORT=5000
NODE_ENV=development
DB_PATH=./data/neuroshield.db
JWT_SECRET=your-strong-random-secret-here

# Optional — enables Gemini-powered AI chatbot and insights
# Get a free key at https://aistudio.google.com/
GEMINI_API_KEY=your_gemini_api_key_here

CORS_ORIGINS=http://localhost:5173,http://localhost:5001
```

> **Note:** The platform runs fully without a Gemini API key. AI insights use template-based generation and the chatbot uses rule-based fallbacks.

### 3. Start the Platform

```bash
# Start all three services concurrently (backend + minibank + frontend)
npm run dev
```

| Service | URL |
|---------|-----|
| 🖥️ **Dashboard** | http://localhost:5173 |
| 🏦 **MiniBank** | http://localhost:5001 |
| ⚙️ **API** | http://localhost:5000/api |
| 🔌 **WebSocket** | ws://localhost:5000/ws |
| ❤️ **Health Check** | http://localhost:5000/health |

### 4. Log In

Default credentials (created automatically on first run):

| Role | Username | Password |
|------|----------|----------|
| **Admin** | `admin` | `admin123` |
| **Analyst** | `analyst` | `analyst123` |

> ⚠️ **Change default passwords immediately in any non-demo environment.**

### 5. Generate Your First Alerts

```bash
# Quick demo — run all attack scenarios at once
curl -X POST http://localhost:5001/simulate/all
```

Watch alerts appear in real time on the dashboard!

---

## 📁 Project Structure

```
NeuroShield/
├── package.json              # Root workspace — concurrently scripts
│
├── backend/                  # Express API + Threat Detection Engine
│   ├── src/
│   │   ├── server.js         # Express app + WebSocket server
│   │   ├── config/
│   │   │   ├── config.js     # Constants, thresholds, attack types
│   │   │   └── database.js   # SQLite initialization & schema
│   │   ├── routes/
│   │   │   ├── auth.js       # JWT login, user management
│   │   │   ├── alerts.js     # CRUD + bulk actions for alerts
│   │   │   ├── insights.js   # AI summaries, alert analysis, chatbot
│   │   │   ├── dashboard.js  # Stats, recent alerts, system health
│   │   │   ├── applications.js
│   │   │   ├── apikeys.js
│   │   │   ├── incidents.js
│   │   │   └── ingest.js     # Log ingestion endpoint for MiniBank
│   │   ├── services/
│   │   │   ├── aiProcessor.js    # AI templates + Gemini integration + chatbot
│   │   │   └── threatDetection.js # Real-time pattern matching & alerting
│   │   ├── detection/
│   │   │   ├── bruteForce.js
│   │   │   ├── sqlInjection.js
│   │   │   └── anomalyDetection.js
│   │   └── middleware/
│   │       └── auth.js       # JWT verification middleware
│   ├── data/                 # SQLite database (auto-created)
│   └── .env.example
│
├── frontend/                 # React + Vite Dashboard
│   ├── src/
│   │   ├── App.jsx           # Router, layout, auth guard
│   │   ├── index.css         # Global design system (dark theme)
│   │   ├── api/
│   │   │   └── client.js     # Axios client + all API modules
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── AlertContext.jsx
│   │   ├── components/
│   │   │   ├── AIChatbot.jsx     # AI Security chatbot (floating panel)
│   │   │   ├── layout/           # Sidebar, Navbar
│   │   │   ├── alerts/           # Alert item, detail components
│   │   │   ├── charts/           # Recharts wrappers
│   │   │   └── common/           # Shared UI components
│   │   └── pages/
│   │       ├── Dashboard.jsx
│   │       ├── LiveAlerts.jsx
│   │       ├── ThreatAnalytics.jsx
│   │       ├── AIInsights.jsx    # AI analysis hub + chatbot
│   │       ├── Applications.jsx
│   │       ├── IncidentHistory.jsx
│   │       ├── APIKeys.jsx
│   │       ├── Settings.jsx
│   │       └── Login.jsx
│   └── vite.config.js
│
└── minibank/                 # Simulated vulnerable banking app
    └── src/
        ├── server.js
        ├── routes/
        │   ├── simulate.js   # 8 attack simulation endpoints
        │   ├── auth.js       # Vulnerable login endpoints
        │   ├── api.js        # Banking API endpoints
        │   └── admin.js      # Admin endpoints (restricted)
        └── services/
            └── logForwarder.js  # Sends logs to NeuroShield ingestor
```

---

## 🔌 API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | Login with username & password → JWT |
| `GET` | `/api/auth/me` | Get current authenticated user |
| `GET` | `/api/auth/users` | List all users (Admin only) |
| `POST` | `/api/auth/users` | Create user (Admin only) |
| `PUT` | `/api/auth/users/:id` | Update user |
| `DELETE` | `/api/auth/users/:id` | Delete user |

### Alerts
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/alerts` | List alerts (supports `?severity=`, `?status=`, `?limit=`) |
| `GET` | `/api/alerts/:id` | Get single alert |
| `PATCH` | `/api/alerts/:id/status` | Update alert status |
| `POST` | `/api/alerts/bulk-action` | Bulk resolve/dismiss |
| `DELETE` | `/api/alerts/:id` | Delete alert |

### AI Insights
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/insights/summary` | 24h AI summary + top threats + affected apps |
| `GET` | `/api/insights/alert/:id` | Deep AI analysis for a specific alert |
| `GET` | `/api/insights/trends` | Hourly trends, attack distribution |
| `POST` | `/api/insights/chat` | **AI Security Chatbot** — `{message, conversationHistory[]}` |

### Log Ingestion (for external apps)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/ingest/log` | Ingest a single security log event |
| `POST` | `/api/ingest/logs` | Ingest batch of log events |

**Ingest payload example:**
```json
{
  "level": "warn",
  "message": "Failed login attempt for user admin",
  "ip_address": "185.220.101.45",
  "username": "admin",
  "endpoint": "/auth/login",
  "method": "POST",
  "status_code": 401,
  "source_app": "my-app",
  "metadata": { "attempt_count": 6 }
}
```
> Requires `x-api-key` header with a valid key from the API Keys management page.

---

## 🛠️ Tech Stack

### Backend
| Package | Purpose |
|---------|---------|
| `express` | HTTP API framework |
| `better-sqlite3` | Synchronous SQLite driver |
| `ws` | WebSocket server for real-time push |
| `jsonwebtoken` | JWT authentication |
| `bcryptjs` | Password hashing |
| `@google/generative-ai` | Google Gemini AI integration |
| `express-rate-limit` | API rate limiting |
| `nodemon` | Dev auto-restart |

### Frontend
| Package | Purpose |
|---------|---------|
| `react` + `react-dom` | UI framework |
| `vite` | Lightning-fast dev server & bundler |
| `react-router-dom` | Client-side routing |
| `axios` | HTTP client with interceptors |
| `recharts` | Charts and data visualization |
| `lucide-react` | Icon library |
| `react-hot-toast` | Toast notifications |
| `date-fns` | Date formatting utilities |

---

## 🔐 Security Notes

> This platform is intended for **demonstration and educational purposes**. MiniBank contains intentional vulnerabilities for simulation. Do **not** expose MiniBank to the internet.

- All API routes (except `/api/auth/login` and `/api/ingest/*`) require a valid JWT bearer token
- Passwords are hashed with bcrypt (10 rounds)
- Log ingest endpoints require a valid API key header (`x-api-key`)
- JWT tokens expire after 24 hours by default
- Rate limiting is applied to all API routes (1000 req / 15 min per IP)

---

## 🗺️ Roadmap

- [ ] Email / Slack / webhook alert notifications
- [ ] Custom detection rule builder (UI)
- [ ] Multi-tenant organization support
- [ ] Exportable PDF incident reports
- [ ] SIEM integration (Splunk, Elastic)
- [ ] Docker Compose deployment configuration
- [ ] Two-factor authentication (TOTP)

---

## 📄 License

This project is for educational and demonstration purposes. See `LICENSE` for details.

---

<div align="center">

Built with ❤️ using **Node.js**, **React**, and **Google Gemini AI**

</div>
