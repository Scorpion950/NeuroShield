import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, User, ArrowRight, Loader2, Eye, EyeOff, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focused, setFocused] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) return toast.error('Please fill in all fields');

    setIsLoading(true);
    try {
      await login(username, password);
      toast.success('Welcome back to NeuroShield');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      display: 'flex',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* ── Animated background mesh ── */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{
          position: 'absolute', top: '-20%', left: '-10%',
          width: '55%', height: '70%',
          background: 'radial-gradient(ellipse, rgba(59,130,246,0.12) 0%, transparent 70%)',
          animation: 'floatA 8s ease-in-out infinite alternate',
        }} />
        <div style={{
          position: 'absolute', bottom: '-10%', right: '-10%',
          width: '50%', height: '60%',
          background: 'radial-gradient(ellipse, rgba(139,92,246,0.1) 0%, transparent 70%)',
          animation: 'floatB 10s ease-in-out infinite alternate',
        }} />
        {/* Grid lines */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.03 }}>
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#3b82f6" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* ── Left panel – branding ── */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '4rem',
        position: 'relative',
        zIndex: 1,
      }} className="login-left-panel">
        <div style={{ maxWidth: 480 }}>
          {/* Logo row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '3rem' }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 30px rgba(59,130,246,0.4)',
            }}>
              <Shield size={24} color="white" />
            </div>
            <div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-bright)', letterSpacing: '-0.02em' }}>
                Neuro<span style={{ color: 'var(--accent-blue)' }}>Shield</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Security Platform
              </div>
            </div>
          </div>

          <h1 style={{ fontSize: '2.75rem', fontWeight: 800, lineHeight: 1.15, marginBottom: '1.25rem', letterSpacing: '-0.03em' }}>
            AI-Powered<br />
            <span style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Threat Intelligence
            </span>
          </h1>
          <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: 380, marginBottom: '3rem' }}>
            Real-time security monitoring, anomaly detection, and AI-driven incident response — all in one unified platform.
          </p>

          {/* Feature pills */}
          {[
            { icon: '🛡️', text: 'Zero-trust threat detection' },
            { icon: '⚡', text: 'Real-time alerts & WebSocket feed' },
            { icon: '🤖', text: 'AI-powered risk scoring' },
          ].map(f => (
            <div key={f.text} style={{
              display: 'flex', alignItems: 'center', gap: '0.875rem',
              marginBottom: '1rem', padding: '0.75rem 1rem',
              background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.1)',
              borderRadius: 10,
            }}>
              <span style={{ fontSize: '1.1rem' }}>{f.icon}</span>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{f.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel – form ── */}
      <div style={{
        width: 480,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        position: 'relative',
        zIndex: 1,
        flexShrink: 0,
      }} className="login-right-panel">
        <div style={{
          width: '100%',
          background: 'rgba(13,21,38,0.85)',
          border: '1px solid rgba(56,100,180,0.2)',
          borderRadius: 24,
          padding: '2.5rem',
          backdropFilter: 'blur(24px)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03)',
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 56, height: 56, borderRadius: 16,
              background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.15))',
              border: '1px solid rgba(59,130,246,0.25)',
              marginBottom: '1rem',
            }}>
              <Lock size={22} color="#3b82f6" />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-bright)', marginBottom: '0.4rem' }}>
              Secure Access
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Sign in to your NeuroShield admin console
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Username */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{
                display: 'block', fontSize: '0.8rem', fontWeight: 600,
                color: 'var(--text-secondary)', marginBottom: '0.5rem',
                letterSpacing: '0.04em', textTransform: 'uppercase',
              }}>Username</label>
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)',
                  color: focused === 'username' ? 'var(--accent-blue)' : 'var(--text-muted)',
                  transition: 'color 0.2s',
                }}>
                  <User size={16} />
                </div>
                <input
                  id="login-username"
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  onFocus={() => setFocused('username')}
                  onBlur={() => setFocused('')}
                  placeholder="Enter your username"
                  autoComplete="username"
                  style={{
                    width: '100%', padding: '0.85rem 1rem 0.85rem 2.75rem',
                    background: focused === 'username' ? 'rgba(59,130,246,0.05)' : 'rgba(15,23,42,0.6)',
                    border: `1px solid ${focused === 'username' ? 'rgba(59,130,246,0.5)' : 'rgba(56,100,180,0.2)'}`,
                    borderRadius: 12, color: 'var(--text-primary)', fontSize: '0.9rem',
                    outline: 'none', transition: 'all 0.2s',
                    fontFamily: 'inherit',
                    boxShadow: focused === 'username' ? '0 0 0 3px rgba(59,130,246,0.08)' : 'none',
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: '1.75rem' }}>
              <label style={{
                display: 'block', fontSize: '0.8rem', fontWeight: 600,
                color: 'var(--text-secondary)', marginBottom: '0.5rem',
                letterSpacing: '0.04em', textTransform: 'uppercase',
              }}>Password</label>
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)',
                  color: focused === 'password' ? 'var(--accent-blue)' : 'var(--text-muted)',
                  transition: 'color 0.2s',
                }}>
                  <Lock size={16} />
                </div>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused('')}
                  placeholder="••••••••••"
                  autoComplete="current-password"
                  style={{
                    width: '100%', padding: '0.85rem 2.75rem 0.85rem 2.75rem',
                    background: focused === 'password' ? 'rgba(59,130,246,0.05)' : 'rgba(15,23,42,0.6)',
                    border: `1px solid ${focused === 'password' ? 'rgba(59,130,246,0.5)' : 'rgba(56,100,180,0.2)'}`,
                    borderRadius: 12, color: 'var(--text-primary)', fontSize: '0.9rem',
                    outline: 'none', transition: 'all 0.2s',
                    fontFamily: 'inherit',
                    boxShadow: focused === 'password' ? '0 0 0 3px rgba(59,130,246,0.08)' : 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  style={{
                    position: 'absolute', right: '0.9rem', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-muted)', padding: '0.2rem',
                    display: 'flex', alignItems: 'center',
                  }}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: '0.6rem', padding: '0.95rem 1.5rem',
                background: isLoading ? 'rgba(59,130,246,0.5)' : 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                color: 'white', border: 'none', borderRadius: 12,
                fontSize: '0.95rem', fontWeight: 700, cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.25s', letterSpacing: '0.01em',
                boxShadow: isLoading ? 'none' : '0 4px 20px rgba(59,130,246,0.35)',
                fontFamily: 'inherit',
              }}
              onMouseEnter={e => { if (!isLoading) e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              {isLoading ? (
                <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <>
                  <span>Sign In to Console</span>
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          {/* Security notice */}
          <div style={{
            marginTop: '1.75rem', padding: '0.875rem 1rem',
            background: 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.1)',
            borderRadius: 10, display: 'flex', alignItems: 'center', gap: '0.625rem',
          }}>
            <Zap size={14} color="var(--accent-blue)" style={{ flexShrink: 0 }} />
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
              Protected by NeuroShield AI. All login attempts are logged and monitored.
            </p>
          </div>
        </div>
      </div>

      {/* Keyframe styles injected inline */}
      <style>{`
        @keyframes floatA {
          from { transform: translate(0, 0) scale(1); }
          to   { transform: translate(4%, 6%) scale(1.08); }
        }
        @keyframes floatB {
          from { transform: translate(0, 0) scale(1); }
          to   { transform: translate(-5%, -4%) scale(1.05); }
        }
        @media (max-width: 900px) {
          .login-left-panel { display: none !important; }
          .login-right-panel { width: 100% !important; }
        }
      `}</style>
    </div>
  );
}
