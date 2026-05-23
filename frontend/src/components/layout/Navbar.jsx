import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAlerts } from '../../context/AlertContext';
import { Bell, Wifi, WifiOff, LogOut, User, ChevronDown, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Navbar({ pageTitle, collapsed }) {
  const { user, logout } = useAuth();
  const { liveAlerts, wsConnected } = useAlerts();
  const [showProfile, setShowProfile] = useState(false);

  const criticalCount = liveAlerts.filter(a => a.severity === 'critical' && (a.status === 'active' || !a.status)).length;
  const initials = user?.username?.substring(0, 2).toUpperCase() || 'NS';

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
  };

  return (
    <header className={`navbar ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <div className="navbar-left">
        <span className="page-title">{pageTitle}</span>
      </div>

      <div className="navbar-right">
        {/* WS status */}
        <div className="navbar-status" style={{ color: wsConnected ? 'var(--accent-green)' : 'var(--critical)' }}>
          {wsConnected ? <><Wifi size={13} />Live</> : <><WifiOff size={13} />Offline</>}
        </div>

        {/* Activity pulse */}
        <div className="navbar-status" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-blue)' }}>
          <Activity size={13} />
          <span>Monitoring Active</span>
        </div>

        {/* Alerts bell */}
        <div className="notif-btn">
          <button className="btn btn-secondary btn-icon" style={{ position: 'relative' }}>
            <Bell size={16} />
            {criticalCount > 0 && <span className="notif-count">{criticalCount}</span>}
          </button>
        </div>

        {/* Profile */}
        <div style={{ position: 'relative' }}>
          <button
            className="btn btn-secondary"
            style={{ gap: '0.5rem', padding: '0.4rem 0.75rem' }}
            onClick={() => setShowProfile(!showProfile)}
          >
            <div className="avatar" style={{ width: 26, height: 26, fontSize: '0.7rem' }}>{initials}</div>
            <span style={{ fontSize: '0.85rem' }}>{user?.username}</span>
            <ChevronDown size={14} />
          </button>

          {showProfile && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0, minWidth: 200,
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', padding: '0.5rem', zIndex: 200,
              animation: 'slideUp 0.15s ease'
            }}>
              <div style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border)', marginBottom: '0.25rem' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{user?.username}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user?.role}</div>
              </div>
              <button
                className="nav-item"
                style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--critical)' }}
                onClick={handleLogout}
              >
                <LogOut size={15} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
