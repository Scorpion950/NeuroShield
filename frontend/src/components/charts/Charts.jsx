import React, { useState, useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { format } from 'date-fns';

const SEVERITY_COLORS = {
  critical: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#10b981'
};

const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#f97316'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '0.75rem', fontSize: '0.8rem' }}>
      {label && <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || 'var(--text-primary)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, display: 'inline-block' }} />
          <span>{p.name}: <strong>{p.value}</strong></span>
        </div>
      ))}
    </div>
  );
};

export function SeverityTimelineChart({ data }) {
  const formatted = data?.map(d => ({
    ...d,
    time: d.hour ? format(new Date(d.hour), 'HH:mm') : d.time,
    total: (d.critical || 0) + (d.high || 0) + (d.medium || 0) + (d.low || 0)
  })) || [];

  if (formatted.length === 0) {
    return (
      <div className="empty-state" style={{ padding: '2rem' }}>
        <div className="empty-state-icon">📊</div>
        <h3>No timeline data</h3>
        <p>Threat activity will appear here as alerts are detected</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={formatted} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <defs>
          {Object.entries(SEVERITY_COLORS).map(([key, color]) => (
            <linearGradient key={key} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(56,100,180,0.1)" />
        <XAxis dataKey="time" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey="critical" name="Critical" stackId="1" stroke={SEVERITY_COLORS.critical} fill={`url(#grad-critical)`} strokeWidth={2} />
        <Area type="monotone" dataKey="high" name="High" stackId="1" stroke={SEVERITY_COLORS.high} fill={`url(#grad-high)`} strokeWidth={2} />
        <Area type="monotone" dataKey="medium" name="Medium" stackId="1" stroke={SEVERITY_COLORS.medium} fill={`url(#grad-medium)`} strokeWidth={2} />
        <Area type="monotone" dataKey="low" name="Low" stackId="1" stroke={SEVERITY_COLORS.low} fill={`url(#grad-low)`} strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function AttackTypeChart({ data }) {
  const formatted = data?.map((d, i) => ({ name: d.attack_type?.replace(' Attack', '').replace('Cross-Site Scripting', 'XSS'), count: d.count, fill: CHART_COLORS[i % CHART_COLORS.length] })) || [];

  if (formatted.length === 0) {
    return <div className="empty-state" style={{ padding: '2rem' }}><div className="empty-state-icon">📊</div><h3>No attack data</h3></div>;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={formatted} margin={{ top: 5, right: 10, left: -20, bottom: 5 }} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(56,100,180,0.1)" horizontal={false} />
        <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis dataKey="name" type="category" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} width={110} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="count" name="Alerts" radius={[0, 4, 4, 0]}>
          {formatted.map((entry, index) => (
            <Cell key={index} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function SeverityPieChart({ data }) {
  const formatted = data?.map(d => ({
    name: d.severity?.charAt(0).toUpperCase() + d.severity?.slice(1),
    value: d.count,
    color: SEVERITY_COLORS[d.severity] || '#94a3b8'
  })) || [];

  const total = formatted.reduce((sum, d) => sum + d.value, 0);

  if (formatted.length === 0) {
    return <div className="empty-state" style={{ padding: '2rem' }}><div className="empty-state-icon">🥧</div><h3>No severity data</h3></div>;
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <ResponsiveContainer width={140} height={140}>
        <PieChart>
          <Pie data={formatted} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={3}>
            {formatted.map((entry, index) => (
              <Cell key={index} fill={entry.color} stroke="var(--bg-card)" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div style={{ flex: 1 }}>
        {formatted.map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', fontSize: '0.8rem' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
            <span style={{ color: 'var(--text-secondary)', flex: 1 }}>{d.name}</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{d.value}</span>
            <span style={{ color: 'var(--text-muted)' }}>({total > 0 ? Math.round(d.value / total * 100) : 0}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AppDistributionChart({ data }) {
  const formatted = data?.map((d, i) => ({ name: d.source_app || 'Unknown', count: d.count, fill: CHART_COLORS[i % CHART_COLORS.length] })) || [];

  if (formatted.length === 0) {
    return <div className="empty-state" style={{ padding: '2rem' }}><div className="empty-state-icon">📱</div><h3>No app data</h3></div>;
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={formatted} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(56,100,180,0.1)" vertical={false} />
        <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="count" name="Alerts" radius={[4, 4, 0, 0]}>
          {formatted.map((entry, index) => (
            <Cell key={index} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
