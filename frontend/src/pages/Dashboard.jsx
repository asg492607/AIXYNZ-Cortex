import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Loader2, AlertTriangle, Activity, RefreshCcw, ShieldAlert, Layers } from 'lucide-react';

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
      const res = await axios.post(`${API_BASE}/scan/rescan`, { org_id: ORG_ID });
      // Prefer freshly returned findings payload; fall back to re-fetching summary
      if (res.data?.findings) {
        await loadSummary();
      } else {
        await loadSummary();
      }
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

  const severityColor = (sev) => {
    if (sev === 'Critical') return 'text-red-500';
    if (sev === 'High') return 'text-orange-500';
    return 'text-yellow-500';
  };

  const severityBadge = (sev) => {
    if (sev === 'Critical') return 'bg-red-900/50 text-red-200 border border-red-700/50';
    if (sev === 'High') return 'bg-orange-900/50 text-orange-200 border border-orange-700/50';
    return 'bg-yellow-900/50 text-yellow-200 border border-yellow-700/50';
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-white">Command Center</h1>
          <p className="text-gray-400 mt-1">Top risks across GitHub, AWS, and remediation workflows.</p>
        </div>

        <div className="flex items-center gap-3">
          <div
            className={`px-4 py-1 rounded-full text-sm font-bold flex items-center gap-2 ${
              isDemo
                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
                : 'bg-green-500/20 text-green-400 border border-green-500/40'
            }`}
          >
            <Activity className="w-4 h-4" />
            {isDemo ? 'DEMO MODE' : 'LIVE MODE'}
          </div>

          <button
            onClick={handleRescan}
            disabled={rescanning}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold flex items-center gap-2 transition"
          >
            {rescanning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Rescanning…
              </>
            ) : (
              <>
                <RefreshCcw className="w-4 h-4" />
                Rescan
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Stat cards — 4 columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <ShieldAlert className="w-5 h-5 text-blue-400" />
            <h2 className="text-sm text-gray-400 uppercase tracking-wider font-bold">Posture Score</h2>
          </div>
          <p className="text-4xl font-bold text-green-400">{data?.posture_score ?? '--'}<span className="text-lg text-gray-500">/100</span></p>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <h2 className="text-sm text-gray-400 uppercase tracking-wider font-bold">Critical Risks</h2>
          </div>
          <p className="text-4xl font-bold text-red-400">{data?.critical_risks_count ?? 0}</p>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle className="w-5 h-5 text-orange-400" />
            <h2 className="text-sm text-gray-400 uppercase tracking-wider font-bold">High Risks</h2>
          </div>
          <p className="text-4xl font-bold text-orange-400">{data?.high_risks_count ?? 0}</p>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <Layers className="w-5 h-5 text-purple-400" />
            <h2 className="text-sm text-gray-400 uppercase tracking-wider font-bold">Total Findings</h2>
          </div>
          <p className="text-4xl font-bold text-purple-400">{data?.findings_count ?? 0}</p>
        </div>
      </div>

      {/* Top findings table */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Top Priority Risks</h2>
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          {topFindings.length === 0 ? (
            <div className="p-6 text-gray-400">No findings yet. Run a rescan to populate Cortex.</div>
          ) : (
            topFindings.map((f) => {
              const assetLabel =
                f.asset?.asset_name ||
                f.asset?.external_asset_id ||
                'unknown asset';

              return (
                <div
                  key={f.id}
                  className="p-4 border-b border-gray-700 last:border-0 flex justify-between items-center hover:bg-gray-700/30 transition"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <AlertTriangle className={`shrink-0 w-5 h-5 ${severityColor(f.severity)}`} />
                    <div className="min-w-0">
                      <h3 className="font-semibold text-white truncate">{f.title}</h3>
                      <p className="text-sm text-gray-400 mt-0.5">
                        {f.source} • {assetLabel}
                      </p>
                    </div>
                  </div>

                  <span className={`shrink-0 text-xs px-2 py-1 rounded font-bold ml-4 ${severityBadge(f.severity)}`}>
                    {f.severity}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
