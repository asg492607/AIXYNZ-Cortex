import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Shield, LayoutDashboard, Settings, Loader2, CheckCircle } from 'lucide-react';
import axios from 'axios';

const API_BASE = 'http://localhost:8000/api/v1';

function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [remediating, setRemediating] = useState({});

  useEffect(() => {
    async function fetchData() {
      try {
        const [sumRes, findRes] = await Promise.all([
          axios.get(`${API_BASE}/dashboard/summary`),
          axios.get(`${API_BASE}/findings`)
        ]);
        setSummary(sumRes.data);
        setFindings(findRes.data);
      } catch (error) {
        console.error("Failed to fetch data", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleRemediate = async (finding) => {
    setRemediating(prev => ({ ...prev, [finding.title]: 'loading' }));
    try {
      const res = await axios.post(`${API_BASE}/findings/remediate?title=${encodeURIComponent(finding.title)}&source=${finding.source}`);
      setRemediating(prev => ({ ...prev, [finding.title]: res.data.ticket_id }));
    } catch (error) {
      setRemediating(prev => ({ ...prev, [finding.title]: 'error' }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Command Center</h1>
      
      {/* Top Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-lg">
          <h2 className="text-xl font-semibold text-gray-300">Posture Score</h2>
          <p className="text-5xl font-bold text-green-400 mt-4">{summary?.posture_score}/100</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-lg">
          <h2 className="text-xl font-semibold text-gray-300">Critical Risks</h2>
          <p className="text-5xl font-bold text-red-500 mt-4">{summary?.critical_risks_count}</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-lg">
          <h2 className="text-xl font-semibold text-gray-300">High Risks</h2>
          <p className="text-5xl font-bold text-orange-400 mt-4">{summary?.high_risks_count}</p>
        </div>
      </div>

      {/* Risk Queue */}
      <h2 className="text-2xl font-bold mb-4 border-b border-gray-700 pb-2">Top Risk Queue</h2>
      <div className="space-y-4">
        {findings.map((finding, idx) => (
          <div key={idx} className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow flex justify-between items-center transition-all hover:border-gray-500">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className={`px-2 py-1 rounded text-xs font-bold ${finding.severity === 'Critical' ? 'bg-red-900 text-red-200' : 'bg-orange-900 text-orange-200'}`}>
                  {finding.severity}
                </span>
                <span className="text-sm text-gray-400">{finding.source}</span>
              </div>
              <h3 className="text-lg font-semibold">{finding.title}</h3>
            </div>
            
            <div>
              {remediating[finding.title] === 'loading' ? (
                <button disabled className="bg-gray-700 text-gray-300 px-4 py-2 rounded flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Remediating...
                </button>
              ) : remediating[finding.title] && remediating[finding.title] !== 'error' ? (
                <a href={`https://aixynz.atlassian.net/browse/${remediating[finding.title]}`} target="_blank" rel="noreferrer" className="bg-green-700 hover:bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2 transition">
                  <CheckCircle className="w-4 h-4" /> Jira Ticket {remediating[finding.title]}
                </a>
              ) : (
                <button onClick={() => handleRemediate(finding)} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded transition shadow-lg shadow-blue-500/20">
                  Remediate with AI
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="flex h-screen bg-gray-900 text-gray-100 overflow-hidden font-sans">
        {/* Sidebar */}
        <div className="w-64 bg-gray-950 border-r border-gray-800 flex flex-col shrink-0">
          <div className="p-6 flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-500" />
            <span className="text-xl font-bold tracking-wider">CORTEX</span>
          </div>
          <nav className="flex-1 px-4 mt-6 space-y-2">
            <Link to="/" className="flex items-center gap-3 px-4 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition shadow">
              <LayoutDashboard className="w-5 h-5" />
              Dashboard
            </Link>
            <Link to="/settings" className="flex items-center gap-3 px-4 py-3 text-gray-400 rounded-lg hover:bg-gray-800 hover:text-white transition">
              <Settings className="w-5 h-5" />
              Settings
            </Link>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto bg-gray-900">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/settings" element={<div className="p-8"><h1 className="text-3xl font-bold">Settings</h1></div>} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
