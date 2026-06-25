import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Loader2, AlertTriangle, Activity, RefreshCcw } from 'lucide-react';

import { API_BASE, ORG_ID } from '../lib/config';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rescanning, setRescanning] = useState(false);
  const [error, setError] = useState(null);

  const loadSummary = async () => {
    try {
      setError(null);
      const res = await axios.get(`${API_BASE}/dashboard/summary`, {
        params: { org_id: ORG_ID },
      });
      setData(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load dashboard summary.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  const handleRescan = async () => {
    try {
      setRescanning(true);
      await axios.post(`${API_BASE}/findings/rescan`, null, {
        params: { org_id: ORG_ID },
      });
      await loadSummary();
    } catch (err) {
      console.error(err);
      setError('Rescan failed.');
    } finally {
      setRescanning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const isDemo = data?.mode === 'demo';
  const topFindings = data?.top_findings ?? [];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-white">Command Center</h1>
          <p className="text-gray-400 mt-1">Top risks across GitHub, AWS, and remediation workflows.</p>
        </div>

        <div className="flex items-center gap-3">
          <div
            className={`px-4 py-1 rounded-full text-sm font-bold flex items-center gap-2 ${
              isDemo
                ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/50'
                : 'bg-green-500/20 text-green-500 border border-green-500/50'
            }`}
          >
            <Activity className="w-4 h-4" />
            {isDemo ? 'DEMO MODE' : 'LIVE MODE'}
          </div>

          <button
            onClick={handleRescan}
            disabled={rescanning}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold flex items-center gap-2"
          >
            {rescanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
            Rescan
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h2 className="text-lg text-gray-400">Posture Score</h2>
          <p className="text-4xl font-bold text-green-400 mt-2">{data?.posture_score ?? '--'}/100</p>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h2 className="text-lg text-gray-400">Critical Risks</h2>
          <p className="text-4xl font-bold text-red-500 mt-2">{data?.critical_risks_count ?? 0}</p>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h2 className="text-lg text-gray-400">High Risks</h2>
          <p className="text-4xl font-bold text-orange-400 mt-2">{data?.high_risks_count ?? 0}</p>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-white mb-4">Top Priority Risks</h2>
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          {topFindings.length === 0 ? (
            <div className="p-6 text-gray-400">No findings yet. Run a rescan to populate Cortex.</div>
          ) : (
            topFindings.map((f) => (
              <div
                key={f.id}
                className="p-4 border-b border-gray-700 last:border-0 flex justify-between items-center hover:bg-gray-750 transition"
              >
                <div className="flex items-center gap-4">
                  <AlertTriangle
                    className={
                      f.severity === 'Critical'
                        ? 'text-red-500'
                        : f.severity === 'High'
                        ? 'text-orange-500'
                        : 'text-yellow-500'
                    }
                  />
                  <div>
                    <h3 className="font-semibold text-white">{f.title}</h3>
                    <p className="text-sm text-gray-400">
                      {f.source} • {f.asset_id}
                    </p>
                  </div>
                </div>

                <span className="text-xs px-2 py-1 rounded bg-gray-900 text-gray-300 border border-gray-700">
                  {f.severity}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
