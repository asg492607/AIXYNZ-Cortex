import React, { useEffect, useState } from 'react';
import { Zap, Plus, Trash2, CheckCircle, Activity, Bell } from 'lucide-react';
import api from '../lib/api';

export default function Workflows() {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: '',
    trigger: 'new_finding',
    severity: 'High',
    actionType: 'slack',
  });

  async function loadWorkflows() {
    try {
      const res = await api.get('/workflows');
      setWorkflows(res.data.workflows || []);
    } catch (err) {
      console.error('Failed to load workflows', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWorkflows();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: form.name,
        trigger: form.trigger,
        condition: { severity: form.severity },
        action: { type: form.actionType },
        is_active: true
      };
      await api.post('/workflows', payload);
      setShowModal(false);
      loadWorkflows();
    } catch (err) {
      console.error('Failed to create workflow', err);
      alert('Failed to create workflow');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this workflow?")) return;
    try {
      await api.delete(`/workflows/${id}`);
      loadWorkflows();
    } catch (err) {
      console.error('Failed to delete', err);
    }
  };

  if (loading) return <div className="p-8 text-gray-400">Loading workflows...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Zap className="w-8 h-8 text-yellow-500" />
            Automation Workflows
          </h1>
          <p className="text-gray-400 mt-1">Configure automated actions and alerts for security events.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition font-medium"
        >
          <Plus className="w-5 h-5" />
          Create Workflow
        </button>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        {workflows.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No active workflows. Click Create Workflow to get started.</div>
        ) : (
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-gray-900/50 text-gray-400 text-xs uppercase font-bold tracking-wider border-b border-gray-700">
              <tr>
                <th className="px-6 py-4">Workflow Name</th>
                <th className="px-6 py-4">Trigger & Condition</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {workflows.map(wf => (
                <tr key={wf.id} className="hover:bg-gray-750 transition group">
                  <td className="px-6 py-4 font-medium text-white flex items-center gap-2">
                    {wf.is_active ? <Activity className="w-4 h-4 text-emerald-400" /> : <Activity className="w-4 h-4 text-gray-500" />}
                    {wf.name}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-gray-400 capitalize">When: <strong className="text-gray-300">{wf.trigger.replace('_', ' ')}</strong></span>
                      <span className="text-xs px-2 py-1 bg-gray-900 border border-gray-600 rounded w-max">
                        If Severity == {wf.condition?.severity || 'Any'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-2 px-2 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded w-max capitalize">
                      <Bell className="w-4 h-4" />
                      {wf.action?.type} Notification
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleDelete(wf.id)}
                      className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded transition"
                    >
                      <Trash2 className="w-4 h-4" />
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
                <Plus className="w-5 h-5 text-indigo-400" />
                Create Workflow
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">&times;</button>
            </div>
            
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Workflow Name</label>
                <input 
                  required
                  type="text" 
                  value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. Critical Alerts to Slack"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Trigger Event</label>
                <select 
                  value={form.trigger}
                  onChange={e => setForm({...form, trigger: e.target.value})}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="new_finding">New Finding Detected</option>
                  <option value="finding_resolved">Finding Resolved</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Condition: Severity</label>
                <select 
                  value={form.severity}
                  onChange={e => setForm({...form, severity: e.target.value})}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Action</label>
                <select 
                  value={form.actionType}
                  onChange={e => setForm({...form, actionType: e.target.value})}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="slack">Send Slack Notification</option>
                  <option value="email">Send Email (Coming Soon)</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition font-medium"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
