import React, { useEffect, useState } from 'react';
import { Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import api from '../lib/api';

export default function ScanHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await api.get('/scans/history');
        setHistory(res.data.data || []);
      } catch (err) {
        console.error('Failed to load scan history', err);
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, []);

  if (loading) return <div className="text-gray-400">Loading scan history...</div>;

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
      <div className="p-4 border-b border-gray-700 flex items-center gap-2">
        <Clock className="w-5 h-5 text-gray-400" />
        <h2 className="text-lg font-bold text-white">Scan History</h2>
      </div>
      <div className="divide-y divide-gray-700 max-h-96 overflow-y-auto">
        {history.length === 0 ? (
          <div className="p-6 text-gray-400 text-sm text-center">No scans run yet.</div>
        ) : (
          history.map(scan => (
            <div key={scan.id} className="p-4 flex items-center justify-between hover:bg-gray-700/30 transition">
              <div className="flex items-center gap-3">
                {scan.status === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                ) : scan.status === 'failed' ? (
                  <XCircle className="w-5 h-5 text-red-400" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-yellow-400" />
                )}
                <div>
                  <p className="text-white text-sm font-medium">Full Environment Scan</p>
                  <p className="text-gray-400 text-xs mt-0.5">{new Date(scan.timestamp).toLocaleString()}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold px-2 py-1 bg-gray-900 rounded text-gray-300 border border-gray-700">
                  {scan.new_or_updated_count} findings sync
                </span>
                {scan.error_message && (
                  <p className="text-red-400 text-xs mt-1 truncate max-w-[200px]" title={scan.error_message}>
                    {scan.error_message}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
