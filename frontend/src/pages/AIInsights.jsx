import React, { useState, useEffect } from 'react';
import { insightsApi } from '../api/client';
import { Brain, AlertTriangle, Clock, Lightbulb, TrendingUp, Shield, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { alertsApi } from '../api/client';
import toast from 'react-hot-toast';

function InsightPanel({ alert, insight, onBack }) {
  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <button className="btn btn-secondary btn-sm" onClick={onBack}>← Back</button>
        <h2 style={{ margin: 0 }}>AI Investigation: {alert.title}</h2>
      </div>

      {/* Alert summary card */}
      <div className={`card alert-item ${alert.severity}`} style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Severity</div>
            <span className={`badge badge-${alert.severity}`}>{alert.severity?.toUpperCase()}</span></div>
          <div><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Attack Type</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{alert.attack_type}</div></div>
          <div><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Source IP</div>
            <div style={{ fontSize: '0.875rem', fontFamily: 'monospace', color: 'var(--accent-blue)' }}>{alert.ip_address || 'N/A'}</div></div>
          <div><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Targeted User</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{alert.username || 'N/A'}</div></div>
          <div><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Application</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{alert.source_app || 'N/A'}</div></div>
          <div><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Detected</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{alert.created_at ? formatDistanceToNow(new Date(alert.created_at), { addSuffix: true }) : 'N/A'}</div></div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '1rem' }}>
        {/* Main AI analysis */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* AI Explanation */}
          <div className="ai-panel">
            <div className="ai-header">
              <div className="ai-icon">🤖</div>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>AI Threat Analysis</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>NeuroShield Intelligence Engine v1.0</div>
              </div>
            </div>
            <div className="ai-content">
              {(insight?.aiAnalysis?.explanation || alert.ai_explanation || 'No AI analysis available').split('\n').map((line, i) => (
                <React.Fragment key={i}>
                  {line.replace(/\*\*(.*?)\*\*/g, '$1')}<br />
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="card">
            <div className="card-header"><span className="card-title"><Lightbulb size={16} /> Recommended Actions</span>
              <span className={`badge badge-${alert.severity}`}>{insight?.aiAnalysis?.analysis?.mitigation_priority || 'Review'}</span>
            </div>
            <div>
              {(insight?.aiAnalysis?.analysis?.recommendations || []).map((rec, i) => (
                <div key={i} className="ai-rec-item">
                  <span className="ai-rec-num">{i + 1}.</span>
                  <span>{rec}</span>
                </div>
              ))}
              {(!insight?.aiAnalysis?.analysis?.recommendations || insight.aiAnalysis.analysis.recommendations.length === 0) && (
                <div className="ai-content" style={{ fontSize: '0.82rem' }}>
                  {(alert.ai_recommendation || 'Review the alert and take appropriate action.').split('\n').map((line, i) => (
                    <React.Fragment key={i}>{line}<br /></React.Fragment>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Timeline */}
          <div className="card">
            <div className="card-header"><span className="card-title"><Clock size={15} /> Event Timeline</span></div>
            <div className="timeline">
              {(insight?.timeline || [{ time: alert.created_at, event: 'Alert detected' }]).map((t, i) => (
                <div key={i} className="timeline-item">
                  <div className="timeline-dot" />
                  <div className="timeline-content">
                    <div className="timeline-time">{t.time ? formatDistanceToNow(new Date(t.time), { addSuffix: true }) : ''}</div>
                    <div className="timeline-event">{t.event}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Related alerts */}
          {insight?.relatedAlerts?.length > 0 && (
            <div className="card">
              <div className="card-header"><span className="card-title"><AlertTriangle size={15} /> Related Alerts</span></div>
              {insight.relatedAlerts.map(r => (
                <div key={r.id} style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.8rem' }}>
                  <span className={`badge badge-${r.severity}`} style={{ marginRight: '0.5rem' }}>{r.severity}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{r.title}</span>
                </div>
              ))}
            </div>
          )}

          {/* Supporting evidence */}
          {insight?.aiAnalysis?.analysis?.supporting_evidence?.length > 0 && (
            <div className="card">
              <div className="card-header"><span className="card-title"><Shield size={15} /> Supporting Evidence</span></div>
              {insight.aiAnalysis.analysis.supporting_evidence.map((e, i) => (
                <div key={i} style={{ padding: '0.35rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.5rem' }}>
                  <span style={{ color: 'var(--accent-blue)' }}>•</span>{e}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AIInsights() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [alertInsight, setAlertInsight] = useState(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const alertId = searchParams.get('alertId');
    Promise.all([
      insightsApi.getSummary(),
      alertsApi.getAlerts({ limit: 15, status: 'active' })
    ]).then(([sumRes, alertsRes]) => {
      setSummary(sumRes);
      setRecentAlerts(alertsRes.alerts || []);
      if (alertId) loadAlertInsight({ id: alertId });
    }).catch(() => toast.error('Failed to load insights'))
      .finally(() => setLoading(false));
  }, []);

  const loadAlertInsight = async (alert) => {
    setSelectedAlert(alert);
    setInsightLoading(true);
    try {
      const res = await insightsApi.getAlertInsight(alert.id);
      setAlertInsight(res);
    } catch {
      toast.error('Failed to load alert insight');
    } finally {
      setInsightLoading(false);
    }
  };

  if (selectedAlert && !insightLoading) {
    return (
      <div>
        <InsightPanel alert={alertInsight?.alert || selectedAlert} insight={alertInsight}
          onBack={() => { setSelectedAlert(null); setAlertInsight(null); }} />
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1>AI Insights</h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>AI-powered threat analysis, summaries, and recommendations</p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 'var(--radius-lg)' }} />)}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Daily AI Summary */}
            <div className="ai-panel">
              <div className="ai-header">
                <div className="ai-icon" style={{ fontSize: '1.3rem' }}>🤖</div>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Daily Security Summary</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Generated by NeuroShield AI</div>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                  <span className={`badge badge-${summary?.summary?.risk_level === 'CRITICAL' ? 'critical' : summary?.summary?.risk_level === 'HIGH' ? 'high' : 'medium'}`}>
                    Risk: {summary?.summary?.risk_level || 'LOW'}
                  </span>
                </div>
              </div>
              <div className="ai-content" style={{ whiteSpace: 'pre-wrap' }}>
                {(summary?.summary?.summary || 'No activity to summarize today.').replace(/\*\*(.*?)\*\*/g, '$1')}
              </div>
              {summary?.summary?.priority_action && (
                <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 6, fontSize: '0.83rem', color: 'var(--high)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <AlertTriangle size={15} /> {summary.summary.priority_action}
                </div>
              )}
            </div>

            {/* Recent alerts for investigation */}
            <div className="card">
              <div className="card-header"><span className="card-title"><Brain size={16} /> Investigate Alerts</span></div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Click on an alert below to get detailed AI analysis and recommendations.</p>
              {recentAlerts.length === 0 ? (
                <div className="empty-state" style={{ padding: '2rem' }}>
                  <div className="empty-state-icon">✅</div>
                  <h3>No active alerts</h3>
                  <p>Run attack simulations on MiniBank to generate alerts for analysis.</p>
                </div>
              ) : (
                recentAlerts.map(alert => (
                  <div key={alert.id} style={{ padding: '0.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', marginBottom: '0.5rem', cursor: 'pointer', transition: 'var(--transition)' }}
                    className={`alert-item ${alert.severity}`}
                    onClick={() => loadAlertInsight(alert)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span className={`badge badge-${alert.severity}`}>{alert.severity}</span>
                      <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', flex: 1 }}>{alert.title}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--accent-blue)' }}>Analyze →</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Sidebar: Top threats & stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="card">
              <div className="card-header"><span className="card-title"><TrendingUp size={15} /> Top Threats Today</span></div>
              {summary?.topThreats?.length > 0 ? summary.topThreats.map((t, i) => (
                <div key={i} style={{ padding: '0.6rem 0', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', width: 20, textAlign: 'center' }}>#{i + 1}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>{t.attack_type}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t.count} incidents</div>
                  </div>
                  <span className={`badge badge-${t.max_severity}`}>{t.max_severity}</span>
                </div>
              )) : <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '1rem 0' }}>No threats detected today</div>}
            </div>

            <div className="card">
              <div className="card-header"><span className="card-title">Affected Applications</span></div>
              {summary?.affectedApps?.length > 0 ? summary.affectedApps.map((app, i) => (
                <div key={i} style={{ padding: '0.6rem 0', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{app.source_app}</span>
                  <span className="badge badge-info">{app.alert_count} alerts</span>
                </div>
              )) : <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '1rem 0' }}>No affected applications</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
