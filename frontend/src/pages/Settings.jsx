import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/client';
import {
  User, Shield, Bell, Database, UserPlus, Trash2,
  Eye, EyeOff, CheckCircle, XCircle, Crown, Save, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

const SUPER_ADMINS = ['yash', 'shravani'];

function SectionCard({ icon: Icon, iconColor, title, children }) {
  return (
    <div className="card" style={{ marginBottom: '1.25rem' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        marginBottom: '1.5rem', paddingBottom: '1rem',
        borderBottom: '1px solid var(--border)'
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: `${iconColor}20`, border: `1px solid ${iconColor}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Icon size={18} color={iconColor} />
        </div>
        <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-bright)' }}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      style={{
        width: 44, height: 24, borderRadius: 12,
        background: checked ? 'var(--accent-blue)' : 'rgba(100,116,139,0.3)',
        border: 'none', cursor: 'pointer', position: 'relative',
        transition: 'background 0.2s', flexShrink: 0
      }}
    >
      <span style={{
        position: 'absolute', top: 2,
        left: checked ? 22 : 2,
        width: 20, height: 20, borderRadius: '50%',
        background: 'white', transition: 'left 0.2s',
        boxShadow: '0 1px 4px rgba(0,0,0,0.3)'
      }} />
    </button>
  );
}

export default function Settings() {
  const { user } = useAuth();
  const isSuperAdmin = SUPER_ADMINS.includes(user?.username?.toLowerCase());

  // Profile state
  const [email, setEmail] = useState(user?.email || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Notifications
  const [notifCritical, setNotifCritical] = useState(true);
  const [notifDigest, setNotifDigest] = useState(false);

  // User management (super admin only)
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', password: '', email: '' });
  const [showPass, setShowPass] = useState(false);
  const [addingUser, setAddingUser] = useState(false);

  useEffect(() => {
    if (isSuperAdmin) fetchUsers();
  }, [isSuperAdmin]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await authApi.getUsers();
      setUsers(res.users || []);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newUser.username || !newUser.password) return toast.error('Username and password required');
    setAddingUser(true);
    try {
      await authApi.createUser({ ...newUser, role: 'admin' });
      toast.success(`Admin "${newUser.username}" created successfully`);
      setNewUser({ username: '', password: '', email: '' });
      setShowAddUser(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.message || 'Failed to create user');
    } finally {
      setAddingUser(false);
    }
  };

  const handleDeactivate = async (userId, username) => {
    if (SUPER_ADMINS.includes(username.toLowerCase())) {
      return toast.error('Cannot deactivate a super admin');
    }
    try {
      await authApi.deleteUser(userId);
      toast.success(`"${username}" deactivated`);
      fetchUsers();
    } catch {
      toast.error('Failed to deactivate user');
    }
  };

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ marginBottom: '0.25rem' }}>Platform Settings</h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Manage your NeuroShield configuration and preferences
        </p>
      </div>

      {/* Profile */}
      <SectionCard icon={User} iconColor="var(--accent-blue)" title="Profile Settings">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Username</label>
            <input className="input" type="text" disabled value={user?.username || ''} style={{ opacity: 0.6, cursor: 'not-allowed' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</label>
            <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.75rem', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: 20 }}>
            {isSuperAdmin ? <Crown size={13} color="var(--accent-purple)" /> : <Shield size={13} color="var(--accent-purple)" />}
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-purple)' }}>
              {isSuperAdmin ? 'Super Admin' : user?.role || 'Admin'}
            </span>
          </div>
          <button
            className="btn btn-primary btn-sm"
            disabled={savingProfile}
            onClick={() => { setSavingProfile(true); setTimeout(() => { setSavingProfile(false); toast.success('Profile updated'); }, 800); }}
          >
            <Save size={14} />
            {savingProfile ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </SectionCard>

      {/* Notifications */}
      <SectionCard icon={Bell} iconColor="var(--accent-orange)" title="Notification Preferences">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[
            { label: 'Critical Alert Notifications', desc: 'Receive immediate notifications for critical severity threats', val: notifCritical, set: setNotifCritical },
            { label: 'Daily Security Digest', desc: 'Receive a morning summary of AI security insights', val: notifDigest, set: setNotifDigest },
          ].map(({ label, desc, val, set }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', background: 'rgba(15,23,42,0.5)', border: '1px solid var(--border)', borderRadius: 10 }}>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>{label}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{desc}</div>
              </div>
              <Toggle checked={val} onChange={set} />
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Data Management */}
      <SectionCard icon={Database} iconColor="var(--accent-green)" title="Data Management">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', background: 'rgba(15,23,42,0.5)', border: '1px solid var(--border)', borderRadius: 10 }}>
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>Log Retention Period</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>How long logs and alerts are stored before archiving</div>
          </div>
          <select className="input" style={{ width: 'auto' }}>
            <option>30 Days</option>
            <option>90 Days</option>
            <option>1 Year</option>
            <option>Indefinite</option>
          </select>
        </div>
      </SectionCard>

      {/* Super Admin: User Management */}
      {isSuperAdmin && (
        <SectionCard icon={Crown} iconColor="var(--accent-purple)" title="Admin User Management">
          <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: 8, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            <Crown size={14} color="var(--accent-purple)" style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
            Only <strong style={{ color: 'var(--accent-purple)' }}>Super Admins</strong> (yash, shravani) can create or deactivate admin accounts. New admins cannot create further admins.
          </div>

          {/* User list */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                All Admins ({users.filter(u => u.is_active).length} active)
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-secondary btn-sm" onClick={fetchUsers} disabled={loadingUsers}>
                  <RefreshCw size={13} className={loadingUsers ? 'animate-spin' : ''} />
                </button>
                <button className="btn btn-primary btn-sm" onClick={() => setShowAddUser(s => !s)}>
                  <UserPlus size={14} />
                  Add Admin
                </button>
              </div>
            </div>

            {loadingUsers ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 56, borderRadius: 8 }} />)}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {users.map(u => {
                  const isSuper = SUPER_ADMINS.includes(u.username?.toLowerCase());
                  return (
                    <div key={u.id} style={{
                      display: 'flex', alignItems: 'center', gap: '1rem',
                      padding: '0.75rem 1rem',
                      background: u.is_active ? 'rgba(15,23,42,0.5)' : 'rgba(239,68,68,0.04)',
                      border: `1px solid ${u.is_active ? 'var(--border)' : 'rgba(239,68,68,0.15)'}`,
                      borderRadius: 8,
                      opacity: u.is_active ? 1 : 0.6,
                    }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: isSuper ? 'linear-gradient(135deg, #8b5cf6, #3b82f6)' : 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.8rem', fontWeight: 700, color: 'white', flexShrink: 0
                      }}>
                        {u.username?.substring(0, 2).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{u.username}</span>
                          {isSuper && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '0.1rem 0.5rem', background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: 20, fontSize: '0.65rem', fontWeight: 700, color: 'var(--accent-purple)' }}>
                              <Crown size={10} />SUPER
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {u.email || 'No email'} · Last login: {u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Never'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {u.is_active
                          ? <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: 'var(--accent-green)' }}><CheckCircle size={12} />Active</span>
                          : <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: 'var(--critical)' }}><XCircle size={12} />Inactive</span>
                        }
                        {!isSuper && u.username !== user?.username && u.is_active && (
                          <button
                            className="btn btn-danger btn-sm"
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                            onClick={() => handleDeactivate(u.id, u.username)}
                          >
                            <Trash2 size={12} />
                            Deactivate
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Add user form */}
          {showAddUser && (
            <form onSubmit={handleAddUser} style={{
              padding: '1.25rem', background: 'rgba(59,130,246,0.04)',
              border: '1px solid rgba(59,130,246,0.15)', borderRadius: 10,
              animation: 'fadeIn 0.2s ease'
            }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>
                Create New Admin Account
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem', marginBottom: '0.875rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>Username *</label>
                  <input
                    className="input"
                    type="text"
                    placeholder="e.g. rahul"
                    value={newUser.username}
                    onChange={e => setNewUser(p => ({ ...p, username: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>Email</label>
                  <input
                    className="input"
                    type="email"
                    placeholder="admin@company.com"
                    value={newUser.email}
                    onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))}
                  />
                </div>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>Password *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="input"
                    type={showPass ? 'text' : 'password'}
                    placeholder="Strong password"
                    value={newUser.password}
                    onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))}
                    style={{ paddingRight: '2.5rem' }}
                    required
                  />
                  <button type="button" onClick={() => setShowPass(s => !s)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="submit" className="btn btn-primary btn-sm" disabled={addingUser}>
                  <UserPlus size={14} />
                  {addingUser ? 'Creating...' : 'Create Admin'}
                </button>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowAddUser(false)}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </SectionCard>
      )}
    </div>
  );
}
