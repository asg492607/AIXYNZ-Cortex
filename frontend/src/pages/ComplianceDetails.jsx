import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShieldCheck, CheckCircle2, XCircle, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../lib/api';

export default function ComplianceDetails() {
  const { framework } = useParams();
  const navigate = useNavigate();
  
  const [controls, setControls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedControl, setExpandedControl] = useState(null);

  const frameworkNames = {
    cis: 'CIS Foundations',
    soc2: 'SOC 2 Type II',
    iso27001: 'ISO 27001'
  };

  useEffect(() => {
    async function loadDetails() {
      try {
        const res = await api.get(`/reports/compliance/${framework}`);
        setControls(res.data.data || []);
      } catch (err) {
        console.error('Failed to load compliance details', err);
      } finally {
        setLoading(false);
      }
    }
    loadDetails();
  }, [framework]);

  if (loading) return <div className="p-8 text-gray-400">Loading compliance details...</div>;

  const failingCount = controls.filter(c => c.status === 'fail').length;
  const passingCount = controls.filter(c => c.status === 'pass').length;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/compliance')} className="p-2 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white transition">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3 uppercase">
            <ShieldCheck className="w-8 h-8 text-indigo-500" />
            {frameworkNames[framework] || framework} Details
          </h1>
          <p className="text-gray-400 mt-1">Detailed control mappings and findings.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400 font-medium">Total Controls</p>
            <p className="text-3xl font-bold text-white mt-2">{controls.length}</p>
          </div>
        </div>
        <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400 font-medium">Failing Controls</p>
            <p className="text-3xl font-bold text-red-400 mt-2">{failingCount}</p>
          </div>
          <XCircle className="w-10 h-10 text-red-500/50" />
        </div>
        <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400 font-medium">Passing Controls</p>
            <p className="text-3xl font-bold text-emerald-400 mt-2">{passingCount}</p>
          </div>
          <CheckCircle2 className="w-10 h-10 text-emerald-500/50" />
        </div>
      </div>

      {/* Controls List */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        {controls.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No controls mapped for this framework.</div>
        ) : (
          <div className="divide-y divide-gray-700/50">
            {controls.map(control => (
              <div key={control.id} className="flex flex-col">
                <div 
                  onClick={() => setExpandedControl(expandedControl === control.id ? null : control.id)}
                  className="flex items-center justify-between p-4 hover:bg-gray-700/40 cursor-pointer transition group"
                >
                  <div className="flex items-center gap-4">
                    {control.status === 'fail' ? (
                      <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    )}
                    <div>
                      <span className="text-white font-medium block uppercase tracking-wide">{control.id}</span>
                      {control.status === 'fail' && (
                        <span className="text-xs text-red-400 mt-1 block">
                          {control.findings.filter(f => ['open', 'in_progress'].includes(f.status)).length} open findings
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-gray-500 group-hover:text-white transition">
                    {expandedControl === control.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </div>

                {/* Expanded Findings view */}
                {expandedControl === control.id && (
                  <div className="bg-gray-900/50 p-4 border-t border-gray-700/50">
                    <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Linked Findings</h4>
                    {control.findings.length === 0 ? (
                      <p className="text-gray-500 text-sm italic">No findings explicitly tied to this control.</p>
                    ) : (
                      <div className="space-y-2">
                        {control.findings.map(f => (
                          <div 
                            key={f.id} 
                            onClick={() => navigate('/findings')}
                            className="bg-gray-800 border border-gray-700 p-3 rounded flex items-center justify-between hover:border-gray-500 cursor-pointer transition"
                          >
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-white">{f.title}</span>
                              <span className="text-xs text-gray-500 mt-1">Asset: {f.asset_name}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`px-2 py-1 rounded text-xs border ${
                                f.severity === 'Critical' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                f.severity === 'High' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                                f.severity === 'Medium' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                                'bg-blue-500/20 text-blue-400 border-blue-500/30'
                              }`}>
                                {f.severity}
                              </span>
                              <span className={`text-xs capitalize ${['open', 'in_progress'].includes(f.status) ? 'text-red-400' : 'text-emerald-400'}`}>
                                {f.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
