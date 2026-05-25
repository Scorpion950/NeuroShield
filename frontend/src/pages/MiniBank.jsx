import React, { useState } from 'react';
import { CreditCard, LogIn, LogOut, DollarSign, ArrowRightLeft, AlertTriangle, Zap, Shield, User, Lock, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';

const SIMS = [
  { key: 'brute-force',          label: 'Brute Force',          color: '#ef4444', icon: '🔨', desc: 'Repeated failed logins' },
  { key: 'sql-injection',        label: 'SQL Injection',         color: '#f97316', icon: '💉', desc: 'SQL payloads on endpoints' },
  { key: 'suspicious-login',     label: 'Suspicious Login',      color: '#f59e0b', icon: '🌍', desc: 'Login from flagged country' },
  { key: 'api-abuse',            label: 'API Abuse',             color: '#8b5cf6', icon: '⚡', desc: 'Rapid automated requests' },
  { key: 'unauthorized-admin',   label: 'Unauthorized Admin',    color: '#ec4899', icon: '🚫', desc: 'Admin path access attempts' },
  { key: 'privilege-escalation', label: 'Privilege Escalation',  color: '#06b6d4', icon: '⬆️', desc: 'Role escalation payloads' },
  { key: 'abnormal-behavior',    label: 'Abnormal Behavior',     color: '#84cc16', icon: '🤖', desc: 'Multi-IP erratic patterns' },
  { key: 'all',                  label: 'All Attacks',           color: '#ef4444', icon: '💥', desc: 'Run all scenarios at once' },
];

const MOCK_TXN = [
  { id: 'TXN-001', type: 'credit', amount: 5000,  desc: 'Salary Deposit',    date: '2026-05-24' },
  { id: 'TXN-002', type: 'debit',  amount: 200,   desc: 'Utility Bill',      date: '2026-05-23' },
  { id: 'TXN-003', type: 'credit', amount: 1500,  desc: 'Freelance Payment', date: '2026-05-22' },
  { id: 'TXN-004', type: 'debit',  amount: 80,    desc: 'Subscription',      date: '2026-05-21' },
];

export default function MiniBank() {
  const [mbUser, setMbUser]     = useState(null);
  const [form, setForm]         = useState({ username: '', password: '' });
  const [logging, setLogging]   = useState(false);
  const [simRunning, setSimRunning] = useState(null);
  const [tab, setTab]           = useState('dashboard');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLogging(true);
    try {
      const data = await api.post('/minibank/auth/login', form);
      setMbUser(data.user);
      toast.success(`Welcome, ${data.user.username}!`);
    } catch (err) {
      toast.error(err.message || 'Invalid credentials');
    } finally {
      setLogging(false);
    }
  };

  const handleLogout = () => { setMbUser(null); setForm({ username: '', password: '' }); toast('Logged out of MiniBank'); };

  const runSim = async (sim) => {
    setSimRunning(sim.key);
    try {
      const defaults = {
        'brute-force': { attempts: 10, username: 'admin', interval_ms: 200 },
        'sql-injection': { count: 5 },
        'suspicious-login': { username: 'john.doe', country: 'CN', count: 3 },
        'api-abuse': { requests: 60 },
        'unauthorized-admin': { username: 'john.doe', count: 5 },
        'privilege-escalation': { username: 'bob.wilson' },
        'abnormal-behavior': { username: 'jane.smith', requests: 40 },
        'all': {}
      };
      await api.post(`/minibank/simulate/${sim.key}`, defaults[sim.key] || {});
      toast.success(`${sim.label} simulation started — watch the Alerts panel!`, { duration: 4000 });
    } catch (err) {
      toast.error(`Failed to run simulation: ${err.message || 'Backend not connected'}`);
    } finally {
      setTimeout(() => setSimRunning(null), 1500);
    }
  };

  if (!mbUser) {
    return (
      <div style={{ padding: '2rem', maxWidth: 900, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, #22c55e, #16a34a)', marginBottom: '1rem', boxShadow: '0 0 24px rgba(34,197,94,0.4)' }}>
            <CreditCard size={28} color="white" />
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>MiniBank</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 6, fontSize: '0.875rem' }}>
            Simulated banking app — generates realistic attack data for NeuroShield
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
          {/* Login form */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <LogIn size={16} style={{ color: '#22c55e' }} /> Sign In to MiniBank
            </h2>
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Username</label>
                <div style={{ position: 'relative' }}>
                  <User size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input className="input" style={{ paddingLeft: '2rem' }} placeholder="john.doe" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} required />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input className="input" type="password" style={{ paddingLeft: '2rem' }} placeholder="••••••••" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
                </div>
              </div>
              <button className="btn btn-primary" type="submit" disabled={logging} style={{ marginTop: 4 }}>
                {logging ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            {/* Quick fill buttons */}
            <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Quick login (demo accounts):</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {[['john.doe','password123'],['jane.smith','securepass'],['admin','admin@minibank'],['bob.wilson','bob1234']].map(([u, p]) => (
                  <button key={u} className="btn btn-secondary" style={{ fontSize: '0.72rem', padding: '3px 8px' }}
                    onClick={() => setForm({ username: u, password: p })}>
                    {u}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Attack simulations (no login needed) */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Zap size={16} style={{ color: '#f59e0b' }} /> Attack Simulator
            </h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Run simulations to generate alerts in NeuroShield</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {SIMS.slice(0, 5).map(sim => (
                <button key={sim.key} onClick={() => runSim(sim)} disabled={!!simRunning}
                  className="btn btn-secondary"
                  style={{ justifyContent: 'flex-start', gap: '0.6rem', fontSize: '0.8rem', opacity: simRunning && simRunning !== sim.key ? 0.6 : 1 }}>
                  <span>{sim.icon}</span>
                  <span style={{ fontWeight: 600 }}>{sim.label}</span>
                  <span style={{ color: 'var(--text-muted)', marginLeft: 'auto', fontSize: '0.72rem' }}>{sim.desc}</span>
                  {simRunning === sim.key && <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite', marginLeft: 4 }} />}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Logged in view ──────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '1.5rem', maxWidth: 900, margin: '0 auto' }}>
      {/* Bank header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #22c55e, #16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 14px rgba(34,197,94,0.3)' }}>
            <CreditCard size={20} color="white" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)' }}>MiniBank</div>
            <div style={{ fontSize: '0.75rem', color: '#22c55e' }}>● Connected to NeuroShield</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{mbUser.username}</span> · {mbUser.role}
          </div>
          <button className="btn btn-secondary" onClick={handleLogout} style={{ fontSize: '0.8rem', gap: '0.4rem' }}>
            <LogOut size={14} /> Logout
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.25rem', background: 'var(--bg-card)', borderRadius: 8, padding: 4, border: '1px solid var(--border)', width: 'fit-content' }}>
        {['dashboard', 'transfer', 'simulate'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: '0.4rem 1rem', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, textTransform: 'capitalize', transition: 'all 0.15s',
              background: tab === t ? 'var(--accent-blue)' : 'transparent',
              color: tab === t ? '#fff' : 'var(--text-muted)' }}>
            {t}
          </button>
        ))}
      </div>

      {/* Dashboard tab */}
      {tab === 'dashboard' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
            {[
              { label: 'Available Balance', value: `$${mbUser.balance?.toLocaleString() || '15,000'}`, icon: DollarSign, color: '#22c55e' },
              { label: 'Account Number', value: mbUser.account || 'ACC-001', icon: CreditCard, color: 'var(--accent-blue)' },
              { label: 'Account Status', value: 'Active', icon: Shield, color: '#22c55e' },
            ].map(s => (
              <div key={s.label} className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                <div style={{ padding: '0.625rem', borderRadius: 10, background: `${s.color}20` }}>
                  <s.icon size={20} style={{ color: s.color }} />
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s.label}</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>{s.value}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
              Recent Transactions
            </div>
            {MOCK_TXN.map((t, i) => (
              <div key={t.id} style={{ padding: '0.875rem 1.25rem', borderBottom: i < MOCK_TXN.length - 1 ? '1px solid var(--border)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: t.type === 'credit' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ArrowRightLeft size={16} style={{ color: t.type === 'credit' ? '#22c55e' : '#ef4444' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{t.desc}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{t.id} · {t.date}</div>
                  </div>
                </div>
                <div style={{ fontWeight: 700, color: t.type === 'credit' ? '#22c55e' : '#ef4444', fontSize: '0.95rem' }}>
                  {t.type === 'credit' ? '+' : '-'}${t.amount.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transfer tab */}
      {tab === 'transfer' && (
        <div className="card" style={{ padding: '1.5rem', maxWidth: 480 }}>
          <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1.25rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <ArrowRightLeft size={16} style={{ color: 'var(--accent-blue)' }} /> Transfer Funds
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {[['From Account', mbUser.account], ['To Account', ''], ['Amount ($)', ''], ['Memo', '']].map(([label, def]) => (
              <div key={label}>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>{label}</label>
                <input className="input" defaultValue={def} placeholder={label} />
              </div>
            ))}
            <button className="btn btn-primary" style={{ marginTop: 4 }} onClick={() => toast.success('Transfer submitted — log sent to NeuroShield')}>
              Transfer
            </button>
          </div>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.875rem' }}>
            Transfers are logged to NeuroShield for anomaly detection.
          </p>
        </div>
      )}

      {/* Simulate tab */}
      {tab === 'simulate' && (
        <div>
          <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8 }}>
            <AlertTriangle size={15} style={{ color: '#f59e0b', flexShrink: 0 }} />
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
              Simulations send real logs to NeuroShield. Watch the <strong>Alerts</strong> page or notification bell for live detections.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.875rem' }}>
            {SIMS.map(sim => (
              <div key={sim.key} className="card" style={{ padding: '1rem', border: `1px solid ${sim.color}30`, transition: 'border-color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = `${sim.color}70`}
                onMouseLeave={e => e.currentTarget.style.borderColor = `${sim.color}30`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.4rem' }}>{sim.icon}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{sim.label}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{sim.desc}</div>
                  </div>
                </div>
                <button onClick={() => runSim(sim)} disabled={!!simRunning}
                  className="btn btn-secondary"
                  style={{ width: '100%', fontSize: '0.8rem', borderColor: `${sim.color}50`, color: sim.color, marginTop: 4,
                    opacity: simRunning && simRunning !== sim.key ? 0.5 : 1 }}>
                  {simRunning === sim.key
                    ? <><RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> Running...</>
                    : `▶ Run ${sim.label}`}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
