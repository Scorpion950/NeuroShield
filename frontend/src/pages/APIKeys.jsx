import React, { useState, useEffect } from 'react';
import { apiKeysApi, applicationsApi } from '../api/client';
import { Key, Plus, Trash2, Copy, CheckCircle, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

export default function APIKeys() {
  const [keys, setKeys] = useState([]);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [keysRes, appsRes] = await Promise.all([
        apiKeysApi.getAll(),
        applicationsApi.getAll()
      ]);
      setKeys(keysRes.data.keys || []);
      setApps(appsRes.data.applications || []);
    } catch (error) {
      console.error('Failed to fetch data', error);
      toast.error('Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('API key copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">API Keys</h1>
          <p className="text-slate-400 mt-1">Manage API keys for your integrated applications</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium">
          <Plus className="w-4 h-4" />
          <span>Generate New Key</span>
        </button>
      </div>

      <div className="bg-[#111827] border border-slate-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading API keys...</div>
        ) : keys.length === 0 ? (
          <div className="p-8 flex flex-col items-center justify-center text-slate-400 space-y-3">
            <Key className="w-12 h-12 text-slate-600 mb-2" />
            <p>No API keys generated yet.</p>
            <button className="text-blue-500 hover:text-blue-400">Generate your first key</button>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/50">
            {keys.map((key) => {
              const app = apps.find(a => a.id === key.application_id);
              return (
                <div key={key.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-800/20 transition-colors">
                  <div className="flex-1 space-y-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-medium text-slate-200">{key.name}</h3>
                        {key.is_active ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20">Active</span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20">Revoked</span>
                        )}
                      </div>
                      <p className="text-sm text-slate-400">
                        Linked to Application: <span className="text-slate-300 font-medium">{app ? app.name : 'Unknown App'}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="bg-[#1E293B] border border-slate-700 rounded-md px-4 py-2 font-mono text-sm text-slate-300 w-full max-w-md flex items-center justify-between">
                        <span>{key.key_value.substring(0, 15)}...{key.key_value.substring(key.key_value.length - 5)}</span>
                        <button 
                          onClick={() => copyToClipboard(key.key_value, key.id)}
                          className="text-slate-400 hover:text-white transition-colors p-1"
                        >
                          {copiedId === key.id ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-row md:flex-col items-center justify-between md:items-end gap-4 text-sm">
                    <div className="text-slate-500">
                      Created {formatDistanceToNow(new Date(key.created_at), { addSuffix: true })}
                    </div>
                    <button className="flex items-center gap-1.5 text-red-500 hover:text-red-400 transition-colors px-3 py-1.5 rounded-md hover:bg-red-500/10">
                      <Trash2 className="w-4 h-4" />
                      <span>Revoke Key</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
