import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Shield, Bell, Moon, Database } from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Platform Settings</h1>
        <p className="text-slate-400 mt-1">Manage your NeuroShield configuration and preferences</p>
      </div>

      <div className="bg-[#111827] border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3 text-lg font-medium text-slate-200 mb-6">
            <User className="w-5 h-5 text-blue-500" />
            <h2>Profile Settings</h2>
          </div>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Username</label>
                <input 
                  type="text" 
                  disabled 
                  value={user?.username || ''} 
                  className="w-full px-4 py-2 bg-[#1E293B] border border-slate-700 rounded-lg text-slate-300 opacity-70 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Email</label>
                <input 
                  type="email" 
                  defaultValue={user?.email || ''}
                  className="w-full px-4 py-2 bg-[#1E293B] border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Role</label>
              <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20 capitalize">
                <Shield className="w-3.5 h-3.5 mr-1.5" />
                {user?.role || 'Admin'}
              </div>
            </div>
            
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm">
              Update Profile
            </button>
          </div>
        </div>

        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3 text-lg font-medium text-slate-200 mb-6">
            <Bell className="w-5 h-5 text-orange-500" />
            <h2>Notification Preferences</h2>
          </div>
          
          <div className="space-y-4">
            <label className="flex items-center justify-between p-4 bg-[#1E293B] border border-slate-700 rounded-lg cursor-pointer hover:border-slate-600 transition-colors">
              <div>
                <h3 className="font-medium text-slate-200">Critical Alerts Email</h3>
                <p className="text-sm text-slate-400">Receive immediate emails for critical severity threats</p>
              </div>
              <div className="relative inline-block w-12 h-6 rounded-full bg-blue-600">
                <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full transition-transform"></span>
              </div>
            </label>
            
            <label className="flex items-center justify-between p-4 bg-[#1E293B] border border-slate-700 rounded-lg cursor-pointer hover:border-slate-600 transition-colors">
              <div>
                <h3 className="font-medium text-slate-200">Daily Digest</h3>
                <p className="text-sm text-slate-400">Receive a summary report of daily AI security insights</p>
              </div>
              <div className="relative inline-block w-12 h-6 rounded-full bg-slate-700">
                <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform"></span>
              </div>
            </label>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center gap-3 text-lg font-medium text-slate-200 mb-6">
            <Database className="w-5 h-5 text-green-500" />
            <h2>Data Management</h2>
          </div>
          
          <div className="space-y-4">
            <p className="text-sm text-slate-400 mb-4">Manage how long logs and alerts are retained in the system before automatic archiving.</p>
            
            <div className="flex items-center justify-between p-4 bg-[#1E293B] border border-slate-700 rounded-lg">
              <span className="font-medium text-slate-200">Log Retention Period</span>
              <select className="bg-[#0B0F19] border border-slate-700 text-white rounded px-3 py-1 text-sm focus:outline-none focus:border-blue-500">
                <option>30 Days</option>
                <option>90 Days</option>
                <option>1 Year</option>
                <option>Indefinite</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
