import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AlertProvider } from './context/AlertContext';

import Sidebar from './components/layout/Sidebar';
import Navbar from './components/layout/Navbar';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import LiveAlerts from './pages/LiveAlerts';
import ThreatAnalytics from './pages/ThreatAnalytics';
import Applications from './pages/Applications';
import AIInsights from './pages/AIInsights';
import IncidentHistory from './pages/IncidentHistory';
import APIKeys from './pages/APIKeys';
import Settings from './pages/Settings';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return (
    <div style={{
      height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-primary)', color: 'var(--accent-blue)',
      flexDirection: 'column', gap: '1rem'
    }}>
      <div style={{ width: 40, height: 40, border: '3px solid rgba(59,130,246,0.2)', borderTop: '3px solid var(--accent-blue)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Loading NeuroShield...</span>
    </div>
  );
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const DashboardLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      <div
        className={`main-content ${collapsed ? 'sidebar-collapsed' : ''}`}
        style={{ transition: 'margin-left 0.3s ease' }}
      >
        <Navbar collapsed={collapsed} />
        <main className="page-wrapper">
          {children}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AlertProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Toaster position="top-right" toastOptions={{
            style: { background: '#1E293B', color: '#F8FAFC', border: '1px solid #334155' }
          }} />
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route path="/" element={<ProtectedRoute><DashboardLayout><Dashboard /></DashboardLayout></ProtectedRoute>} />
            <Route path="/alerts" element={<ProtectedRoute><DashboardLayout><LiveAlerts /></DashboardLayout></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><DashboardLayout><ThreatAnalytics /></DashboardLayout></ProtectedRoute>} />
            <Route path="/applications" element={<ProtectedRoute><DashboardLayout><Applications /></DashboardLayout></ProtectedRoute>} />
            <Route path="/insights" element={<ProtectedRoute><DashboardLayout><AIInsights /></DashboardLayout></ProtectedRoute>} />
            <Route path="/incidents" element={<ProtectedRoute><DashboardLayout><IncidentHistory /></DashboardLayout></ProtectedRoute>} />
            <Route path="/apikeys" element={<ProtectedRoute><DashboardLayout><APIKeys /></DashboardLayout></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><DashboardLayout><Settings /></DashboardLayout></ProtectedRoute>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AlertProvider>
    </AuthProvider>
  );
}
