import React, { useEffect, useState } from 'react';
import { ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';
import api from '../lib/api';

export default function Compliance() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCompliance() {
      try {
        const res = await api.get('/reports/compliance/summary');
        setSummary(res.data.data);
      } catch (err) {
        console.error('Failed to load compliance', err);
      } finally {
        setLoading(false);
      }
    }
    loadCompliance();
  }, []);

  if (loading) return <div className="p-8 text-gray-400">Loading compliance data...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-emerald-500" />
          Compliance Scorecards
        </h1>
        <p className="text-gray-400 mt-1">Real-time mapping of your findings against industry standards.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {['cis', 'soc2', 'iso27001'].map(framework => {
          const data = summary[framework] || { total_findings: 0, open_findings: 0 };
          const isFailing = data.open_findings > 0;
          
          return (
            <div key={framework} className="bg-gray-800 border border-gray-700 p-6 rounded-xl relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-1 h-full ${isFailing ? 'bg-red-500' : 'bg-emerald-500'}`} />
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white uppercase tracking-wider">{framework === 'cis' ? 'CIS Foundations' : framework === 'soc2' ? 'SOC 2 Type II' : 'ISO 27001'}</h3>
                {isFailing ? <XCircle className="w-6 h-6 text-red-500" /> : <CheckCircle2 className="w-6 h-6 text-emerald-500" />}
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Controls Assessed</span>
                  <span className="text-white font-mono">{data.total_findings}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Controls Failing</span>
                  <span className={`font-mono font-bold ${isFailing ? 'text-red-400' : 'text-emerald-400'}`}>
                    {data.open_findings}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
