import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, ShieldAlert, Tag, User, ChevronRight } from 'lucide-react';
import api from '../lib/api';

export default function AssetInventory() {
  const navigate = useNavigate();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAssets() {
      try {
        const res = await api.get('/assets');
        setAssets(res.data.data || []);
      } catch (err) {
        console.error('Failed to load assets', err);
      } finally {
        setLoading(false);
      }
    }
    loadAssets();
  }, []);

  if (loading) return <div className="p-8 text-gray-400">Loading asset inventory...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Database className="w-8 h-8 text-indigo-500" />
          Asset Inventory
        </h1>
        <p className="text-gray-400 mt-1">Unified view of all tracked cloud and code assets.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400 font-medium">Total Assets</p>
            <p className="text-3xl font-bold text-white mt-2">{assets.length}</p>
          </div>
          <Database className="w-10 h-10 text-indigo-500/50" />
        </div>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-gray-900/80 text-gray-400 text-xs uppercase font-bold tracking-wider border-b border-gray-700">
              <tr>
                <th className="px-6 py-4">Asset Name</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Provider</th>
                <th className="px-6 py-4">Risk Score</th>
                <th className="px-6 py-4">Owner</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {assets.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">No assets discovered yet.</td>
                </tr>
              ) : (
                assets.map(asset => (
                  <tr 
                    key={asset.id} 
                    onClick={() => navigate(`/assets/${asset.id}`)}
                    className="hover:bg-gray-700/40 transition cursor-pointer group"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-white font-medium flex items-center gap-3">
                      <div className="p-2 bg-gray-800 rounded group-hover:bg-gray-700 transition">
                        <Database className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div>
                        {asset.name}
                        <div className="text-xs text-gray-500 font-mono mt-1">{asset.external_asset_id}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 bg-gray-900 border border-gray-600 rounded text-xs">
                        {asset.asset_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-400 capitalize">
                      {asset.provider}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${asset.risk_score > 80 ? 'text-red-400' : asset.risk_score > 50 ? 'text-yellow-400' : 'text-green-400'}`}>
                          {asset.risk_score}
                        </span>
                        {asset.risk_score > 80 && <ShieldAlert className="w-4 h-4 text-red-400" />}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-400">
                      <div className="flex items-center gap-2 justify-between">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          {asset.owner || 'Unassigned'}
                        </div>
                        <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition transform group-hover:translate-x-1" />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
