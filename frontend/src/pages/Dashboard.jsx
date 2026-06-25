import React, { useState, useEffect } from 'react';
import { Loader2, AlertTriangle, Activity } from 'lucide-react';
import axios from 'axios';

const API_BASE = 'http://localhost:8000/api/v1';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API_BASE}/dashboard/summary`)
      .then(res => setData(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex h-full items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500"/></div>;

  const isDemo = data?.mode === 'demo';

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Command Center</h1>
        <div className={`px-4 py-1 rounded-full text-sm font-bold flex items-center gap-2 ${isDemo ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/50' : 'bg-green-500/20 text-green-500 border border-green-500/50'}`}>
          <Activity className="w-4 h-4" />
          {isDemo ? 'DEMO MODE' : 'LIVE MODE'}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h2 className="text-lg text-gray-400">Posture Score</h2>
          <p className="text-4xl font-bold text-green-400 mt-2">{data?.posture_score}/100</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h2 className="text-lg text-gray-400">Critical Risks</h2>
          <p className="text-4xl font-bold text-red-500 mt-2">{data?.critical_risks_count}</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h2 className="text-lg text-gray-400">High Risks</h2>
          <p className="text-4xl font-bold text-orange-400 mt-2">{data?.high_risks_count}</p>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-white mb-4">Top Priority Risks</h2>
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          {data?.top_findings.map((f, i) => (
            <div key={i} className="p-4 border-b border-gray-700 last:border-0 flex justify-between items-center hover:bg-gray-750 transition">
              <div className="flex items-center gap-4">
                <AlertTriangle className={f.severity === 'Critical' ? 'text-red-500' : 'text-orange-500'} />
                <div>
                  <h3 className="font-semibold text-white">{f.title}</h3>
                  <p className="text-sm text-gray-400">{f.source} • {f.asset_id}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
