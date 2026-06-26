import React, { useEffect, useState } from 'react';
import { Key, Plus, Trash2, Copy, AlertTriangle } from 'lucide-react';
import api from '../lib/api';

export default function ApiKeys() {
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [formName, setFormName] = useState('');
  const [newRawKey, setNewRawKey] = useState(null);

  async function loadKeys() {
    try {
      const res = await api.get('/api-keys');
      setApiKeys(res.data.api_keys || []);
    } catch (err) {
      console.error('Failed to load API keys', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadKeys();
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/api-keys', { name: formName });
      setNewRawKey(res.data.api_key.raw_key);
      setFormName('');
      loadKeys();
    } catch (err) {
      console.error('Failed to generate key', err);
      alert('Failed to generate API Key');
    }
  };

  const handleRevoke = async (id) => {
    if (!window.confirm("Revoke this API Key? Any integrations using it will immediately fail.")) return;
    try {
      await api.delete(`/api-keys/${id}`);
      loadKeys();
    } catch (err) {
      console.error('Failed to revoke', err);
    }
  };

  const copyToClipboard = () => {
    if (newRawKey) {
      navigator.clipboard.writeText(newRawKey);
      alert("API Key copied to clipboard!");
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setNewRawKey(null);
  };

  if (loading) return <div className="p-8 text-gray-400">Loading API Keys...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Key className="w-8 h-8 text-emerald-500" />
            API Keys
          </h1>
          <p className="text-gray-400 mt-1">Manage API keys to programmatically access your Cortex platform data.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition font-medium"
        >
          <Plus className="w-5 h-5" />
          Generate New Key
        </button>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        {apiKeys.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No active API keys. Generate one to get started.</div>
        ) : (
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-gray-900/50 text-gray-400 text-xs uppercase font-bold tracking-wider border-b border-gray-700">
              <tr>
                <th className="px-6 py-4">Key Name</th>
                <th className="px-6 py-4">Prefix</th>
                <th className="px-6 py-4">Created At</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {apiKeys.map(k => (
                <tr key={k.id} className="hover:bg-gray-750 transition group">
                  <td className="px-6 py-4 font-medium text-white">
                    {k.name}
                  </td>
                  <td className="px-6 py-4 font-mono text-gray-400">
                    {k.prefix}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {new Date(k.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleRevoke(k.id)}
                      className="px-3 py-1.5 text-xs font-medium text-red-400 hover:text-white hover:bg-red-500 rounded transition border border-red-500/30"
                    >
                      Revoke
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-gray-800 border border-gray-700 rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-indigo-400" />
                {newRawKey ? 'Your New API Key' : 'Generate API Key'}
              </h2>
            </div>
            
            <div className="p-6">
              {newRawKey ? (
                <div className="space-y-4">
                  <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded flex gap-3 text-yellow-200 text-sm">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <p>Please copy this key now. For security reasons, we only store a hash and you will <strong>never</strong> be able to see it again.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      readOnly 
                      value={newRawKey} 
                      className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white font-mono text-sm"
                    />
                    <button onClick={copyToClipboard} className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition">
                      <Copy className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="pt-4 flex justify-end">
                    <button onClick={closeModal} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition font-medium">
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleGenerate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Key Name</label>
                    <input 
                      required
                      type="text" 
                      value={formName}
                      onChange={e => setFormName(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                      placeholder="e.g. CI/CD Integration"
                    />
                  </div>
                  <div className="pt-4 flex justify-end gap-3">
                    <button type="button" onClick={closeModal} className="px-4 py-2 text-gray-400 hover:text-white transition">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition font-medium">Generate</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
