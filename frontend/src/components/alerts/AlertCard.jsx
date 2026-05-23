import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink, CheckCircle, AlertCircle, Clock, Shield, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { alertsApi } from '../../api/client';
import toast from 'react-hot-toast';

const SEVERITY_CONFIG = {
  critical: { label: 'Critical', class: 'badge-critical', dot: '#ef4444' },
  high: { label: 'High', class: 'badge-high', dot: '#f97316' },
  medium: { label: 'Medium', class: 'badge-medium', dot: '#f59e0b' },
  low: { label: 'Low', class: 'badge-low', dot: '#10b981' }
};

const STATUS_CONFIG = {
  active: { label: 'Active', class: 'badge-active', icon: AlertCircle },
  investigating: { label: 'Investigating', class: 'badge-investigating', icon: Eye },
  resolved: { label: 'Resolved', class: 'badge-resolved', icon: CheckCircle },
  false_positive: { label: 'False Positive', class: 'badge-false-positive', icon: Shield }
};

export default function AlertCard({ alert, onStatusChange, onViewInsight, selectable, selected, onSelect }) {
  const [expanded, setExpanded] = useState(false);
  const [updating, setUpdating] = useState(false);

  const sev = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.medium;
  const statusCfg = STATUS_CONFIG[alert.status] || STATUS_CONFIG.active;
  const StatusIcon = statusCfg.icon;
  const timeAgo = alert.created_at ? formatDistanceToNow(new Date(alert.created_at), { addSuffix: true }) : '';

  const handleStatusChange = async (newStatus) => {
    setUpdating(true);
    try {
      await alertsApi.updateStatus(alert.id, newStatus);
      toast.success(`Alert marked as ${newStatus}`);
      onStatusChange?.(alert.id, newStatus);
    } catch (err) {
      toast.error('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className={`alert-item ${alert.severity}`} style={{ marginBottom: '0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
        {selectable && (
          <input type="checkbox" checked={selected} onChange={() => onSelect?.(alert.id)}
            style={{ marginTop: 4, accentColor: 'var(--accent-blue)', cursor: 'pointer', flexShrink: 0 }} />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
            <span className={`badge ${sev.class}`}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: sev.dot, display: 'inline-block' }} />
              {sev.label}
            </span>
            <span className={`badge ${statusCfg.class}`} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <StatusIcon size={10} />
              {statusCfg.label}
            </span>
            <span style={{ fontSize: '0.78rem', background: 'rgba(59,130,246,0.1)', color: 'var(--accent-blue)', padding: '0.15rem 0.5rem', borderRadius: 12, border: '1px solid rgba(59,130,246,0.2)' }}>
              {alert.attack_type}
            </span>
          </div>

          <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.3rem', fontSize: '0.9rem' }}>
            {alert.title}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            {alert.source_app && <span>📦 {alert.source_app}</span>}
            {alert.ip_address && <span className="font-mono">🌐 {alert.ip_address}</span>}
            {alert.username && <span>👤 {alert.username}</span>}
            {alert.endpoint && <span className="font-mono">📍 {alert.endpoint}</span>}
            <span>🕐 {timeAgo}</span>
          </div>

          {/* Actions row */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setExpanded(!expanded)} disabled={updating}>
              {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              AI Analysis
            </button>
            {onViewInsight && (
              <button className="btn btn-secondary btn-sm" onClick={() => onViewInsight(alert)}>
                <ExternalLink size={13} />
                Investigate
              </button>
            )}
            {alert.status !== 'resolved' && (
              <button className="btn btn-success btn-sm" onClick={() => handleStatusChange('resolved')} disabled={updating}>
                <CheckCircle size={13} />
                Resolve
              </button>
            )}
            {alert.status === 'active' && (
              <button className="btn btn-secondary btn-sm" onClick={() => handleStatusChange('investigating')} disabled={updating}>
                <Eye size={13} />
                Investigate
              </button>
            )}
            {alert.status !== 'false_positive' && (
              <button className="btn btn-secondary btn-sm" onClick={() => handleStatusChange('false_positive')} disabled={updating}
                style={{ color: 'var(--accent-purple)', borderColor: 'rgba(139,92,246,0.3)' }}>
                <Shield size={13} />
                False +
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Expanded AI Analysis */}
      {expanded && (
        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', animation: 'fadeIn 0.2s ease' }}>
          {alert.ai_explanation && (
            <div className="ai-panel" style={{ marginBottom: '0.75rem' }}>
              <div className="ai-header">
                <div className="ai-icon">🤖</div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>AI Threat Analysis</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>NeuroShield Intelligence Engine</div>
                </div>
              </div>
              <div className="ai-content" style={{ fontSize: '0.82rem' }}>
                {alert.ai_explanation.split('\n').map((line, i) => (
                  <React.Fragment key={i}>
                    {line.replace(/\*\*(.*?)\*\*/g, '$1')}
                    <br />
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}
          {alert.ai_recommendation && (
            <div style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 'var(--radius-sm)', padding: '0.75rem' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-blue)', marginBottom: '0.5rem' }}>💡 Recommended Actions</div>
              <div className="ai-content" style={{ fontSize: '0.8rem' }}>
                {alert.ai_recommendation.split('\n').map((line, i) => (
                  <React.Fragment key={i}>{line}<br /></React.Fragment>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
