import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';

const AlertContext = createContext(null);

export function AlertProvider({ children }) {
  const [liveAlerts, setLiveAlerts] = useState([]);
  const [wsConnected, setWsConnected] = useState(false);
  const [stats, setStats] = useState({ total: 0, critical: 0 });
  const wsRef = useRef(null);
  const reconnectRef = useRef(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // In dev Vite runs on 5173/5174 but WS backend is on 5000
    const backendHost = window.location.hostname + ':5000';
    const ws = new WebSocket(`${protocol}//${backendHost}/ws`);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsConnected(true);
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'new_alert') {
          const alert = msg.data;
          setLiveAlerts(prev => [alert, ...prev].slice(0, 100));
          setStats(prev => ({
            total: prev.total + 1,
            critical: prev.critical + (alert.severity === 'critical' ? 1 : 0)
          }));

          // Toast notification
          const severityEmoji = { critical: '🔴', high: '🟠', medium: '🟡', low: '🟢' };
          const toastFn = alert.severity === 'critical' ? toast.error :
                          alert.severity === 'high' ? toast.error : toast;
          toastFn(`${severityEmoji[alert.severity] || '⚠️'} ${alert.title}`, {
            duration: alert.severity === 'critical' ? 8000 : 4000,
            style: {
              background: '#0f1c30', color: '#e2e8f0',
              border: `1px solid ${alert.severity === 'critical' ? '#ef4444' : alert.severity === 'high' ? '#f97316' : '#f59e0b'}`,
              fontSize: '0.85rem'
            }
          });
        } else if (msg.type === 'stats_update') {
          // Handle stats updates
        } else if (msg.type === 'health_update') {
          // Handle health updates
        }
      } catch (e) {}
    };

    ws.onclose = () => {
      setWsConnected(false);
      reconnectRef.current = setTimeout(connect, 3000);
    };

    ws.onerror = () => { ws.close(); };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('ns_token');
    if (token) connect();
    return () => {
      if (wsRef.current) wsRef.current.close();
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
