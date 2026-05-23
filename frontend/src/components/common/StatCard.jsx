import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function StatCard({ title, value, icon: Icon, color = 'blue', change, suffix = '', loading }) {
  const colorMap = {
    critical: { bg: 'rgba(239,68,68,0.1)', color: 'var(--critical)', glow: 'rgba(239,68,68,0.2)' },
    blue: { bg: 'rgba(59,130,246,0.1)', color: 'var(--accent-blue)', glow: 'rgba(59,130,246,0.2)' },
    green: { bg: 'rgba(16,185,129,0.1)', color: 'var(--accent-green)', glow: 'rgba(16,185,129,0.2)' },
    purple: { bg: 'rgba(139,92,246,0.1)', color: 'var(--accent-purple)', glow: 'rgba(139,92,246,0.2)' },
    orange: { bg: 'rgba(245,158,11,0.1)', color: 'var(--accent-orange)', glow: 'rgba(245,158,11,0.2)' }
  };
  const c = colorMap[color] || colorMap.blue;

  return (
    <div className={`card stat-card ${color}`} style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div>
          {loading ? (
            <div className="skeleton" style={{ width: 80, height: 36, marginBottom: 8 }} />
          ) : (
            <div className="stat-value">{value}{suffix}</div>
          )}
          <div className="stat-label">{title}</div>
        </div>
        <div className="stat-icon" style={{ background: c.bg }}>
          {Icon && <Icon size={22} color={c.color} />}
        </div>
      </div>
      {change !== undefined && (
        <div className={`stat-change ${change > 0 ? 'up' : change < 0 ? 'down' : 'neutral'}`} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {change > 0 ? <TrendingUp size={13} /> : change < 0 ? <TrendingDown size={13} /> : <Minus size={13} />}
          <span>{change > 0 ? '+' : ''}{change}% from yesterday</span>
        </div>
      )}
      {/* Decorative glow circle */}
      <div style={{
        position: 'absolute', top: -30, right: -30, width: 100, height: 100,
        borderRadius: '50%', background: c.color, opacity: 0.05, pointerEvents: 'none'
      }} />
    </div>
  );
}
