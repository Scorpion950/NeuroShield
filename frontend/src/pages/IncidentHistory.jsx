import React, { useState, useEffect } from 'react';
import { alertsApi } from '../api/client';
import { Clock, CheckCircle, AlertTriangle, Search, Filter } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function IncidentHistory() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    try {
      const res = await alertsApi.getIncidents();
      setIncidents(res.data.incidents || []);
    } catch (error) {
      console.error('Failed to fetch incidents', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Incident History</h1>
          <p className="text-slate-400 mt-1">Review past security incidents and resolutions</p>
        </div>
        
        <div className="flex gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search incidents..." 
              className="pl-9 pr-4 py-2 bg-[#111827] border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 w-64"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#111827] border border-slate-700 rounded-lg text-sm text-slate-300 hover:bg-slate-800 transition-colors">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
        </div>
      </div>

      <div className="bg-[#111827] border border-slate-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading incidents...</div>
        ) : incidents.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No incident history available.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-400 bg-slate-900/50">
                <th className="p-4 font-medium">Incident Title</th>
                <th className="p-4 font-medium">Severity</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Created</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {incidents.map((incident) => (
                <tr key={incident.id} className="hover:bg-slate-800/20 transition-colors">
                  <td className="p-4">
                    <div className="text-sm font-medium text-slate-200">{incident.title}</div>
                    <div className="text-xs text-slate-500 mt-1 truncate max-w-md">{incident.description}</div>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                      incident.severity === 'critical' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                      incident.severity === 'high' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' :
                      incident.severity === 'medium' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                      'bg-green-500/10 text-green-500 border border-green-500/20'
                    }`}>
                      {incident.severity.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5">
                      {incident.status === 'open' ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" />
                      ) : (
                        <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                      )}
                      <span className="text-sm text-slate-300 capitalize">{incident.status}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDistanceToNow(new Date(incident.created_at), { addSuffix: true })}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <button className="text-sm text-blue-500 hover:text-blue-400 transition-colors">
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
