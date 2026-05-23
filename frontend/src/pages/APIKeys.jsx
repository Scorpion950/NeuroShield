import React, { useState, useEffect, useCallback } from 'react';
import { apiKeysApi, applicationsApi } from '../api/client';
import { Key, Plus, Trash2, Copy, CheckCircle, RefreshCw, Eye, EyeOff, Shield, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

export default function APIKeys() {
  const [keys, setKeys] = useState([]);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [revealedId, setRevealedId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newKey, setNewKey] = useState({ name: '', application_id: '' });
  const [creating, setCreating] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [keysRes, appsRes] = await Promise.all([
        apiKeysApi.getAll(),
        applicationsApi.getAll()
      ]);
      setKeys(keysRes.keys || []);
      setApps(appsRes.applications || []);
    } catch (error) {
      toast.error('Failed to load API keys');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('API key copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRevoke = async (id, name) => {
    try {
      await apiKeysApi.revokeKey(id);
      toast.success(`"${name}" revoked`);
      fetchData();
    } catch {
      toast.error('Failed to revoke key');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newKey.name) return toast.error('Key name is required');
    setCreating(true);
    try {
      await apiKeysApi.createKey(newKey);
      toast.success(`API key "${newKey.name}" created`);
      setNewKey({ name: '', application_id: '' });
      setShowCreate(false);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to create key');
    } finally {
      setCreating(false);
    }
  };

  const maskKey = (key) => {
    if (!key) return '—';
    return key.substring(0, 8) + '••••••••••••••••' + key.slice(-4);
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.25rem' }}>API Keys</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Manage API keys for your monitored applications
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={fetchData} disabled={loading}>
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <button className="btn btn-primary" onClick={() => setShowCreate(s => !s)}>
            {showCreate ? <X size={15} /> : <Plus size={15} />}
            {showCreate ? 'Cancel' : 'Generate New Key'}
          </button>
        </div>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="card" style={{ marginBottom: '1.25rem', borderColor: 'rgba(59,130,246,0.25)', animation: 'fadeIn 0.2s ease' }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--text-bright)' }}>Generate New API Key</h3>
          <form onSubmit={handleCreate}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Key Name *</label>
                <input
                  className="input"
                  type="text"
                  placeholder="e.g. Production Key"
                  value={newKey.name}
                  onChange={e => setNewKey(p => ({ ...p, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Application</label>
                <select
                  className="input"
                  value={newKey.application_id}
                  onChange={e => setNewKey(p => ({ ...p, application_id: e.target.value }))}
                >
                  <option value="">No application</option>
                  {apps.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="submit" className="btn btn-primary btn-sm" disabled={creating}>
                <Key size={14} />
                {creating ? 'Generating...' : 'Generate Key'}
              </button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowCreate(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Keys list */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 88, borderRadius: 8 }} />)}
          </div>
        ) : keys.length === 0 ? (
          <div className="empty-state" style={{ padding: '4rem 2rem' }}>
            <div className="empty-state-icon"><Key size={48} style={{ opacity: 0.3 }} /></div>
            <h3>No API keys yet</h3>
            <p>Generate your first API key to start monitoring applications.</p>
            <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => setShowCreate(true)}>
              <Plus size={15} />
              Generate Key
            </button>
          </div>
        ) : (
          <div>
            {keys.map((key, idx) => {
              const app = apps.find(a => a.id === key.application_id);
              const isRevealed = revealedId === key.id;
              return (
                <div
                  key={key.id}
                  style={{
                    padding: '1.25rem 1.5rem',
                    borderBottom: idx < keys.length - 1 ? '1px solid var(--border)' : 'none',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,130,246,0.03)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: key.is_active ? 'rgba(59,130,246,0.1)' : 'rgba(100,116,139,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Key size={15} color={key.is_active ? 'var(--accent-blue)' : 'var(--text-muted)'} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{key.name}</span>
                            <span style={{
                              padding: '0.1rem 0.5rem', borderRadius: 20,
                              fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase',
                              background: key.is_active ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                              color: key.is_active ? 'var(--accent-green)' : 'var(--critical)',
                              border: `1px solid ${key.is_active ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
                            }}>
                              {key.is_active ? '● Active' : '● Revoked'}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                            {app ? `Linked to ${app.name}` : 'No application linked'} · Created {key.created_at ? formatDistanceToNow(new Date(key.created_at), { addSuffix: true }) : '—'}
                          </div>
                        </div>
                      </div>

                      {/* Key value */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', maxWidth: 560 }}>
                        <div style={{
                          flex: 1, padding: '0.6rem 1rem',
                          background: 'rgba(6,11,20,0.6)', border: '1px solid var(--border)',
                          borderRadius: 8, fontFamily: 'monospace', fontSize: '0.82rem',
                          color: 'var(--text-secondary)', letterSpacing: '0.02em',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {isRevealed ? key.key_value : maskKey(key.key_value)}
                        </div>
                        <button
                          onClick={() => setRevealedId(isRevealed ? null : key.id)}
                          className="btn btn-secondary btn-icon btn-sm"
                          title={isRevealed ? 'Hide key' : 'Reveal key'}
                        >
                          {isRevealed ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        <button
                          onClick={() => copyToClipboard(key.key_value, key.id)}
                          className="btn btn-secondary btn-icon btn-sm"
                          title="Copy to clipboard"
                        >
                          {copiedId === key.id ? <CheckCircle size={14} color="var(--accent-green)" /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0 }}>
                      {key.is_active && (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleRevoke(key.id, key.name)}
                        >
                          <Trash2 size={13} />
                          Revoke
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Security note */}
      <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
        <Shield size={14} color="var(--accent-orange)" style={{ flexShrink: 0 }} />
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
          API keys grant full access to NeuroShield. Never share them publicly. Revoke unused keys immediately.
        </p>
      </div>
    </div>
  );
}
