import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import StatCard from '../components/common/StatCard';
import AlertCard from '../components/alerts/AlertCard';
import { SeverityTimelineChart, AttackTypeChart, SeverityPieChart, AppDistributionChart } from '../components/charts/Charts';
import { dashboardApi, insightsApi } from '../api/client';
import { useAlerts } from '../context/AlertContext';
import { AlertTriangle, Shield, Globe, Brain, RefreshCw, Activity, TrendingUp, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const navigate = useNavigate();
  const { liveAlerts, wsConnected } = useAlerts();
  const [stats, setStats] = useState(null);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, alertsRes, trendsRes] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getRecentAlerts(),
        insightsApi.getTrends(24)
      ]);
      setStats(statsRes.stats);
      setRecentAlerts(alertsRes.alerts || []);
      setTrends(trendsRes);
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Merge live alerts into recent alerts
  const displayAlerts = [...liveAlerts.slice(0, 5), ...recentAlerts].slice(0, 10)
    .filter((alert, idx, arr) => arr.findIndex(a => a.id === alert.id) === idx);

  const handleRefresh = () => { setRefreshing(true); fetchData(); };

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.25rem' }}>Security Dashboard</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Real-time threat monitoring and AI-powered security analysis
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: wsConnected ? 'var(--accent-green)' : 'var(--critical)' }}>
            <div className={`pulse-dot ${wsConnected ? 'green' : 'red'}`} />
            {wsConnected ? 'Live Monitoring Active' : 'Connection Lost'}
          </div>
          <button className="btn btn-secondary" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/alerts')}>
            <AlertTriangle size={15} />
            View All Alerts
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <StatCard title="Total Alerts Today" value={stats?.total_alerts_today ?? 0} icon={AlertTriangle} color="blue" loading={loading} />
        <StatCard title="Critical Threats" value={stats?.critical_threats ?? 0} icon={Zap} color="critical" loading={loading} />
        <StatCard title="Apps Monitored" value={stats?.apps_monitored ?? 0} icon={Globe} color="green" loading={loading} />
        <StatCard title="AI Actions Taken" value={stats?.ai_actions_taken ?? 0} icon={Brain} color="purple" loading={loading} />
      </div>

      {/* Secondary stats */}
      <div className="three-col" style={{ marginBottom: '1.5rem' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-green)' }}>{stats?.resolved_today ?? 0}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Resolved Today</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--medium)' }}>{stats?.active_alerts ?? 0}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Active Alerts</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-blue)' }}>{stats?.logs_processed_today ?? 0}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Logs Processed</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="charts-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title"><TrendingUp size={16} /> Threat Activity Timeline (24h)</span>
          </div>
          <SeverityTimelineChart data={trends?.hourlyTrends} />
        </div>
        <div className="card">
          <div className="card-header">
            <span className="card-title"><Activity size={16} /> Attack Type Distribution</span>
          </div>
          <AttackTypeChart data={trends?.attackDistribution} />
        </div>
      </div>

      <div className="charts-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title"><Shield size={16} /> Severity Distribution</span>
          </div>
          <SeverityPieChart data={trends?.severityDistribution} />
        </div>
        <div className="card">
          <div className="card-header">
            <span className="card-title"><Globe size={16} /> Alerts by Application</span>
          </div>
          <AppDistributionChart data={trends?.appDistribution} />
        </div>
      </div>

      {/* Live Threat Feed */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">
            <div className="pulse-dot red" style={{ display: 'inline-block', marginRight: 4 }} />
            Live Threat Feed
          </span>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/alerts')}>
            View All →
          </button>
        </div>

        {displayAlerts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🛡️</div>
            <h3>No threats detected</h3>
            <p>Your systems are clean. Alerts will appear here in real-time when threats are detected.</p>
          </div>
        ) : (
          <div>
            {displayAlerts.map(alert => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onStatusChange={(id, status) => {
                  setRecentAlerts(prev => prev.map(a => a.id === id ? { ...a, status } : a));
                }}
                onViewInsight={(alert) => navigate(`/insights?alertId=${alert.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
