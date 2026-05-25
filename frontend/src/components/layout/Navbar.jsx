import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAlerts } from '../../context/AlertContext';
import { Bell, Wifi, WifiOff, LogOut, User, ChevronDown, Activity, X, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const SEVERITY_COLORS = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#f59e0b',
  low: '#22c55e',
};

const SEVERITY_EMOJI = { critical: '🔴', high: '🟠', medium: '🟡', low: '🟢' };

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}

export default function Navbar({ pageTitle, collapsed }) {
  const { user, logout } = useAuth();
  const { liveAlerts, wsConnected, clearLiveAlerts } = useAlerts();
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  const criticalCount = liveAlerts.filter(a => a.severity === 'critical' && (a.status === 'active' || !a.status)).length;
  const unreadCount = liveAlerts.length;
  const initials = user?.username?.substring(0, 2).toUpperCase() || 'NS';

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
  };

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

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

        {/* Notification Bell */}
        <div className="notif-btn" ref={notifRef} style={{ position: 'relative' }}>
          <button
            id="notif-bell-btn"
            className="btn btn-secondary btn-icon"
            style={{ position: 'relative' }}
            onClick={() => setShowNotifs(v => !v)}
            title="Notifications"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="notif-count" style={{
                backgroundColor: criticalCount > 0 ? '#ef4444' : '#f59e0b'
              }}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div id="notif-panel" style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0,
              width: 360, maxHeight: 480,
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', zIndex: 300,
              display: 'flex', flexDirection: 'column',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              animation: 'slideUp 0.15s ease'
            }}>
              {/* Header */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)', flexShrink: 0
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Bell size={15} style={{ color: 'var(--accent-blue)' }} />
                  <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                    Live Alerts
                  </span>
                  {unreadCount > 0 && (
                    <span style={{
                      background: 'var(--accent-blue)', color: '#fff',
                      borderRadius: '999px', fontSize: '0.7rem', padding: '1px 7px', fontWeight: 700
                    }}>
                      {unreadCount}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                  {unreadCount > 0 && (
                    <button
                      onClick={clearLiveAlerts}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--text-muted)', fontSize: '0.75rem', padding: '2px 6px',
                        borderRadius: 4, transition: 'color 0.2s'
                      }}
                      title="Clear all"
                    >
                      Clear all
                    </button>
                  )}
                  <button
                    onClick={() => setShowNotifs(false)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px' }}
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Alert list */}
              <div style={{ overflowY: 'auto', flex: 1, maxHeight: 400 }}>
                {liveAlerts.length === 0 ? (
                  <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', padding: '2rem', color: 'var(--text-muted)', gap: '0.5rem'
                  }}>
                    <Bell size={28} style={{ opacity: 0.3 }} />
                    <span style={{ fontSize: '0.85rem' }}>No new alerts</span>
                  </div>
                ) : (
                  liveAlerts.map((alert, i) => (
                    <div key={alert.id || i} style={{
                      padding: '0.75rem 1rem',
                      borderBottom: '1px solid var(--border)',
                      display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
                      transition: 'background 0.15s',
                      cursor: 'default'
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      {/* Severity dot */}
                      <div style={{
                        width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: 5,
                        backgroundColor: SEVERITY_COLORS[alert.severity] || '#f59e0b',
                        boxShadow: `0 0 6px ${SEVERITY_COLORS[alert.severity] || '#f59e0b'}`
                      }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                        }}>
                          {SEVERITY_EMOJI[alert.severity]} {alert.title}
                        </div>
                        {alert.description && (
                          <div style={{
                            fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                          }}>
                            {alert.description}
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: 4, alignItems: 'center' }}>
                          <span style={{
                            fontSize: '0.68rem', fontWeight: 600, padding: '1px 6px', borderRadius: 4,
                            color: SEVERITY_COLORS[alert.severity] || '#f59e0b',
                            background: `${SEVERITY_COLORS[alert.severity]}22` || '#f59e0b22',
                            textTransform: 'uppercase', letterSpacing: '0.03em'
                          }}>
                            {alert.severity}
                          </span>
                          {alert.source_app && (
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                              {alert.source_app}
                            </span>
                          )}
                          {alert.created_at && (
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                              {timeAgo(alert.created_at)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div style={{
                padding: '0.6rem 1rem', borderTop: '1px solid var(--border)',
                fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <span>{wsConnected ? '🟢 Live feed connected' : '🔴 Disconnected'}</span>
                <a href="/alerts" style={{ color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 600 }}>
                  View all alerts →
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div ref={profileRef} style={{ position: 'relative' }}>
          <button
            id="profile-menu-btn"
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
