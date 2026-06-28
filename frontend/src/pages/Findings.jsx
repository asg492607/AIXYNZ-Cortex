import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Loader2,
  CheckCircle,
  ChevronRight,
  Play,
  Activity,
  RefreshCcw,
  ExternalLink,
  LinkIcon,
  MessageSquare,
  User,
  Clock,
  Send,
  Share2
} from 'lucide-react';

import api from '../lib/api';

const SEVERITY_BADGE = {
  Critical: 'bg-red-900/60 text-red-200 border border-red-700/50',
  High: 'bg-orange-900/60 text-orange-200 border border-orange-700/50',
  Medium: 'bg-yellow-900/60 text-yellow-200 border border-yellow-700/50',
  Low: 'bg-gray-700 text-gray-300 border border-gray-600',
};

const getRiskColor = (score) => {
  if (score >= 90) return 'text-red-400 bg-red-900/20 border-red-700/50';
  if (score >= 70) return 'text-orange-400 bg-orange-900/20 border-orange-700/50';
  if (score >= 40) return 'text-yellow-400 bg-yellow-900/20 border-yellow-700/50';
  return 'text-green-400 bg-green-900/20 border-green-700/50';
};

export default function Findings() {
  const [data, setData] = useState({ mode: 'demo', findings: [], findings_count: 0 });
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState(null);

  const [selected, setSelected] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [analysisError, setAnalysisError] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  const [remediating, setRemediating] = useState(false);
  const [ticket, setTicket] = useState(null);

  const [rescanning, setRescanning] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportResult, setExportResult] = useState(null);

  const [sharing, setSharing] = useState(false);
  const [shareResult, setShareResult] = useState(null);

  // ── Data loaders ──────────────────────────────────────────────────────────

  const loadFindings = async () => {
    try {
      setListError(null);
      const res = await api.get(`/findings`);
      setData(res.data);
    } catch (err) {
      console.error(err);
      setListError('Failed to load findings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFindings();
  }, []);

  // ── Actions ───────────────────────────────────────────────────────────────

  const handleRescan = async () => {
    try {
      setRescanning(true);
      await api.post(`/scan/rescan`, {});
      await loadFindings();

      // preserve selection if finding still exists
      if (selected?.id) {
        setSelected((prev) => {
          const refreshed = (data.findings || []).find((f) => f.id === prev?.id);
          return refreshed ?? null;
        });
      }
    } catch (err) {
      console.error(err);
      setListError('Rescan failed.');
    } finally {
      setRescanning(false);
    }
  };

  const handleSelect = async (finding) => {
    const selectedId = finding.id;
    setSelected(finding);
    setAnalysis(null);
    setAnalysisError(null);
    setTicket(null);
    setAnalyzing(true);

    try {
      const res = await api.post(`/findings/analyze`, {
        finding_id: selectedId,
      });

      // stale-response guard
      setSelected((prev) => {
        if (prev?.id !== selectedId) return prev;
        setAnalysis(res.data.analysis);
        return prev;
      });
      
      const commentsRes = await api.get(`/findings/${selectedId}/comments`);
      setComments(commentsRes.data.data || []);
      
    } catch (err) {
      console.error(err);
      setAnalysisError('AI analysis failed. Check backend connectivity.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleUpdateStatus = async (status) => {
    try {
      await api.patch(`/findings/${selected.id}/status`, { status });
      setSelected(prev => ({ ...prev, status }));
      loadFindings(); // refresh list to reflect status
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssign = async (owner) => {
    try {
      await api.patch(`/findings/${selected.id}/assign`, { owner });
      setSelected(prev => ({ ...prev, owner }));
      loadFindings();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const res = await api.post(`/findings/${selected.id}/comments`, { content: newComment });
      setComments(prev => [...prev, res.data.data]);
      setNewComment('');
      setSelected(prev => ({ ...prev, comments_count: (prev.comments_count || 0) + 1 }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemediate = async () => {
    if (!selected?.id) return;
    setRemediating(true);
    try {
      const res = await api.post(`/findings/remediate`, {
        finding_id: selected.id,
      });

      setTicket({
        status: res.data.status,
        ticket_id: res.data.ticket_id,
        ticket_url: res.data.ticket_url,
      });

      if (res.data.analysis) {
        setAnalysis(res.data.analysis);
      }
    } catch (err) {
      console.error(err);
      setAnalysisError('Failed to create remediation ticket.');
    } finally {
      setRemediating(false);
    }
  };

  const handleExportToSIEM = async (provider) => {
    if (!selected?.id) return;
    setExporting(true);
    setExportResult(null);
    try {
      const res = await api.post(`/siem/export`, {
        finding_ids: [selected.id],
        provider: provider
      });
      setExportResult({ ok: true, msg: res.data.message || `Exported to ${provider}` });
      setTimeout(() => setExportResult(null), 4000);
    } catch (err) {
      console.error(err);
      setExportResult({ ok: false, msg: `Export to ${provider} failed.` });
      setTimeout(() => setExportResult(null), 4000);
    } finally {
      setExporting(false);
    }
  };

  const handleShare = async (platform) => {
    if (!selected?.id) return;
    setSharing(true);
    setShareResult(null);
    try {
      const res = await api.post(`/collaboration/share`, {
        finding_id: selected.id,
        platform: platform
      });
      setShareResult({ ok: true, msg: res.data.message || `Shared to ${platform}` });
      setTimeout(() => setShareResult(null), 4000);
    } catch (err) {
      console.error(err);
      setShareResult({ ok: false, msg: `Failed to share to ${platform}.` });
      setTimeout(() => setShareResult(null), 4000);
    } finally {
      setSharing(false);
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────

  const isDemo = data.mode === 'demo';
  const alreadyLinked = selected?.jira_issue_key;
  // ticket was just created this session OR finding already has a linked key
  const ticketResolved = ticket || alreadyLinked;
  const ticketId = ticket?.ticket_id || alreadyLinked;
  const ticketUrl = ticket?.ticket_url;
  const isAlreadyExists = ticket?.status === 'already_exists';

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Top bar */}
      <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-950 gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-white">Risk Queue</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {data.findings_count ?? data.findings?.length ?? 0} findings — Review, analyse, and remediate.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div
            className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
              isDemo ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40' : 'bg-green-500/20 text-green-400 border border-green-500/40'
            }`}
          >
            <Activity className="w-3 h-3" />
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

      {listError && (
        <div className="mx-6 mt-4 bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg text-sm">
          {listError}
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* ── Findings list ─────────────────────────────────────────────── */}
        <div className={`${selected ? 'hidden md:flex md:w-1/2' : 'w-full'} flex-col p-6 overflow-y-auto border-r border-gray-800`}>
          <div className="space-y-3">
            {data.findings.length === 0 ? (
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 text-gray-400">
                No findings yet. Run a rescan to populate Cortex.
              </div>
            ) : (
              data.findings.map((f) => {
                const assetLabel =
                  f.asset?.asset_name ||
                  f.asset?.external_asset_id ||
                  'unknown asset';

                return (
                  <div
                    key={f.id}
                    onClick={() => handleSelect(f)}
                    className={`p-4 rounded-lg border cursor-pointer transition ${
                      selected?.id === f.id
                        ? 'bg-blue-900/20 border-blue-500'
                        : 'bg-gray-800 border-gray-700 hover:border-gray-500'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${SEVERITY_BADGE[f.severity] || SEVERITY_BADGE.Low}`}>
                            {f.severity}
                          </span>
                          {f.risk_score !== undefined && (
                            <span className={`text-xs font-bold px-2 py-0.5 rounded border ${getRiskColor(f.risk_score)}`}>
                              Score: {f.risk_score}
                            </span>
                          )}
                          {f.jira_issue_key && (
                            <span className="text-xs font-mono bg-blue-900/30 text-blue-300 border border-blue-700/40 px-2 py-0.5 rounded flex items-center gap-1">
                              <LinkIcon className="w-3 h-3" />
                              {f.jira_issue_key}
                            </span>
                          )}
                        </div>
                        <h3 className="font-semibold text-white">{f.title}</h3>
                        <p className="text-sm text-gray-400 mt-0.5">
                          {f.source} • {assetLabel}
                        </p>
                      </div>
                      <ChevronRight className="text-gray-500 mt-1 shrink-0" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── Detail pane ───────────────────────────────────────────────── */}
        {selected && (
          <div className="w-full md:w-1/2 p-6 overflow-y-auto bg-gray-900 flex flex-col gap-6">
            <button onClick={() => setSelected(null)} className="md:hidden text-blue-400 text-sm self-start">
              ← Back to list
            </button>

            <div>
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-2xl font-bold text-white">{selected.title}</h2>
                {selected.risk_score !== undefined && (
                   <span className={`text-sm font-bold px-2 py-1 rounded border ${getRiskColor(selected.risk_score)}`}>
                     Risk Score: {selected.risk_score} / 100
                   </span>
                )}
              </div>
              <div className="flex flex-wrap gap-3 text-sm">
                {[
                  ['Asset', selected.asset?.asset_name || selected.asset?.external_asset_id || 'unknown'],
                  ['Source', selected.source],
                  ['Severity', selected.severity],
                  ['Category', selected.category],
                ].map(([label, value]) => (
                  <div key={label} className="bg-gray-800 rounded px-3 py-1.5 border border-gray-700">
                    <span className="text-gray-500 text-xs uppercase tracking-wider">{label}: </span>
                    <span className="text-gray-200 font-mono text-xs">{value}</span>
                  </div>
                ))}
              </div>

              {/* Risk Breakdown if available */}
              {selected.risk_factors && (
                <div className="mt-4 bg-gray-800/40 p-4 rounded-xl border border-gray-700/50">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Risk Engine Breakdown</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-[10px] text-gray-500 uppercase">Base Severity</div>
                      <div className="text-sm text-gray-300 font-mono mt-1">{selected.risk_factors.base_severity}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-500 uppercase">Asset Context</div>
                      <div className="text-sm text-gray-300 font-mono mt-1">{selected.risk_factors.asset_criticality}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-500 uppercase">Exposure</div>
                      <div className="text-sm text-gray-300 font-mono mt-1">{selected.risk_factors.exposure}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* MVP-2 Extended Fields Stubs */}
              <div className="grid grid-cols-2 gap-4 mt-4 bg-gray-800/50 p-4 rounded-xl border border-gray-800">
                <div className="space-y-1">
                  <div className="text-xs text-gray-500 flex items-center gap-1"><User className="w-3 h-3" /> Assignee</div>
                  <input 
                    type="text" 
                    value={selected.owner || ''} 
                    onChange={(e) => handleAssign(e.target.value)}
                    onBlur={(e) => handleAssign(e.target.value)}
                    placeholder="Unassigned"
                    className="bg-transparent border-b border-gray-700 text-sm text-white focus:outline-none focus:border-blue-500 w-full"
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-gray-500 flex items-center gap-1"><Activity className="w-3 h-3" /> Status</div>
                  <select 
                    value={selected.status || 'open'}
                    onChange={(e) => handleUpdateStatus(e.target.value)}
                    className="bg-gray-900 border border-gray-700 rounded text-sm text-white focus:outline-none w-full p-1"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="ignored">Ignored</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-gray-500 flex items-center gap-1"><Clock className="w-3 h-3" /> Resolved At</div>
                  <div className="text-sm text-gray-300">{selected.resolved_at ? new Date(selected.resolved_at).toLocaleString() : 'N/A'}</div>
                </div>
              </div>

              {/* Jira already linked badge */}
              {alreadyLinked && !ticket && (
                <div className="mt-3 inline-flex items-center gap-2 bg-blue-900/20 border border-blue-600/40 text-blue-300 px-3 py-2 rounded-lg text-sm">
                  <LinkIcon className="w-4 h-4" />
                  Already linked to Jira: <span className="font-mono font-bold">{alreadyLinked}</span>
                </div>
              )}
            </div>

            {/* AI Analysis panel */}
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Play className="w-4 h-4 text-blue-400" />
                AI Copilot Analysis
              </h3>

              {analyzing ? (
                <div className="flex items-center gap-3 text-gray-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analysing risk context…
                </div>
              ) : analysisError ? (
                <p className="text-red-400 text-sm">{analysisError}</p>
              ) : analysis ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs text-gray-500 uppercase font-bold tracking-wider">Summary</h4>
                    <p className="text-gray-300 mt-1">{analysis.summary}</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-xs text-gray-500 uppercase font-bold tracking-wider">Severity Reasoning</h4>
                      <p className="text-gray-300 mt-1 text-sm">{analysis.severity_reasoning}</p>
                    </div>
                    <div>
                      <h4 className="text-xs text-gray-500 uppercase font-bold tracking-wider">Business Impact</h4>
                      <p className="text-gray-300 mt-1 text-sm">{analysis.business_impact}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2">Remediation Steps</h4>
                    <ul className="list-disc list-inside text-gray-300 text-sm bg-gray-900 p-4 rounded space-y-1">
                      {Array.isArray(analysis.remediation_steps) ? (
                        analysis.remediation_steps.map((step, idx) => <li key={idx}>{step}</li>)
                      ) : (
                        <li>{String(analysis.remediation_steps ?? '')}</li>
                      )}
                    </ul>
                  </div>

                  {analysis.jira_title && (
                    <div className="bg-blue-900/10 p-3 rounded border border-blue-900/30">
                      <h4 className="text-xs text-blue-400 uppercase font-bold tracking-wider">Proposed Jira Ticket</h4>
                      <p className="text-white font-semibold mt-1">{analysis.jira_title}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">AI analysis will appear here after selection.</p>
              )}
            </div>

            {/* Remediation CTA */}
            <div>
              {ticketResolved ? (
                <div className="space-y-2">
                  <div className="bg-green-900/20 border border-green-600/40 text-green-300 px-4 py-3 rounded-lg flex items-center gap-2 text-sm">
                    <CheckCircle className="w-5 h-5 shrink-0" />
                    {isAlreadyExists
                      ? `Ticket already exists: ${ticketId}`
                      : `Jira ticket created: ${ticketId}`}
                  </div>
                  {ticketUrl && (
                    <a
                      href={ticketUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm underline underline-offset-2 transition"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open in Jira
                    </a>
                  )}
                </div>
              ) : (
                <button
                  onClick={handleRemediate}
                  disabled={analyzing || remediating || !analysis || !selected?.id || !!alreadyLinked}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition font-semibold shadow-lg shadow-blue-500/20 w-full"
                >
                  {remediating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creating Jira ticket…
                    </>
                  ) : alreadyLinked ? (
                    <>
                      <LinkIcon className="w-5 h-5" />
                      Already linked to Jira
                    </>
                  ) : (
                    'Auto-Remediate (Create Jira)'
                  )}
                </button>
              )}
              {exportResult && (
                <div className={`mt-2 px-4 py-2 rounded-lg text-sm border ${exportResult.ok ? 'bg-green-500/10 border-green-500/30 text-green-300' : 'bg-red-500/10 border-red-500/30 text-red-300'}`}>
                  {exportResult.msg}
                </div>
              )}
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => handleExportToSIEM('splunk')}
                  disabled={exporting || !selected?.id}
                  className="flex-1 bg-gray-800 border border-gray-700 hover:bg-gray-700 text-gray-300 py-2 rounded-lg flex items-center justify-center gap-2 transition text-sm font-semibold"
                >
                  <Send className="w-4 h-4" /> Splunk
                </button>
                <button
                  onClick={() => handleExportToSIEM('datadog')}
                  disabled={exporting || !selected?.id}
                  className="flex-1 bg-gray-800 border border-gray-700 hover:bg-gray-700 text-gray-300 py-2 rounded-lg flex items-center justify-center gap-2 transition text-sm font-semibold"
                >
                  <Send className="w-4 h-4" /> Datadog
                </button>
              </div>

              {shareResult && (
                <div className={`mt-2 px-4 py-2 rounded-lg text-sm border ${shareResult.ok ? 'bg-green-500/10 border-green-500/30 text-green-300' : 'bg-red-500/10 border-red-500/30 text-red-300'}`}>
                  {shareResult.msg}
                </div>
              )}
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => handleShare('slack')}
                  disabled={sharing || !selected?.id}
                  className="flex-1 bg-gray-800 border border-gray-700 hover:bg-[#4A154B]/80 hover:border-[#4A154B] hover:text-white text-gray-300 py-2 rounded-lg flex items-center justify-center gap-2 transition text-sm font-semibold"
                >
                  <Share2 className="w-4 h-4" /> Slack
                </button>
                <button
                  onClick={() => handleShare('teams')}
                  disabled={sharing || !selected?.id}
                  className="flex-1 bg-gray-800 border border-gray-700 hover:bg-[#5B5FC7]/80 hover:border-[#5B5FC7] hover:text-white text-gray-300 py-2 rounded-lg flex items-center justify-center gap-2 transition text-sm font-semibold"
                >
                  <Share2 className="w-4 h-4" /> Teams
                </button>
              </div>
            </div>
            {/* Comments Section */}
            <div className="mt-8 border-t border-gray-800 pt-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                <MessageSquare className="w-5 h-5 text-gray-400" />
                Comments & Timeline ({comments.length})
              </h3>
              
              <div className="space-y-4 mb-4">
                {comments.map(c => (
                  <div key={c.id} className="bg-gray-800/50 p-3 rounded-lg border border-gray-800">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-semibold text-blue-400">{c.author_name}</span>
                      <span className="text-xs text-gray-500">{new Date(c.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-gray-300">{c.content}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddComment} className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={!newComment.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition"
                >
                  Post
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
