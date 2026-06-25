import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Github,
  Cloud,
  Trello,
  CheckCircle2,
  Activity,
  RefreshCcw,
  Loader2,
  Wifi,
  WifiOff,
} from 'lucide-react';

import { API_BASE, ORG_ID } from '../lib/config';

const INTEGRATIONS = [
  {
    key: 'github',
    name: 'GitHub',
    Icon: Github,
    desc: 'Scans repo posture, branch protection, and coverage gaps.',
    envVar: 'GITHUB_TOKEN',
    liveHint: 'Set GITHUB_TOKEN in backend .env to enable live scanning.',
  },
  {
    key: 'aws',
    name: 'AWS',
    Icon: Cloud,
    desc: 'Scans S3 buckets, Security Groups, and IAM roles across all enabled regions.',
    envVar: 'AWS credentials',
    liveHint: 'Configure AWS credentials / IAM role to enable live scanning.',
  },
  {
    key: 'jira',
    name: 'Jira',
    Icon: Trello,
    desc: 'Creates remediation tickets and links findings to Jira issues.',
    envVar: 'JIRA_URL + JIRA_TOKEN',
    liveHint: 'Set JIRA_URL, JIRA_TOKEN, and JIRA_PROJECT in backend .env.',
  },
];

export default function Integrations() {
  const [mode, setMode] = useState(null);
  const [loadingMode, setLoadingMode] = useState(true);
  const [rescanning, setRescanning] = useState(false);
  const [rescanResult, setRescanResult] = useState(null);

  useEffect(() => {
    axios
      .get(`${API_BASE}/dashboard/summary`, { params: { org_id: ORG_ID } })
      .then((res) => setMode(res.data?.mode ?? 'demo'))
      .catch(() => setMode('demo'))
      .finally(() => setLoadingMode(false));
  }, []);

  const handleRescan = async () => {
    try {
      setRescanning(true);
      setRescanResult(null);
      const res = await axios.post(`${API_BASE}/scan/rescan`, { org_id: ORG_ID });
      setRescanResult({
        ok: true,
        msg: `Scan complete — ${res.data.findings_count ?? '?'} findings found.`,
      });
    } catch (err) {
      console.error(err);
      setRescanResult({ ok: false, msg: 'Rescan failed. Check backend connectivity.' });
    } finally {
      setRescanning(false);
    }
  };

  const isLive = mode === 'live';

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Integrations</h1>
          <p className="text-gray-400 mt-1">
            Connect your tools to build the unified Cortex security graph.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {!loadingMode && (
            <div
              className={`px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 ${
                isLive
                  ? 'bg-green-500/20 text-green-400 border border-green-500/40'
                  : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
              }`}
            >
              <Activity className="w-4 h-4" />
              {isLive ? 'LIVE MODE' : 'DEMO MODE'}
            </div>
          )}

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
                Rescan Environment
              </>
            )}
          </button>
        </div>
      </div>

      {rescanResult && (
        <div
          className={`px-4 py-3 rounded-lg text-sm border ${
            rescanResult.ok
              ? 'bg-green-500/10 border-green-500/30 text-green-300'
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}
        >
          {rescanResult.msg}
        </div>
      )}

      {/* Integration cards */}
      <div className="space-y-4">
        {INTEGRATIONS.map(({ key, name, Icon, desc, liveHint }) => {
          // In MVP: derive status from runtime mode.
          // All connectors are "connected" in live mode; demo = DEMO badge.
          const statusLive = isLive;

          return (
            <div
              key={key}
              className="bg-gray-800 rounded-xl border border-gray-700 p-6 flex flex-col sm:flex-row justify-between gap-6"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gray-900 rounded-xl text-blue-400 border border-gray-700 shrink-0">
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{name}</h3>
                  <p className="text-sm text-gray-400 mt-1">{desc}</p>
                  {!statusLive && (
                    <p className="text-xs text-yellow-500/80 mt-2">{liveHint}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {statusLive ? (
                  <span className="flex items-center gap-2 text-green-400 font-semibold bg-green-900/20 border border-green-700/40 px-3 py-1.5 rounded-lg text-sm">
                    <Wifi className="w-4 h-4" />
                    LIVE
                  </span>
                ) : (
                  <span className="flex items-center gap-2 text-yellow-400 font-semibold bg-yellow-900/20 border border-yellow-700/40 px-3 py-1.5 rounded-lg text-sm">
                    <WifiOff className="w-4 h-4" />
                    DEMO
                  </span>
                )}

                <button className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-semibold text-sm transition">
                  Configure
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      <p className="text-xs text-gray-600 text-center">
        Cortex MVP-1 · Connector OAuth coming in a future release · Demo mode uses realistic synthetic data
      </p>
    </div>
  );
}
