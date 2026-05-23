# NeuroShield

An AI-powered cybersecurity monitoring platform that detects real-time threats, analyzes suspicious activities, and provides intelligent security insights for connected applications.

## Project Structure
- **`/backend`**: Node.js/Express server acting as the central threat monitoring engine. Uses SQLite for data storage and WebSockets for real-time alerts.
- **`/frontend`**: React/Vite dashboard for visualizing threats, managing incidents, and viewing AI-driven insights.
- **`/minibank`**: A simulated, vulnerable banking application that acts as a target to generate logs and attacks for demonstration purposes.

## Quick Start

1. **Install Dependencies**
   Run the following command at the root to install dependencies for all three projects:
   ```bash
   npm run install:all
   ```

2. **Configure Environment**
   Check the `backend/.env` file. If you wish to enable AI explanations, add your `GEMINI_API_KEY`.

3. **Start the Platform**
   Start the backend, minibank, and frontend concurrently:
   ```bash
   npm run dev
   ```

## Default Access
- **Dashboard UI**: `http://localhost:5173`
- **MiniBank Simulator**: `http://localhost:5001`

## Attack Simulation
You can trigger attacks on the MiniBank to see NeuroShield in action by sending POST requests to `http://localhost:5001/simulate/*` endpoints (e.g., `/simulate/brute-force`, `/simulate/sql-injection`, `/simulate/all`).
