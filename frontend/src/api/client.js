import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
});

// Request interceptor - attach JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ns_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, (error) => Promise.reject(error));

// Response interceptor - handle 401
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('ns_token');
      localStorage.removeItem('ns_user');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error);
  }
);

// Auth
export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  me: () => api.get('/auth/me'),
  getUsers: () => api.get('/auth/users'),
  createUser: (data) => api.post('/auth/users', data),
  updateUser: (id, data) => api.put(`/auth/users/${id}`, data),
  deleteUser: (id) => api.delete(`/auth/users/${id}`)
};

// Dashboard
export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
  getRecentAlerts: () => api.get('/dashboard/recent-alerts'),
  getSystemHealth: () => api.get('/dashboard/system-health')
};

// Alerts
export const alertsApi = {
  getAlerts: (params) => api.get('/alerts', { params }),
  getAlert: (id) => api.get(`/alerts/${id}`),
  updateStatus: (id, status) => api.patch(`/alerts/${id}/status`, { status }),
  bulkAction: (data) => api.post('/alerts/bulk-action', data),
  deleteAlert: (id) => api.delete(`/alerts/${id}`),
  getIncidents: (params) => api.get('/incidents', { params })
};

// Applications
export const applicationsApi = {
  getAll: () => api.get('/applications'),
  getApplications: () => api.get('/applications'),
  getApplication: (id) => api.get(`/applications/${id}`),
  createApplication: (data) => api.post('/applications', data),
  updateApplication: (id, data) => api.put(`/applications/${id}`, data),
  deleteApplication: (id) => api.delete(`/applications/${id}`)
};

// API Keys
export const apiKeysApi = {
  getAll: () => api.get('/apikeys'),
  getKeys: () => api.get('/apikeys'),
  createKey: (data) => api.post('/apikeys', data),
  revokeKey: (id) => api.patch(`/apikeys/${id}/revoke`),
  activateKey: (id) => api.patch(`/apikeys/${id}/activate`),
  deleteKey: (id) => api.delete(`/apikeys/${id}`)
};

// Insights
export const insightsApi = {
  getSummary: () => api.get('/insights/summary'),
  getAlertInsight: (id) => api.get(`/insights/alert/${id}`),
  getTrends: (hours) => api.get('/insights/trends', { params: { hours } })
};

// Chat
export const chatApi = {
  sendMessage: (message, conversationHistory = []) =>
    api.post('/insights/chat', { message, conversationHistory })
};

// Incidents
export const incidentsApi = {
  getIncidents: (params) => api.get('/incidents', { params }),
  createIncident: (data) => api.post('/incidents', data),
  updateIncident: (id, data) => api.patch(`/incidents/${id}`, data),
  deleteIncident: (id) => api.delete(`/incidents/${id}`)
};

// Blocked IPs
export const blockedIpsApi = {
  getAll: (params) => api.get('/blocked-ips', { params }),
  block: (data) => api.post('/blocked-ips', data),
  unblock: (id) => api.delete(`/blocked-ips/${id}`),
  check: (ip) => api.get(`/blocked-ips/check/${ip}`)
};

export default api;
