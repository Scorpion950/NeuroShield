import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';

const AlertContext = createContext(null);

export function AlertProvider({ children }) {
  const [liveAlerts, setLiveAlerts] = useState([]);
  const [wsConnected, setWsConnected] = useState(false);
  const [stats, setStats] = useState({ total: 0, critical: 0 });
  const esRef = useRef(null);
  const reconnectRef = useRef(null);

  const connect = useCallback(() => {
    if (esRef.current && esRef.current.readyState !== EventSource.CLOSED) return;

    // In dev Vite proxies /api to backend; in production it's same-origin
    const sseUrl = '/api/events/stream';
    const es = new EventSource(sseUrl);
    esRef.current = es;

    es.onopen = () => {
      setWsConnected(true);
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
    };

    es.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg.type === 'connected') {
          setWsConnected(true);
        } else if (msg.type === 'new_alert') {
          const alert = msg.data;
          setLiveAlerts(prev => [alert, ...prev].slice(0, 100));
          setStats(prev => ({
            total: prev.total + 1,
            critical: prev.critical + (alert.severity === 'critical' ? 1 : 0)
          }));

          const severityEmoji = { critical: '🔴', high: '🟠', medium: '🟡', low: '🟢' };
          const toastFn = (alert.severity === 'critical' || alert.severity === 'high')
            ? toast.error : toast;
          toastFn(`${severityEmoji[alert.severity] || '⚠️'} ${alert.title}`, {
            duration: alert.severity === 'critical' ? 8000 : 4000,
            style: {
              background: '#0f1c30', color: '#e2e8f0',
              border: `1px solid ${
                alert.severity === 'critical' ? '#ef4444' :
                alert.severity === 'high' ? '#f97316' : '#f59e0b'
              }`,
              fontSize: '0.85rem'
            }
          });
        } else if (msg.type === 'stats_update') {
          // handle stats
        }
      } catch (e) {}
    };

    es.onerror = () => {
      setWsConnected(false);
      es.close();
      esRef.current = null;
      reconnectRef.current = setTimeout(connect, 5000);
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('ns_token');
    if (token) {
      connect();
      // Fetch initial active alerts so the notification panel isn't empty on reload
      fetch('/api/alerts?limit=10&status=active', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.alerts) {
          setLiveAlerts(data.alerts);
        }
      })
      .catch(() => {});
    }
    return () => {
      if (esRef.current) esRef.current.close();
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
    };
  }, [connect]);

  const clearLiveAlerts = () => setLiveAlerts([]);

  return (
    <AlertContext.Provider value={{ liveAlerts, wsConnected, stats, clearLiveAlerts, reconnect: connect }}>
      {children}
    </AlertContext.Provider>
  );
}

export function useAlerts() {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error('useAlerts must be used within AlertProvider');
  return ctx;
}
