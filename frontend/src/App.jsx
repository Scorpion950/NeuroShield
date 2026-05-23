import React from 'react';
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
  if (loading) return <div className="h-screen flex items-center justify-center bg-[#0B0F19] text-blue-500">Loading NeuroShield...</div>;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const DashboardLayout = ({ children }) => {
  return (
    <div className="flex h-screen bg-[#0B0F19] text-slate-200 font-inter overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#0B0F19] p-6">
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
        <Router>
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
