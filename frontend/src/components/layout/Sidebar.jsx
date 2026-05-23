import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAlerts } from '../../context/AlertContext';
import {
  LayoutDashboard, Bell, BarChart3, Globe, Brain,
  History, Key, Settings, Shield, ChevronLeft, ChevronRight,
} from 'lucide-react';

const NAV_GROUPS = [
  {
    label: 'Monitoring',
    items: [
      { label: 'Dashboard',        icon: LayoutDashboard, path: '/', end: true },
      { label: 'Live Alerts',      icon: Bell,            path: '/alerts', badge: true },
      { label: 'Threat Analytics', icon: BarChart3,       path: '/analytics' },
      { label: 'Applications',     icon: Globe,           path: '/applications' },
      { label: 'AI Insights',      icon: Brain,           path: '/insights' },
    ],
  },
  {
    label: 'Management',
    items: [
      { label: 'Incident History', icon: History,  path: '/incidents' },
      { label: 'API Keys',         icon: Key,      path: '/apikeys' },
      { label: 'Settings',         icon: Settings, path: '/settings' },
    ],
  },
];

export default function Sidebar({ collapsed, onToggle }) {
  const { liveAlerts } = useAlerts();
  const activeCount = liveAlerts.filter(a => a.status === 'active' || !a.status).length;

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo" style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 34, height: 34,
          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
          borderRadius: 10, flexShrink: 0,
          boxShadow: '0 0 14px rgba(59,130,246,0.35)',
        }}>
          <Shield size={18} color="white" />
        </div>
        {!collapsed && (
          <span className="logo-text" style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
            Neuro<span>Shield</span>
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {NAV_GROUPS.map(group => (
          <div key={group.label} style={{ marginBottom: '0.25rem' }}>
            {!collapsed && (
              <div className="nav-section-title">{group.label}</div>
            )}
            {collapsed && <div style={{ height: '0.5rem' }} />}
            {group.items.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                title={collapsed ? item.label : ''}
                style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
              >
                <item.icon size={18} style={{ flexShrink: 0 }} />
                {!collapsed && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>}
                {!collapsed && item.badge && activeCount > 0 && (
                  <span className="nav-badge">{activeCount > 99 ? '99+' : activeCount}</span>
                )}
                {collapsed && item.badge && activeCount > 0 && (
                  <span style={{
                    position: 'absolute', top: 5, right: 6,
                    background: 'var(--critical)', color: 'white',
                    fontSize: '0.55rem', fontWeight: 700,
                    width: 14, height: 14, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{activeCount > 9 ? '9+' : activeCount}</span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Collapse toggle */}
      <div className="sidebar-footer">
        <button
          id="sidebar-collapse-btn"
          onClick={onToggle}
          className="nav-item"
          style={{
            width: '100%', border: 'none', background: 'transparent',
            cursor: 'pointer', justifyContent: collapsed ? 'center' : 'flex-start',
          }}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed
            ? <ChevronRight size={17} />
            : <><ChevronLeft size={17} /><span>Collapse</span></>
          }
        </button>
      </div>
    </aside>
  );
}
