import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Plus, Trash2, RefreshCw, Search, AlertTriangle, Clock, User, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';

const SEVERITY_COLORS = { critical: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#22c55e' };

function timeAgo(dateStr) {
  if (!dateStr) return 'Never';
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default function BlockedIPs() {
  const [blockedIPs, setBlockedIPs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ ip_address: '', reason: '', expires_at: '' });
  const [adding, setAdding] = useState(false);
  const [filter, setFilter] = useState('active');

  const fetchBlockedIPs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get('/blocked-ips', { params: filter !== 'all' ? { active: filter === 'active' } : {} });
      setBlockedIPs(data.blocked_ips || []);
    } catch (err) {
      toast.error('Failed to load blocked IPs');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchBlockedIPs(); }, [fetchBlockedIPs]);

  const handleBlock = async (e) => {
    e.preventDefault();
    if (!form.ip_address.trim()) return toast.error('IP address is required');
    setAdding(true);
    try {
      await api.post('/blocked-ips', {
        ip_address: form.ip_address.trim(),
        reason: form.reason || 'Manual block',
        expires_at: form.expires_at || null
      });
      toast.success(`IP ${form.ip_address} blocked successfully`);
      setForm({ ip_address: '', reason: '', expires_at: '' });
      setShowAdd(false);
      fetchBlockedIPs();
    } catch (err) {
      toast.error(err.message || 'Failed to block IP');
    } finally {
      setAdding(false);
    }
  };

  const handleUnblock = async (id, ip) => {
    if (!window.confirm(`Unblock IP ${ip}?`)) return;
    try {
      await api.delete(`/blocked-ips/${id}`);
      toast.success(`IP ${ip} unblocked`);
      fetchBlockedIPs();
    } catch (err) {
      toast.error('Failed to unblock IP');
    }
  };

  const filtered = blockedIPs.filter(b =>
    b.ip_address?.toLowerCase().includes(search.toLowerCase()) ||
    b.reason?.toLowerCase().includes(search.toLowerCase()) ||
    b.blocked_by?.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = blockedIPs.filter(b => b.is_active).length;

  return (
    <div style={{ padding: '1.5rem', maxWidth: 1000 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Shield size={22} style={{ color: 'var(--critical)' }} />
            Blocked IPs
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>
            Block malicious IP addresses from accessing your monitored applications
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className="btn btn-secondary btn-icon"
            onClick={fetchBlockedIPs}
            title="Refresh"
          >
            <RefreshCw size={15} />
          </button>
          <button
            id="block-ip-btn"
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            onClick={() => setShowAdd(v => !v)}
          >
            <Plus size={16} />
            Block IP
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Active Blocks', value: activeCount, icon: XCircle, color: '#ef4444' },
          { label: 'Total Blocked', value: blockedIPs.length, icon: Shield, color: '#f97316' },
          { label: 'Inactive', value: blockedIPs.filter(b => !b.is_active).length, icon: CheckCircle, color: '#22c55e' },
        ].map(stat => (
          <div key={stat.label} className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ padding: '0.5rem', borderRadius: 8, background: `${stat.color}20` }}>
              <stat.icon size={18} style={{ color: stat.color }} />
            </div>
            <div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>{stat.value}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 1 }}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Add IP Form */}
      {showAdd && (
        <div className="card" style={{ padding: '1.25rem', marginBottom: '1.25rem', border: '1px solid rgba(59,130,246,0.3)', animation: 'slideUp 0.2s ease' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={16} style={{ color: 'var(--accent-blue)' }} />
            Block New IP Address
          </h3>
          <form onSubmit={handleBlock} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '0.75rem', alignItems: 'end' }}>
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>IP Address *</label>
              <input
                id="block-ip-input"
                className="input"
                type="text"
                placeholder="e.g. 192.168.1.100"
                value={form.ip_address}
                onChange={e => setForm(f => ({ ...f, ip_address: e.target.value }))}
                required
                autoFocus
              />
            </div>
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Reason</label>
              <input
                className="input"
                type="text"
                placeholder="e.g. Brute force attack"
                value={form.reason}
                onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                <Clock size={11} style={{ display: 'inline', marginRight: 3 }} />
                Expires (optional)
              </label>
              <input
                className="input"
                type="datetime-local"
                value={form.expires_at}
                onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={adding}
                style={{ whiteSpace: 'nowrap' }}
              >
                {adding ? 'Blocking...' : 'Block IP'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowAdd(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters & Search */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="input"
            type="text"
            placeholder="Search by IP, reason, or blocked by..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '2rem' }}
          />
        </div>
        {['active', 'inactive', 'all'].map(f => (
          <button
            key={f}
            className={`btn ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter(f)}
            style={{ textTransform: 'capitalize', fontSize: '0.82rem' }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: 8 }} />
            <div style={{ fontSize: '0.85rem' }}>Loading blocked IPs...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Shield size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
            <div style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 4 }}>No blocked IPs</div>
            <div style={{ fontSize: '0.8rem' }}>
              {search ? 'No results match your search.' : 'Click "Block IP" to add an IP to the blocklist.'}
            </div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Status', 'IP Address', 'Reason', 'Blocked By', 'Blocked At', 'Expires', 'Action'].map(h => (
                  <th key={h} style={{
                    padding: '0.75rem 1rem', textAlign: 'left',
                    fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)',
                    textTransform: 'uppercase', letterSpacing: '0.05em'
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry, i) => (
                <tr key={entry.id} style={{
                  borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                  transition: 'background 0.15s'
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.75rem',
                      fontWeight: 600, padding: '3px 8px', borderRadius: 4,
                      color: entry.is_active ? '#ef4444' : '#22c55e',
                      background: entry.is_active ? '#ef444420' : '#22c55e20'
                    }}>
                      {entry.is_active ? <XCircle size={11} /> : <CheckCircle size={11} />}
                      {entry.is_active ? 'Blocked' : 'Unblocked'}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <code style={{
                      fontFamily: 'monospace', fontSize: '0.88rem', fontWeight: 700,
                      color: entry.is_active ? '#ef4444' : 'var(--text-secondary)',
                      background: 'rgba(0,0,0,0.2)', padding: '2px 8px', borderRadius: 4
                    }}>
                      {entry.ip_address}
                    </code>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.83rem', color: 'var(--text-secondary)', maxWidth: 200 }}>
                    <span title={entry.reason}>{entry.reason || '—'}</span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5, marginTop: 5 }}>
                    <User size={12} />
                    {entry.blocked_by || 'system'}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {timeAgo(entry.created_at)}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: entry.expires_at ? 'var(--accent-blue)' : 'var(--text-muted)' }}>
                    {entry.expires_at ? new Date(entry.expires_at).toLocaleDateString() : 'Never'}
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    {entry.is_active && (
                      <button
                        className="btn btn-secondary btn-icon"
                        style={{ color: '#ef4444', borderColor: '#ef444440' }}
                        onClick={() => handleUnblock(entry.id, entry.ip_address)}
                        title={`Unblock ${entry.ip_address}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Info box */}
      <div className="card" style={{
        marginTop: '1rem', padding: '0.875rem 1rem',
        background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)',
        display: 'flex', gap: '0.6rem', alignItems: 'flex-start'
      }}>
        <AlertTriangle size={15} style={{ color: 'var(--accent-blue)', flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
          <strong style={{ color: 'var(--text-secondary)' }}>Note:</strong> Blocked IPs are recorded here for visibility and can be enforced by your firewall or application middleware.
          This list can also be checked via the <code style={{ fontSize: '0.78rem' }}>GET /api/blocked-ips/check/:ip</code> endpoint.
          Set an expiry time for temporary blocks.
        </p>
      </div>
    </div>
  );
}
