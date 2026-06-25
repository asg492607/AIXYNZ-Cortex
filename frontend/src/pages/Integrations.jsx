import React from 'react';
import { Github, Cloud, Trello, CheckCircle2, XCircle } from 'lucide-react';

export default function Integrations() {
  const integrations = [
    { name: 'GitHub', icon: <Github />, status: 'connected', desc: 'Scanning repos and Dependabot alerts.' },
    { name: 'AWS', icon: <Cloud />, status: 'disconnected', desc: 'Requires IAM Role setup for Cloud Posture.' },
    { name: 'Jira', icon: <Trello />, status: 'connected', desc: 'Syncing remediation tickets to CORTEX project.' }
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-2">Integrations</h1>
      <p className="text-gray-400 mb-8">Connect your tools to build the unified security graph.</p>

      <div className="space-y-4">
        {integrations.map((i, idx) => (
          <div key={idx} className="bg-gray-800 p-6 rounded-lg border border-gray-700 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gray-900 rounded-lg text-blue-400">
                {i.icon}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{i.name}</h3>
                <p className="text-sm text-gray-400">{i.desc}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {i.status === 'connected' ? (
                <span className="flex items-center gap-2 text-green-400 font-semibold bg-green-900/20 px-3 py-1 rounded">
                  <CheckCircle2 className="w-5 h-5" /> Connected
                </span>
              ) : (
                <span className="flex items-center gap-2 text-gray-400 font-semibold bg-gray-900 px-3 py-1 rounded">
                  <XCircle className="w-5 h-5" /> Disconnected
                </span>
              )}
              <button className={`px-4 py-2 rounded font-semibold transition ${i.status === 'connected' ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20'}`}>
                {i.status === 'connected' ? 'Configure' : 'Connect'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
