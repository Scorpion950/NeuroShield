import React, { useState, useEffect, useCallback } from 'react';
import AlertCard from '../components/alerts/AlertCard';
import { alertsApi } from '../api/client';
import { useAlerts } from '../context/AlertContext';
import { Search, Filter, RefreshCw, CheckSquare, Trash2, AlertTriangle, Download } from 'lucide-react';
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
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(new Set());
  const [filters, setFilters] = useState({ severity: '', status: '', attack_type: '', search: '', from: '', to: '' });
  const [page, setPage] = useState(0);
  const LIMIT = 20;

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { ...filters, limit: LIMIT, offset: page * LIMIT };
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

  // Merge new live alerts at top
  const allAlerts = [...liveAlerts.filter(la => !alerts.find(a => a.id === la.id)), ...alerts]
    .filter((alert, idx, arr) => arr.findIndex(a => a.id === alert.id) === idx);

  const handleFilterChange = (key, val) => {
    setFilters(prev => ({ ...prev, [key]: prev[key] === val ? '' : val }));
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
    if (selected.size === allAlerts.length) setSelected(new Set());
    else setSelected(new Set(allAlerts.map(a => a.id)));
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1>Live Alerts</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            {total} total alerts • Real-time threat monitoring feed
          </p>
        </div>
        <button className="btn btn-secondary" onClick={fetchAlerts}>
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Severity filter chips */}
      <div className="filters-bar">
        <div className="input-group" style={{ flex: 1, minWidth: 200 }}>
          <Search size={15} className="input-icon" />
          <input className="input" placeholder="Search alerts, IPs, usernames..." value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)} style={{ paddingLeft: '2.25rem' }} />
        </div>
        {SEVERITIES.map(sev => (
          <button key={sev} className={`filter-chip ${sev} ${filters.severity === sev ? 'active' : ''}`}
            onClick={() => handleFilterChange('severity', sev)}>
            {sev.charAt(0).toUpperCase() + sev.slice(1)}
          </button>
        ))}
        <select className="input" style={{ width: 'auto', padding: '0.35rem 0.75rem' }} value={filters.status}
          onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}>
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
        <select className="input" style={{ width: 'auto', padding: '0.35rem 0.75rem' }} value={filters.attack_type}
          onChange={(e) => setFilters(prev => ({ ...prev, attack_type: e.target.value }))}>
          <option value="">All Attack Types</option>
          {ATTACK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
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

      {/* Select all */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <input type="checkbox" checked={selected.size === allAlerts.length && allAlerts.length > 0}
            onChange={handleSelectAll} style={{ accentColor: 'var(--accent-blue)' }} />
          Select All
        </label>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Showing {allAlerts.length} of {total} alerts
        </span>
      </div>

      {/* Alerts list */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 'var(--radius)' }} />)}
        </div>
      ) : allAlerts.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-state-icon">✅</div>
          <h3>No alerts found</h3>
          <p>No alerts match your current filters. Try adjusting the filters or run an attack simulation.</p>
        </div>
      ) : (
        <div>
          {allAlerts.map(alert => (
            <AlertCard key={alert.id} alert={alert} selectable selected={selected.has(alert.id)}
              onSelect={handleSelect} onStatusChange={handleStatusChange} />
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
