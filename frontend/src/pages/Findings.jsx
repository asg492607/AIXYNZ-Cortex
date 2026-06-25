import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle, ChevronRight, Play } from 'lucide-react';
import axios from 'axios';

const API_BASE = 'http://localhost:8000/api/v1';

export default function Findings() {
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [remediating, setRemediating] = useState(false);
  const [ticket, setTicket] = useState(null);

  useEffect(() => {
    axios.get(`${API_BASE}/findings`)
      .then(res => setFindings(res.data))
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = async (f) => {
    setSelected(f);
    setAnalysis(null);
    setTicket(null);
    setAnalyzing(true);
    try {
      const res = await axios.post(`${API_BASE}/findings/analyze?title=${encodeURIComponent(f.title)}&source=${f.source}`);
      setAnalysis(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleRemediate = async () => {
    setRemediating(true);
    try {
      const res = await axios.post(`${API_BASE}/findings/remediate?title=${encodeURIComponent(selected.title)}&source=${selected.source}`);
      setTicket(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setRemediating(false);
    }
  };

  if (loading) return <div className="flex h-full items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500"/></div>;

  return (
    <div className="flex h-full">
      {/* Findings List */}
      <div className={`w-full ${selected ? 'md:w-1/2 hidden md:block' : ''} p-8 overflow-y-auto border-r border-gray-800`}>
        <h1 className="text-2xl font-bold text-white mb-6">Risk Queue</h1>
        <div className="space-y-3">
          {findings.map((f, i) => (
            <div key={i} onClick={() => handleSelect(f)} className={`p-4 rounded-lg border cursor-pointer transition ${selected?.id === f.id ? 'bg-blue-900/20 border-blue-500' : 'bg-gray-800 border-gray-700 hover:border-gray-500'}`}>
              <div className="flex justify-between items-start">
                <div>
                  <span className={`text-xs font-bold px-2 py-1 rounded ${f.severity === 'Critical' ? 'bg-red-900 text-red-200' : 'bg-orange-900 text-orange-200'}`}>{f.severity}</span>
                  <h3 className="mt-2 font-semibold text-white">{f.title}</h3>
                  <p className="text-sm text-gray-400 mt-1">{f.source}</p>
                </div>
                <ChevronRight className="text-gray-500" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail Drawer */}
      {selected && (
        <div className="w-full md:w-1/2 p-8 overflow-y-auto bg-gray-900">
          <button onClick={() => setSelected(null)} className="md:hidden text-blue-400 mb-4">← Back</button>
          <h2 className="text-2xl font-bold text-white mb-2">{selected.title}</h2>
          <p className="text-gray-400 mb-6">Source: {selected.source}</p>

          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 mb-6">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><Play className="w-4 h-4 text-blue-400"/> AI Copilot Analysis</h3>
            {analyzing ? (
              <div className="flex items-center gap-3 text-gray-400"><Loader2 className="w-5 h-5 animate-spin" /> Analyzing risk context...</div>
            ) : analysis ? (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm text-gray-500 uppercase">Impact Explanation</h4>
                  <p className="text-gray-300 mt-1 whitespace-pre-wrap">{analysis.explanation}</p>
                </div>
                <div>
                  <h4 className="text-sm text-gray-500 uppercase">Fix Steps</h4>
                  <p className="text-gray-300 mt-1 whitespace-pre-wrap font-mono text-sm bg-gray-900 p-3 rounded">{analysis.remediation_steps}</p>
                </div>
              </div>
            ) : (
              <p className="text-red-400">Analysis failed.</p>
            )}
          </div>

          <div className="flex gap-4">
            {ticket ? (
              <a href={ticket.url} target="_blank" rel="noreferrer" className="bg-green-700 hover:bg-green-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition font-semibold">
                <CheckCircle className="w-5 h-5" /> Jira Ticket {ticket.ticket_id} Created
              </a>
            ) : (
              <button onClick={handleRemediate} disabled={analyzing || remediating} className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition font-semibold shadow-lg shadow-blue-500/20">
                {remediating ? <Loader2 className="w-5 h-5 animate-spin" /> : "Auto-Remediate (Create Jira)"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
