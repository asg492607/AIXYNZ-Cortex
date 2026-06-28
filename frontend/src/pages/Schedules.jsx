import React, { useState, useEffect } from 'react';
import { CalendarClock, Plus, CheckCircle2, Trash2, Clock, Globe } from 'lucide-react';
import api from '../lib/api';

export default function Schedules() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [frequency, setFrequency] = useState('Daily');
  const [time, setTime] = useState('02:00');
  const [target, setTarget] = useState('All');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const loadSchedules = async () => {
    try {
      const res = await api.get('/schedules');
      setSchedules(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchedules();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const res = await api.post('/schedules', { frequency, time, target });
      setSchedules(prev => [...prev, res.data.data]);
      setMessage('Schedule created successfully.');
    } catch (err) {
      setMessage('Failed to create schedule.');
      console.error(err);
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <CalendarClock className="w-8 h-8 text-indigo-500" />
          Scan Schedules
        </h1>
        <p className="text-gray-400 mt-1">Configure automated recurring scans for your connected cloud environments.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Create Schedule Form */}
        <div className="md:col-span-1 bg-gray-900 border border-gray-800 rounded-xl p-6 h-fit">
          <h2 className="text-lg font-bold text-white mb-4">New Schedule</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-1">Target Connectors</label>
              <select 
                value={target} 
                onChange={e => setTarget(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="All">All Connected (Full Scan)</option>
                <option value="AWS">AWS Only</option>
                <option value="Azure">Azure Only</option>
                <option value="GCP">GCP Only</option>
                <option value="Kubernetes">Kubernetes Only</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-1">Frequency</label>
              <select 
                value={frequency} 
                onChange={e => setFrequency(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="Hourly">Hourly</option>
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-1">Time (UTC)</label>
              <input 
                type="time" 
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {message && (
              <div className="text-sm text-green-400 bg-green-900/20 p-2 rounded border border-green-800">
                {message}
              </div>
            )}

            <button 
              type="submit" 
              disabled={saving}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              <Plus className="w-5 h-5" />
              Add Schedule
            </button>
          </form>
        </div>

        {/* Active Schedules List */}
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-white mb-4">Active Schedules</h2>
          {loading ? (
            <div className="text-gray-400">Loading schedules...</div>
          ) : schedules.length === 0 ? (
            <div className="bg-gray-800/50 border border-gray-800 p-8 rounded-xl text-center">
              <CalendarClock className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No active scan schedules.</p>
            </div>
          ) : (
            schedules.map(sched => (
              <div key={sched.id} className="bg-gray-800 border border-gray-700 rounded-xl p-5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <h3 className="font-bold text-white">{sched.target} Scan</h3>
                    <span className="text-xs bg-indigo-900/30 text-indigo-400 px-2 py-0.5 rounded uppercase font-bold tracking-wider ml-2">
                      {sched.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-400 mt-2">
                    <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {sched.frequency} at {sched.time} UTC</span>
                    <span className="flex items-center gap-1"><Globe className="w-4 h-4" /> Auto-Run</span>
                  </div>
                </div>
                <button className="p-2 text-gray-500 hover:text-red-400 transition" title="Delete Schedule">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
