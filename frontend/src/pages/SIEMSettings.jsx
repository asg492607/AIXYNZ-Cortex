import React, { useEffect, useState } from 'react';
import { Send, CheckCircle2, AlertCircle, RefreshCw, Save } from 'lucide-react';
import api from '../lib/api';

export default function SIEMSettings() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState(null);

  useEffect(() => {
    api.get('/siem/config')
      .then(res => setConfig(res.data.data))
      .catch(err => console.error("Failed to load SIEM config", err))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = () => {
    setSaving(true);
    setSaveResult(null);
    // Mock save delay
    setTimeout(() => {
      setSaving(false);
      setSaveResult({ ok: true, msg: "Configuration saved successfully (Demo Mode)." });
      setTimeout(() => setSaveResult(null), 3000);
    }, 1000);
  };

  if (loading) return <div className="p-8 text-gray-400 flex items-center gap-2"><RefreshCw className="w-5 h-5 animate-spin" /> Loading SIEM Settings...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Send className="w-8 h-8 text-blue-500" />
          SIEM & Export Settings
        </h1>
        <p className="text-gray-400 mt-2">
          Configure external destinations for Cortex security findings. Support for Splunk, Datadog, and Jira.
        </p>
      </div>

      {saveResult && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${saveResult.ok ? 'bg-green-500/10 border border-green-500/30 text-green-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>
          {saveResult.ok ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {saveResult.msg}
        </div>
      )}

      <div className="space-y-6">
        {/* Splunk */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Splunk HEC</h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Auto-sync</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked={config?.splunk?.auto_sync} />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">HEC Endpoint URL</label>
              <input type="text" defaultValue={config?.splunk?.endpoint} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500" placeholder="https://splunk.example.com:8088/services/collector" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">HEC Token</label>
              <input type="password" defaultValue={config?.splunk?.configured ? "********" : ""} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500" placeholder="Enter Splunk HEC Token" />
            </div>
          </div>
        </div>

        {/* Datadog */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Datadog</h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Auto-sync</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked={config?.datadog?.auto_sync} />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Datadog API Key</label>
              <input type="password" defaultValue={config?.datadog?.configured ? "********" : ""} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500" placeholder="Enter API Key" />
            </div>
          </div>
        </div>

        {/* Jira */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Jira Cloud</h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Auto-sync</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked={config?.jira?.auto_sync} />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Jira Host URL</label>
              <input type="text" defaultValue="https://cortex.atlassian.net" className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Project Key</label>
              <input type="text" defaultValue={config?.jira?.project_key} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">API Token</label>
              <input type="password" defaultValue={config?.jira?.configured ? "********" : ""} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500" />
            </div>
          </div>
        </div>

      </div>

      <div className="flex justify-end pt-4">
        <button 
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-bold transition disabled:opacity-50"
        >
          {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>

    </div>
  );
}
