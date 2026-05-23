import React, { useState, useEffect } from 'react';
import { applicationsApi, apiKeysApi } from '../api/client';
import { Globe, Plus, Trash2, Activity, AlertTriangle, CheckCircle, Key, RefreshCw, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const STATUS_COLORS = { active: 'var(--accent-green)', inactive: 'var(--text-muted)', error: 'var(--critical)' };

function AddAppModal({ onClose, onAdded }) {
  const [form, setForm] = useState({ name: '', description: '', url: '', type: 'web' });
  const [loading, setLoading] = useState(false);
  const [keyInfo, setKeyInfo] = useState(null);

  const handleSubmit = async () => {
    if (!form.name) { toast.error('Name required'); return; }
    setLoading(true);
    try {
      const appRes = await applicationsApi.createApplication(form);
      // Auto-create API key
      const keyRes = await apiKeysApi.createKey({ name: `${form.name} Default Key`, application_id: appRes.applicationId });
      setKeyInfo(keyRes.key);
      toast.success('Application registered!');
      onAdded?.();
    } catch (err) {
      toast.error(err.message || 'Failed to register application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Register New Application</span>
          <button className="btn btn-secondary btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        {!keyInfo ? (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div><label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>Application Name *</label>
                <input className="input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. My Web App" /></div>
              <div><label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>Description</label>
                <input className="input" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Brief description" /></div>
              <div><label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>URL</label>
                <input className="input" value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))} placeholder="https://example.com" /></div>
              <div><label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>Type</label>
                <select className="input" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                  {['web', 'api', 'mobile', 'banking', 'ecommerce', 'saas', 'other'].map(t => <option key={t} value={t}>{t}</option>)}
                </select></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
                {loading ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />} Register
              </button>
            </div>
          </>
        ) : (
          <div>
            <div style={{ padding: '1rem', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 'var(--radius-sm)', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: 'var(--accent-green)' }}>
                <CheckCircle size={18} /><strong>Application registered successfully!</strong>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>Your API key has been generated. Copy it now — it won't be shown again.</p>
              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 6, padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--accent-blue)', wordBreak: 'break-all' }}>
                {keyInfo.key_value}
              </div>
              <button className="btn btn-secondary btn-sm" style={{ marginTop: '0.5rem' }} onClick={() => { navigator.clipboard.writeText(keyInfo.key_value); toast.success('API key copied!'); }}>
                📋 Copy API Key
              </button>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <strong style={{ color: 'var(--text-primary)' }}>Integration Instructions:</strong><br/>
              Use this API key in your application's HTTP requests:<br/>
              <code style={{ fontFamily: 'monospace', color: 'var(--accent-cyan)' }}>X-API-Key: {keyInfo.key_value}</code><br/><br/>
              Send logs to: <code style={{ fontFamily: 'monospace', color: 'var(--accent-cyan)' }}>POST /api/ingest/log</code>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={onClose}>Done</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Applications() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchApps = async () => {
    setLoading(true);
    try {
      const res = await applicationsApi.getApplications();
      setApps(res.applications || []);
    } catch (err) {
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchApps(); }, []);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Remove "${name}" from monitoring?`)) return;
    try {
      await applicationsApi.deleteApplication(id);
      toast.success('Application removed');
      fetchApps();
    } catch (err) {
      toast.error('Failed to remove application');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1>Connected Applications</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Centralized multi-application security monitoring</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}><Plus size={16} />Register Application</button>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1rem' }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 200, borderRadius: 'var(--radius-lg)' }} />)}
        </div>
      ) : apps.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-state-icon">🌐</div>
          <h3>No applications connected</h3>
          <p>Register your first application to start monitoring its security events.</p>
          <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => setShowAddModal(true)}><Plus size={14} />Register Application</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1rem' }}>
          {apps.map(app => (
            <div key={app.id} className="card" style={{ position: 'relative' }}>
              {app.is_internal && (
                <span className="badge badge-info" style={{ position: 'absolute', top: '1rem', right: '1rem' }}>Internal</span>
              )}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-sm)', background: 'var(--accent-blue-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Globe size={22} color="var(--accent-blue)" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{app.name}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{app.description || app.url || 'No description'}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <span className="badge" style={{ background: STATUS_COLORS[app.status] === 'var(--accent-green)' ? 'rgba(16,185,129,0.1)' : 'rgba(100,116,139,0.1)', color: STATUS_COLORS[app.status] || 'var(--text-muted)', border: `1px solid ${STATUS_COLORS[app.status] || 'var(--border)'}`, opacity: 0.9 }}>
                  ● {app.status}
                </span>
                <span className="badge badge-info">{app.type}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                <div style={{ textAlign: 'center', padding: '0.5rem', background: 'var(--bg-secondary)', borderRadius: 6 }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-blue)' }}>{app.total_alerts || 0}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Total Alerts</div>
                </div>
                <div style={{ textAlign: 'center', padding: '0.5rem', background: 'var(--bg-secondary)', borderRadius: 6 }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: app.critical_alerts > 0 ? 'var(--critical)' : 'var(--text-secondary)' }}>{app.critical_alerts || 0}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Critical</div>
                </div>
              </div>

              {app.last_seen && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                  Last seen: {formatDistanceToNow(new Date(app.last_seen), { addSuffix: true })}
                </div>
              )}

              {app.api_keys?.length > 0 && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.75rem' }}>
                  <Key size={12} /> {app.api_keys.filter(k => k.is_active).length} active API key(s)
                </div>
              )}

              {!app.is_internal && (
                <button className="btn btn-danger btn-sm" style={{ width: '100%' }} onClick={() => handleDelete(app.id, app.name)}>
                  <Trash2 size={13} />Remove Application
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      {showAddModal && <AddAppModal onClose={() => setShowAddModal(false)} onAdded={fetchApps} />}
    </div>
  );
}
