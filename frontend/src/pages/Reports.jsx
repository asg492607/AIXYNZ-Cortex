import React, { useState, useEffect } from 'react';
import { Download, FileText, FileJson, Printer, Shield, Activity, AlertOctagon, TrendingUp, TrendingDown } from 'lucide-react';
import api from '../lib/api';

export default function Reports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await api.get('/reports/executive');
        setData(res.data.data);
      } catch (err) {
        setError('Failed to load executive report.');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, []);

  const downloadReport = async (format) => {
    try {
      const res = await api.get(`/reports/findings/${format}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `findings_report.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Download failed', err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div className="p-8 text-white">Loading report...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-500">{error}</div>;
  }

  const { posture_score, total_findings, severity_breakdown, top_risks, mttr_days, generated_at } = data;
  const isHealthy = posture_score >= 80;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 report-container">
      
      {/* Non-printable header for actions */}
      <div className="flex justify-between items-center no-print border-b border-gray-800 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Download className="w-8 h-8 text-blue-500" />
            Reporting & Export
          </h1>
          <p className="text-gray-400 mt-1">Generate executive summaries or export raw data.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => downloadReport('csv')} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded text-sm font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4" /> CSV
          </button>
          <button onClick={() => downloadReport('json')} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded text-sm font-semibold flex items-center gap-2">
            <FileJson className="w-4 h-4" /> JSON
          </button>
          <button onClick={handlePrint} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-sm font-bold flex items-center gap-2">
            <Printer className="w-4 h-4" /> Print PDF
          </button>
        </div>
      </div>

      {/* The Printable Executive Report */}
      <div className="bg-white text-gray-900 p-10 rounded-xl shadow-2xl print-page">
        {/* Report Header */}
        <div className="flex justify-between items-end border-b-2 border-gray-200 pb-6 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-gray-900 leading-tight">AIXYNZ Cortex</h2>
              <p className="text-lg font-semibold text-indigo-600">Executive Security Summary</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Report Generated</p>
            <p className="font-mono text-gray-800 mt-1">{new Date(generated_at).toLocaleString()}</p>
          </div>
        </div>

        {/* High Level Metrics */}
        <div className="grid grid-cols-3 gap-6 mb-10">
          <div className="bg-gray-50 border border-gray-100 p-6 rounded-xl flex flex-col justify-center items-center text-center">
            <div className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Posture Score</div>
            <div className={`text-5xl font-black ${isHealthy ? 'text-green-600' : 'text-red-600'} flex items-center gap-2`}>
              {posture_score} <span className="text-2xl text-gray-400 font-normal">/ 100</span>
            </div>
            <p className="text-sm mt-2 text-gray-600 font-medium">
              {isHealthy ? 'Healthy Posture' : 'Needs Immediate Attention'}
            </p>
          </div>

          <div className="bg-gray-50 border border-gray-100 p-6 rounded-xl flex flex-col justify-center items-center text-center">
            <div className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Total Open Risks</div>
            <div className="text-5xl font-black text-gray-800">{total_findings}</div>
            <p className="text-sm mt-2 text-gray-600 font-medium">Across all connected clouds</p>
          </div>

          <div className="bg-gray-50 border border-gray-100 p-6 rounded-xl flex flex-col justify-center items-center text-center">
            <div className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">MTTR</div>
            <div className="text-5xl font-black text-indigo-600 flex items-center gap-2">
              {mttr_days} <span className="text-2xl text-gray-400 font-normal">days</span>
            </div>
            <p className="text-sm mt-2 text-gray-600 font-medium">Mean Time to Remediate</p>
          </div>
        </div>

        {/* Breakdown & Top Risks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          
          {/* Severity Breakdown */}
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-4 border-b border-gray-200 pb-2 flex items-center gap-2">
              <Activity className="w-5 h-5 text-gray-400" />
              Risk Distribution
            </h3>
            <div className="space-y-4 mt-6">
              {[
                { label: 'Critical', count: severity_breakdown.Critical, color: 'bg-red-500' },
                { label: 'High', count: severity_breakdown.High, color: 'bg-orange-500' },
                { label: 'Medium', count: severity_breakdown.Medium, color: 'bg-yellow-500' },
                { label: 'Low', count: severity_breakdown.Low, color: 'bg-gray-400' }
              ].map(item => {
                const percentage = total_findings > 0 ? (item.count / total_findings) * 100 : 0;
                return (
                  <div key={item.label}>
                    <div className="flex justify-between text-sm font-bold text-gray-700 mb-1">
                      <span>{item.label}</span>
                      <span>{item.count}</span>
                    </div>
                    <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color}`} style={{ width: \`\${percentage}%\` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top 5 Critical Risks */}
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-4 border-b border-gray-200 pb-2 flex items-center gap-2">
              <AlertOctagon className="w-5 h-5 text-red-500" />
              Action Items (Top 5 Risks)
            </h3>
            {top_risks.length === 0 ? (
              <p className="text-gray-500 italic mt-6">No open risks detected.</p>
            ) : (
              <ul className="space-y-3 mt-6">
                {top_risks.map((risk, idx) => (
                  <li key={idx} className="bg-gray-50 border border-gray-100 p-3 rounded flex justify-between items-start gap-4">
                    <div>
                      <p className="font-bold text-sm text-gray-800">{risk.title}</p>
                      <p className="text-xs text-gray-500 mt-1">Asset: {risk.asset?.asset_name || risk.asset?.external_asset_id}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="text-xs font-bold uppercase tracking-wider text-red-600 bg-red-100 px-2 py-1 rounded">Score: {risk.risk_score}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-gray-200 text-center text-xs text-gray-400 font-medium">
          Confidential. Generated by AIXYNZ Cortex Platform.
        </div>
      </div>
    </div>
  );
}
