import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Loader2, AlertTriangle, Activity, RefreshCcw, ShieldAlert,
  Layers, User, Building, Clock, Server, Plug, TrendingUp
} from 'lucide-react';

import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function Dashboard({ darkMode }) {
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [rescanning, setRescanning] = useState(false);
  const [org, setOrg]           = useState(null);
  const [error, setError]       = useState(null);
  const { user }                = useAuth();

  const card  = darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200';
  const muted = darkMode ? 'text-slate-400' : 'text-slate-500';
  const head  = darkMode ? 'text-white'     : 'text-slate-900';
  const sub   = darkMode ? 'text-slate-500' : 'text-slate-400';
  const rowH  = darkMode ? 'hover:bg-slate-700/40' : 'hover:bg-slate-50';
  const divid = darkMode ? 'divide-slate-700' : 'divide-slate-100';
  const badge = (severity) => {
    if (severity === 'Critical') return darkMode
      ? 'bg-red-900/40 text-red-300 border-red-700/50'
      : 'bg-red-50 text-red-700 border-red-200';
    if (severity === 'High') return darkMode
      ? 'bg-orange-900/40 text-orange-300 border-orange-700/50'
      : 'bg-orange-50 text-orange-700 border-orange-200';
    return darkMode
      ? 'bg-yellow-900/40 text-yellow-300 border-yellow-700/50'
      : 'bg-yellow-50 text-yellow-700 border-yellow-200';
  };
  const sevColor = (s) =>
    s === 'Critical' ? 'text-red-500' : s === 'High' ? 'text-orange-500' : 'text-yellow-500';

  const loadSummary = async () => {
    try {
      setError(null);
      const [summaryRes, orgRes] = await Promise.all([
        api.get('/dashboard/summary'),
        api.get('/organizations/current').catch(() => ({ data: { data: null } })),
      ]);
      setData(summaryRes.data);
      setOrg(orgRes.data.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load dashboard. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSummary(); }, []);

  const handleRescan = async () => {
    try {
      setRescanning(true);
      await api.post('/scan/rescan', {});
      await loadSummary();
    } catch (err) {
      console.error(err);
      setError('Rescan failed. Make sure you have integrations connected.');
    } finally {
      setRescanning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto mb-3" />
          <p className={`text-sm ${muted}`}>Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  const topFindings = data?.top_findings ?? [];
  const hasNoData = !data || (data.findings_count === 0 && topFindings.length === 0);

  const STATS = [
    {
      label: 'Posture Score',
      value: data?.posture_score ?? '--',
      suffix: '/100',
      icon: ShieldAlert,
      color: 'text-indigo-500',
      iconBg: darkMode ? 'bg-indigo-900/30' : 'bg-indigo-50',
    },
    {
      label: 'Critical Risks',
      value: data?.critical_risks_count ?? 0,
      icon: AlertTriangle,
      color: 'text-red-500',
      iconBg: darkMode ? 'bg-red-900/30' : 'bg-red-50',
    },
    {
      label: 'High Risks',
      value: data?.high_risks_count ?? 0,
      icon: AlertTriangle,
      color: 'text-orange-500',
      iconBg: darkMode ? 'bg-orange-900/30' : 'bg-orange-50',
    },
    {
      label: 'Total Findings',
      value: data?.findings_count ?? 0,
      icon: Layers,
      color: 'text-purple-500',
      iconBg: darkMode ? 'bg-purple-900/30' : 'bg-purple-50',
    },
    {
      label: 'Avg MTTR',
      value: data?.mttr_days ?? 0,
      suffix: ' days',
      icon: Clock,
      color: 'text-teal-500',
      iconBg: darkMode ? 'bg-teal-900/30' : 'bg-teal-50',
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start gap-4 flex-wrap">
        <div>
          <h1 className={`text-2xl font-bold ${head}`}>Command Center</h1>
          <p className={`text-sm mt-1 ${muted}`}>Security posture overview for your organization.</p>
          {user && org && (
            <div className="flex gap-2 mt-3 flex-wrap">
              <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${
                darkMode ? 'bg-emerald-900/20 text-emerald-400 border-emerald-800' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                <Building className="w-3.5 h-3.5" />
                {org.name}
                {org.plan && <span className={`ml-1 ${sub}`}>· {org.plan}</span>}
              </span>
              <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${
                darkMode ? 'bg-indigo-900/20 text-indigo-400 border-indigo-800' : 'bg-indigo-50 text-indigo-700 border-indigo-200'
              }`}>
                <User className="w-3.5 h-3.5" />
                {user.name || user.email?.split('@')[0]}
                <span className={`ml-1 ${sub}`}>· {user.role}</span>
              </span>
            </div>
          )}
        </div>

        <button
          onClick={handleRescan}
          disabled={rescanning}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all shadow-sm"
        >
          {rescanning ? (
            <><Loader2 className="w-4 h-4 animate-spin" />Scanning…</>
          ) : (
            <><RefreshCcw className="w-4 h-4" />Run Scan</>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-lg border text-sm ${
          darkMode ? 'bg-red-900/20 border-red-800 text-red-300' : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {STATS.map(({ label, value, suffix, icon: Icon, color, iconBg }) => (
          <div key={label} className={`rounded-xl border p-4 ${card}`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${iconBg}`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className={`text-[11px] font-semibold uppercase tracking-wider mb-1 ${muted}`}>{label}</p>
            <p className={`text-2xl font-bold ${head}`}>
              {value}
              {suffix && <span className={`text-sm font-normal ml-0.5 ${muted}`}>{suffix}</span>}
            </p>
          </div>
        ))}
      </div>

      {/* Empty state — no integrations */}
      {hasNoData ? (
        <div className={`rounded-xl border p-12 text-center ${card}`}>
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
            darkMode ? 'bg-indigo-900/30' : 'bg-indigo-50'
          }`}>
            <Plug className="w-8 h-8 text-indigo-500" />
          </div>
          <h2 className={`text-lg font-bold mb-2 ${head}`}>No data yet</h2>
          <p className={`text-sm mb-6 max-w-sm mx-auto ${muted}`}>
            Connect your first integration — GitHub, AWS, or Jira — to start scanning for security risks.
          </p>
          <Link
            to="/integrations"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all shadow-sm"
          >
            <Plug className="w-4 h-4" />
            Connect Integration
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Findings */}
          <div className="lg:col-span-2">
            <h2 className={`text-base font-bold mb-3 ${head}`}>Top Priority Risks</h2>
            <div className={`rounded-xl border overflow-hidden ${card}`}>
              {topFindings.length === 0 ? (
                <div className={`p-6 text-sm ${muted}`}>
                  No open findings. Run a scan to check your security posture.
                </div>
              ) : (
                <div className={`divide-y ${divid}`}>
                  {topFindings.map((f) => {
                    const assetLabel = f.asset?.asset_name || f.asset?.external_asset_id || 'unknown asset';
                    return (
                      <div key={f.id || f.title} className={`p-4 flex justify-between items-center transition-colors ${rowH}`}>
                        <div className="flex items-center gap-3 min-w-0">
                          <AlertTriangle className={`shrink-0 w-4 h-4 ${sevColor(f.severity)}`} />
                          <div className="min-w-0">
                            <p className={`text-sm font-semibold truncate ${head}`}>{f.title}</p>
                            <p className={`text-xs mt-0.5 truncate ${muted}`}>{f.source} · {assetLabel}</p>
                          </div>
                        </div>
                        <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ml-3 ${badge(f.severity)}`}>
                          {f.severity}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Top Risky Assets */}
          <div>
            <h2 className={`text-base font-bold mb-3 ${head}`}>Top Risky Assets</h2>
            <div className={`rounded-xl border overflow-hidden ${card}`}>
              {!data?.top_assets?.length ? (
                <div className={`p-6 text-sm ${muted}`}>No assets with findings.</div>
              ) : (
                <div className={`divide-y ${divid}`}>
                  {data.top_assets.map((asset) => (
                    <div key={asset.name} className={`p-4 flex items-center justify-between transition-colors ${rowH}`}>
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Server className={`w-4 h-4 shrink-0 ${muted}`} />
                        <p className={`text-sm font-medium truncate ${head}`}>{asset.name}</p>
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {asset.count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
