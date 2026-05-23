import React, { useState, useEffect, useCallback } from 'react';
import { incidentsApi } from '../api/client';
import { Clock, CheckCircle, AlertTriangle, Search, RefreshCw, FileText, XCircle, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

// SQLite stores UTC without 'Z' — append it so date-fns parses correctly
const parseUTC = (ts) => ts ? new Date(ts.endsWith('Z') ? ts : ts + 'Z') : null;

const STATUS_MAP = {
  open: { label: 'Open', color: 'var(--medium)', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)', icon: AlertTriangle },
  investigating: { label: 'Investigating', color: 'var(--accent-blue)', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.25)', icon: Eye },
  resolved: { label: 'Resolved', color: 'var(--accent-green)', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)', icon: CheckCircle },
  closed: { label: 'Closed', color: 'var(--text-muted)', bg: 'rgba(100,116,139,0.08)', border: 'rgba(100,116,139,0.2)', icon: XCircle },
};

const SEV_COLORS = {
  critical: { color: 'var(--critical)', bg: 'var(--critical-dim)', border: 'var(--critical-border)' },
  high: { color: 'var(--high)', bg: 'var(--high-dim)', border: 'var(--high-border)' },
  medium: { color: 'var(--medium)', bg: 'var(--medium-dim)', border: 'var(--medium-border)' },
  low: { color: 'var(--low)', bg: 'var(--low-dim)', border: 'var(--low-border)' },
};

export default function IncidentHistory() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchIncidents = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await incidentsApi.getIncidents(params);
      setIncidents(res.incidents || []);
    } catch (error) {
      toast.error('Failed to load incident history');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchIncidents(); }, [fetchIncidents]);

  const filtered = incidents.filter(i =>
    !search || i.title?.toLowerCase().includes(search.toLowerCase()) ||
    i.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.25rem' }}>Incident History</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Review and track resolved security incidents
          </p>
        </div>
        <button className="btn btn-secondary" onClick={fetchIncidents} disabled={loading}>
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="filters-bar" style={{ marginBottom: '1.25rem' }}>
        <div className="input-group" style={{ flex: 1, minWidth: 220 }}>
          <Search size={15} className="input-icon" />
          <input
            className="input"
            placeholder="Search incidents..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '2.25rem' }}
          />
        </div>
        <select
          className="input"
          style={{ width: 'auto', padding: '0.35rem 0.75rem' }}
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          {Object.entries(STATUS_MAP).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.875rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total', count: incidents.length, color: 'var(--accent-blue)' },
          { label: 'Open', count: incidents.filter(i => i.status === 'open').length, color: 'var(--medium)' },
          { label: 'Investigating', count: incidents.filter(i => i.status === 'investigating').length, color: 'var(--accent-blue)' },
          { label: 'Resolved', count: incidents.filter(i => i.status === 'resolved').length, color: 'var(--accent-green)' },
        ].map(({ label, count, color }) => (
          <div key={label} className="card" style={{ textAlign: 'center', padding: '1rem' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color, lineHeight: 1 }}>{count}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.3rem', fontWeight: 500 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 64 }} />)}
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state" style={{ padding: '4rem 2rem' }}>
            <div className="empty-state-icon"><FileText /></div>
            <h3>No incidents found</h3>
            <p>{search || statusFilter ? 'Try adjusting your filters.' : 'Resolved and investigated alerts will appear here.'}</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Incident</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((incident) => {
                  const sev = SEV_COLORS[incident.severity] || SEV_COLORS.low;
                  const stat = STATUS_MAP[incident.status] || STATUS_MAP.open;
                  const StatIcon = stat.icon;
                  return (
                    <tr key={incident.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem', marginBottom: '0.2rem' }}>{incident.title}</div>
                        {incident.description && (
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {incident.description}
                          </div>
                        )}
                      </td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0.2rem 0.6rem', background: sev.bg, border: `1px solid ${sev.border}`, borderRadius: 20, color: sev.color, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
                          {incident.severity}
                        </span>
                      </td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.2rem 0.65rem', background: stat.bg, border: `1px solid ${stat.border}`, borderRadius: 20, color: stat.color, fontSize: '0.78rem', fontWeight: 600 }}>
                          <StatIcon size={11} />
                          {stat.label}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          <Clock size={12} />
                          {incident.created_at ? formatDistanceToNow(parseUTC(incident.created_at), { addSuffix: true }) : '—'}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn btn-secondary btn-sm" style={{ fontSize: '0.78rem' }}>
                          <Eye size={12} />
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
