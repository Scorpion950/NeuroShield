import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAlerts } from '../../context/AlertContext';
import {
  LayoutDashboard, Bell, BarChart3, Globe, Brain,
  History, Key, Settings, Shield, ChevronLeft, ChevronRight,
  Activity, AlertTriangle
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { label: 'Live Alerts', icon: Bell, path: '/alerts', badge: true },
  { label: 'Threat Analytics', icon: BarChart3, path: '/analytics' },
  { label: 'Applications', icon: Globe, path: '/applications' },
  { label: 'AI Insights', icon: Brain, path: '/insights' },
  { label: 'Incident History', icon: History, path: '/incidents' },
  { label: 'API Keys', icon: Key, path: '/apikeys' },
  { label: 'Settings', icon: Settings, path: '/settings' },
];

export default function Sidebar({ collapsed, onToggle }) {
  const { liveAlerts } = useAlerts();
  const activeCount = liveAlerts.filter(a => a.status === 'active' || !a.status).length;

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', borderRadius: 8, flexShrink: 0 }}>
          <Shield size={18} color="white" />
        </div>
        {!collapsed && (
          <span className="logo-text">Neuro<span>Shield</span></span>
        )}
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {!collapsed && <div className="nav-section-title">Monitoring</div>}
        {NAV_ITEMS.slice(0, 5).map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            title={collapsed ? item.label : ''}
          >
            <item.icon size={18} />
            {!collapsed && <span>{item.label}</span>}
            {!collapsed && item.badge && activeCount > 0 && (
              <span className="nav-badge">{activeCount > 99 ? '99+' : activeCount}</span>
            )}
          </NavLink>
        ))}

        {!collapsed && <div className="nav-section-title" style={{ marginTop: '0.5rem' }}>Management</div>}
        {NAV_ITEMS.slice(5).map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            title={collapsed ? item.label : ''}
          >
            <item.icon size={18} />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <button
          onClick={onToggle}
          className="nav-item"
          style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', justifyContent: collapsed ? 'center' : 'flex-start' }}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={18} /> : <><ChevronLeft size={18} /><span>Collapse</span></>}
        </button>
      </div>
    </aside>
  );
}
