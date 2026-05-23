import React, { useState, useEffect, useCallback } from 'react';
import AlertCard from '../components/alerts/AlertCard';
import { alertsApi, applicationsApi } from '../api/client';
import { useAlerts } from '../context/AlertContext';
import { Search, RefreshCw, CheckSquare, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';

const SEVERITIES = ['critical', 'high', 'medium', 'low'];
const STATUSES = ['active', 'investigating', 'resolved', 'false_positive'];
const ATTACK_TYPES = [
  'Brute Force Attack', 'SQL Injection', 'API Abuse', 'Unauthorized Admin Access',
  'Privilege Escalation', 'Suspicious Login', 'Excessive Requests', 'Abnormal User Behavior'
];

export default function LiveAlerts() {
  const { liveAlerts } = useAlerts();
  const [alerts, setAlerts] = useState([]);
  const [apps, setApps] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(new Set());
  const [filters, setFilters] = useState({ severity: '', status: '', attack_type: '', app: '', search: '' });
  const [page, setPage] = useState(0);
  const LIMIT = 20;

  useEffect(() => {
    applicationsApi.getAll().then(res => setApps(res.applications || [])).catch(() => {});
  }, []);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      // Build params — only send non-empty filters
      const params = { limit: LIMIT, offset: page * LIMIT };
      if (filters.severity) params.severity = filters.severity;
      if (filters.status) params.status = filters.status;
      if (filters.attack_type) params.attack_type = filters.attack_type;
      if (filters.app) params.app = filters.app;
      if (filters.search) params.search = filters.search;

      const res = await alertsApi.getAlerts(params);
      setAlerts(res.alerts || []);
      setTotal(res.total || 0);
    } catch (err) {
      toast.error('Failed to fetch alerts');
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  // Only merge live alerts when NO filters are active (so filters work correctly)
  const hasActiveFilters = filters.severity || filters.status || filters.attack_type || filters.app || filters.search;
  const baseAlerts = hasActiveFilters ? alerts : [
    ...liveAlerts.filter(la => !alerts.find(a => a.id === la.id)),
    ...alerts
  ].filter((alert, idx, arr) => arr.findIndex(a => a.id === alert.id) === idx);

  const handleSeverityFilter = (sev) => {
    setFilters(prev => ({ ...prev, severity: prev.severity === sev ? '' : sev }));
    setPage(0);
  };

  const handleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selected.size === baseAlerts.length) setSelected(new Set());
    else setSelected(new Set(baseAlerts.map(a => a.id)));
  };

  const clearFilters = () => {
    setFilters({ severity: '', status: '', attack_type: '', search: '' });
    setPage(0);
  };

  const handleBulkAction = async (action, status) => {
    if (selected.size === 0) { toast.error('No alerts selected'); return; }
    try {
      await alertsApi.bulkAction({ ids: [...selected], action, status });
      toast.success(`Applied to ${selected.size} alerts`);
      setSelected(new Set());
      fetchAlerts();
    } catch (err) {
      toast.error('Bulk action failed');
    }
  };

  const handleStatusChange = (id, status) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ marginBottom: '0.25rem' }}>Live Alerts</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            {total} total alerts • Real-time threat monitoring feed
            {hasActiveFilters && <span style={{ color: 'var(--accent-blue)', marginLeft: '0.5rem' }}>• Filters active</span>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {hasActiveFilters && (
            <button className="btn btn-secondary btn-sm" onClick={clearFilters}>
              <X size={13} /> Clear Filters
            </button>
          )}
          <button className="btn btn-secondary" onClick={fetchAlerts}>
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="input-group" style={{ flex: 1, minWidth: 200 }}>
          <Search size={15} className="input-icon" />
          <input
            className="input"
            placeholder="Search alerts, IPs, usernames..."
            value={filters.search}
            onChange={(e) => { setFilters(prev => ({ ...prev, search: e.target.value })); setPage(0); }}
            style={{ paddingLeft: '2.25rem' }}
          />
        </div>
        {SEVERITIES.map(sev => (
          <button
            key={sev}
            className={`filter-chip ${sev} ${filters.severity === sev ? 'active' : ''}`}
            onClick={() => handleSeverityFilter(sev)}
          >
            {sev.charAt(0).toUpperCase() + sev.slice(1)}
          </button>
        ))}
        <select
          className="input"
          style={{ width: 'auto', padding: '0.35rem 0.75rem' }}
          value={filters.status}
          onChange={(e) => { setFilters(prev => ({ ...prev, status: e.target.value })); setPage(0); }}
        >
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
        <select
          className="input"
          style={{ width: 'auto', padding: '0.35rem 0.75rem' }}
          value={filters.attack_type}
          onChange={(e) => { setFilters(prev => ({ ...prev, attack_type: e.target.value })); setPage(0); }}
        >
          <option value="">All Attack Types</option>
          {ATTACK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        {apps.length > 0 && (
          <select
            className="input"
            style={{ width: 'auto', padding: '0.35rem 0.75rem' }}
            value={filters.app}
            onChange={(e) => { setFilters(prev => ({ ...prev, app: e.target.value })); setPage(0); }}
          >
            <option value="">All Apps</option>
            {apps.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
          </select>
        )}
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: 'var(--accent-blue-dim)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', animation: 'fadeIn 0.2s ease' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--accent-blue)' }}>{selected.size} selected</span>
          <button className="btn btn-sm btn-success" onClick={() => handleBulkAction('update_status', 'resolved')}><CheckSquare size={13} />Resolve All</button>
          <button className="btn btn-sm btn-secondary" onClick={() => handleBulkAction('mark_false_positive')} style={{ color: 'var(--accent-purple)' }}>Mark False Positive</button>
          <button className="btn btn-sm btn-danger" onClick={() => handleBulkAction('delete')}><Trash2 size={13} />Delete</button>
          <button className="btn btn-sm btn-secondary" onClick={() => setSelected(new Set())}>Clear</button>
        </div>
      )}

      {/* Select all row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <input type="checkbox" checked={selected.size === baseAlerts.length && baseAlerts.length > 0}
            onChange={handleSelectAll} style={{ accentColor: 'var(--accent-blue)' }} />
          Select All
        </label>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Showing {baseAlerts.length} of {total} alerts
        </span>
      </div>

      {/* Alert list */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 'var(--radius)' }} />)}
        </div>
      ) : baseAlerts.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-state-icon">✅</div>
          <h3>No alerts found</h3>
          <p>
            {hasActiveFilters
              ? 'No alerts match your current filters. Try adjusting or clearing the filters.'
              : 'No alerts yet. Run an attack simulation on MiniBank to generate alerts.'}
          </p>
          {hasActiveFilters && (
            <button className="btn btn-secondary" style={{ marginTop: '1rem' }} onClick={clearFilters}>
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div>
          {baseAlerts.map(alert => (
            <AlertCard
              key={alert.id}
              alert={alert}
              selectable
              selected={selected.has(alert.id)}
              onSelect={handleSelect}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > LIMIT && (
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '1.5rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>← Prev</button>
          <span style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Page {page + 1} of {Math.ceil(total / LIMIT)}
          </span>
          <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => p + 1)} disabled={(page + 1) * LIMIT >= total}>Next →</button>
        </div>
      )}
    </div>
  );
}
