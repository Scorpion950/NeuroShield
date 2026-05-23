import React, { useState, useEffect } from 'react';
import { SeverityTimelineChart, AttackTypeChart, SeverityPieChart, AppDistributionChart } from '../components/charts/Charts';
import { insightsApi } from '../api/client';
import { BarChart3, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const TIME_RANGES = [
  { label: '1 Hour', value: 1 },
  { label: '6 Hours', value: 6 },
  { label: '24 Hours', value: 24 },
  { label: '7 Days', value: 168 }
];

export default function ThreatAnalytics() {
  const [trends, setTrends] = useState(null);
  const [timeRange, setTimeRange] = useState(24);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    insightsApi.getTrends(timeRange)
      .then(res => setTrends(res))
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, [timeRange]);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1>Threat Analytics</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Visual insights into threat patterns and attack trends</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {TIME_RANGES.map(r => (
            <button key={r.value} className={`filter-chip ${timeRange === r.value ? 'active' : ''}`}
              onClick={() => setTimeRange(r.value)}>
              <Clock size={12} />{r.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 280, borderRadius: 'var(--radius-lg)' }} />)}
        </div>
      ) : (
        <>
          <div className="card" style={{ marginBottom: '1rem' }}>
            <div className="card-header">
              <span className="card-title"><BarChart3 size={16} /> Threat Activity Timeline</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Last {timeRange}h</span>
            </div>
            <SeverityTimelineChart data={trends?.hourlyTrends} />
          </div>
          <div className="charts-grid" style={{ marginBottom: '1rem' }}>
            <div className="card">
              <div className="card-header"><span className="card-title">Attack Type Breakdown</span></div>
              <AttackTypeChart data={trends?.attackDistribution} />
            </div>
            <div className="card">
              <div className="card-header"><span className="card-title">Severity Distribution</span></div>
              <SeverityPieChart data={trends?.severityDistribution} />
            </div>
          </div>
          <div className="card">
            <div className="card-header"><span className="card-title">Alerts by Application</span></div>
            <AppDistributionChart data={trends?.appDistribution} />
          </div>
        </>
      )}
    </div>
  );
}
