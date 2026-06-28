import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Database, ShieldAlert, Tag, User, ArrowLeft, GitBranch, AlertCircle, Edit2, Save, X } from 'lucide-react';
import api from '../lib/api';

export default function AssetDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [asset, setAsset] = useState(null);
  const [findings, setFindings] = useState([]);
  const [blastRadius, setBlastRadius] = useState({ reachable: [], risk_impact: 0 });
  const [loading, setLoading] = useState(true);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ owner: '', tags: '' });

  useEffect(() => {
    async function loadData() {
      try {
        const [assetRes, findingsRes, blastRes] = await Promise.allSettled([
          api.get(`/assets/${id}`),
          api.get(`/findings?asset_id=${id}`),
          api.get(`/graph/blast-radius/${id}`)
        ]);
        
        if (assetRes.status === 'rejected') {
          throw new Error('Failed to load asset details');
        }

        const assetData = assetRes.value.data.data;
        setAsset(assetData);
        setFindings(findingsRes.status === 'fulfilled' ? findingsRes.value.data.findings || [] : []);
        setBlastRadius(blastRes.status === 'fulfilled' ? blastRes.value.data || { reachable: [], risk_impact: 0 } : { reachable: [], risk_impact: 0 });
        
        setEditForm({
          owner: assetData.owner || '',
          tags: (assetData.business_tags || []).join(', ')
        });
      } catch (err) {
        console.error('Failed to load asset details', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const handleSave = async () => {
    try {
      const payload = {
        owner: editForm.owner,
        business_tags: editForm.tags.split(',').map(t => t.trim()).filter(Boolean)
      };
      await api.patch(`/assets/${id}`, payload);
      setAsset({ ...asset, owner: payload.owner, business_tags: payload.business_tags });
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update asset', err);
      alert('Failed to update asset');
    }
  };

  if (loading) return <div className="p-8 text-gray-400">Loading asset details...</div>;
  if (!asset) return <div className="p-8 text-red-400">Asset not found.</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/assets')} className="p-2 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white transition">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Database className="w-8 h-8 text-indigo-500" />
            {asset.name}
          </h1>
          <p className="text-gray-400 mt-1 font-mono text-sm">{asset.external_asset_id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Details & Edit */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Asset Intel</h2>
              {!isEditing ? (
                <button onClick={() => setIsEditing(true)} className="p-1.5 bg-gray-700 hover:bg-gray-600 rounded text-gray-300 transition">
                  <Edit2 className="w-4 h-4" />
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button onClick={handleSave} className="p-1.5 bg-indigo-600 hover:bg-indigo-500 rounded text-white transition">
                    <Save className="w-4 h-4" />
                  </button>
                  <button onClick={() => setIsEditing(false)} className="p-1.5 bg-gray-600 hover:bg-gray-500 rounded text-white transition">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <span className="text-gray-500 block mb-1">Provider & Type</span>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-gray-900 border border-gray-600 text-gray-300 rounded capitalize">{asset.provider}</span>
                  <span className="px-2 py-1 bg-gray-900 border border-gray-600 text-gray-300 rounded">{asset.asset_type}</span>
                </div>
              </div>
              
              <div>
                <span className="text-gray-500 block mb-1">Risk Score</span>
                <div className="flex items-center gap-2">
                  <span className={`text-2xl font-bold ${asset.risk_score > 80 ? 'text-red-400' : asset.risk_score > 50 ? 'text-yellow-400' : 'text-green-400'}`}>
                    {asset.risk_score}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-gray-500 block mb-1">Owner</span>
                {isEditing ? (
                  <input 
                    type="text" 
                    value={editForm.owner} 
                    onChange={e => setEditForm({...editForm, owner: e.target.value})}
                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-1.5 text-white outline-none focus:border-indigo-500"
                    placeholder="e.g. security-team"
                  />
                ) : (
                  <div className="flex items-center gap-2 text-white">
                    <User className="w-4 h-4 text-gray-400" />
                    {asset.owner || 'Unassigned'}
                  </div>
                )}
              </div>

              <div>
                <span className="text-gray-500 block mb-1">Business Tags</span>
                {isEditing ? (
                  <input 
                    type="text" 
                    value={editForm.tags} 
                    onChange={e => setEditForm({...editForm, tags: e.target.value})}
                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-1.5 text-white outline-none focus:border-indigo-500"
                    placeholder="tag1, tag2..."
                  />
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    {asset.business_tags && asset.business_tags.length > 0 ? (
                      asset.business_tags.map(tag => (
                        <span key={tag} className="flex items-center gap-1 text-xs px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded border border-indigo-500/30">
                          <Tag className="w-3 h-3" />
                          {tag}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500 italic">No tags</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Blast Radius Box */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
              <GitBranch className="w-5 h-5 text-indigo-400" />
              Blast Radius
            </h2>
            {blastRadius.reachable.length === 0 ? (
              <p className="text-gray-400 text-sm">No reachable downstream assets found.</p>
            ) : (
              <div>
                <p className="text-gray-400 text-sm mb-3">
                  A compromise of this asset could expose <strong className="text-white">{blastRadius.reachable.length}</strong> downstream assets, introducing an additional <strong className="text-red-400">{blastRadius.risk_impact}</strong> cumulative risk.
                </p>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                  {blastRadius.reachable.map(node => (
                    <div key={node.id} className="p-3 bg-gray-900/50 border border-gray-700 rounded flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-white truncate max-w-[180px]">{node.label}</span>
                        <span className="text-xs text-gray-500">{node.type}</span>
                      </div>
                      <span className="text-xs px-2 py-1 bg-red-500/20 text-red-300 rounded border border-red-500/30">
                        Risk {node.risk_score}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Linked Findings */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 h-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-400" />
                Linked Findings
              </h2>
              <span className="px-3 py-1 bg-gray-900 text-gray-300 rounded-full text-sm font-medium border border-gray-700">
                {findings.length} Total
              </span>
            </div>

            {findings.length === 0 ? (
              <div className="text-center p-12 border border-dashed border-gray-700 rounded-xl">
                <p className="text-gray-500">No open findings for this asset.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-300">
                  <thead className="bg-gray-900/50 text-gray-400 text-xs uppercase font-bold tracking-wider border-b border-gray-700">
                    <tr>
                      <th className="px-4 py-3">Finding</th>
                      <th className="px-4 py-3">Severity</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/50">
                    {findings.map(f => (
                      <tr key={f.id} className="hover:bg-gray-700/20 transition cursor-pointer" onClick={() => navigate('/findings')}>
                        <td className="px-4 py-3 font-medium text-white">
                          {f.title}
                          <div className="text-xs text-gray-500 mt-1">{f.finding_type}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs border ${
                            f.severity === 'Critical' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                            f.severity === 'High' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                            f.severity === 'Medium' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                            'bg-blue-500/20 text-blue-400 border-blue-500/30'
                          }`}>
                            {f.severity}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="capitalize text-gray-400">{f.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
