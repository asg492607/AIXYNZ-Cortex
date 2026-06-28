import React, { useState } from 'react';
import { Play, Code, CheckCircle2, AlertTriangle, Braces, RefreshCw } from 'lucide-react';
import api from '../lib/api';

const DEFAULT_POLICY = `input.get("public_access") == False`;
const DEFAULT_ASSET = `{
  "asset_name": "s3-prod-backups",
  "asset_type": "S3Bucket",
  "public_access": true,
  "encrypted": false
}`;

export default function Policies() {
  const [policyCode, setPolicyCode] = useState(DEFAULT_POLICY);
  const [assetJson, setAssetJson] = useState(DEFAULT_ASSET);
  
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleTest = async () => {
    setTesting(true);
    setResult(null);
    setError(null);
    
    try {
      let parsedAsset;
      try {
        parsedAsset = JSON.parse(assetJson);
      } catch (e) {
        throw new Error("Invalid JSON in Asset Data: " + e.message);
      }

      const res = await api.post('/policies/test', {
        policy_code: policyCode,
        asset_data: parsedAsset
      });
      
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'An error occurred');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-950">
      <div className="p-6 border-b border-gray-800 shrink-0">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Code className="w-7 h-7 text-indigo-500" />
          Custom Policy Engine
        </h1>
        <p className="text-gray-400 mt-1">
          Write custom security rules to evaluate asset configurations. (MVP: Python boolean expressions)
        </p>
      </div>
      
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* Left Pane: Policy Code */}
        <div className="flex-1 flex flex-col border-r border-gray-800 bg-gray-900">
          <div className="p-3 border-b border-gray-800 bg-gray-950 flex items-center gap-2">
            <Code className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Policy Logic</span>
          </div>
          <textarea 
            value={policyCode}
            onChange={e => setPolicyCode(e.target.value)}
            className="flex-1 bg-transparent text-gray-200 p-4 font-mono text-sm focus:outline-none resize-none"
            spellCheck="false"
            placeholder="input.get('key') == 'value'"
          />
        </div>

        {/* Middle Pane: Asset JSON */}
        <div className="flex-1 flex flex-col border-r border-gray-800 bg-gray-900">
          <div className="p-3 border-b border-gray-800 bg-gray-950 flex items-center gap-2">
            <Braces className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Mock Asset JSON</span>
          </div>
          <textarea 
            value={assetJson}
            onChange={e => setAssetJson(e.target.value)}
            className="flex-1 bg-transparent text-gray-300 p-4 font-mono text-sm focus:outline-none resize-none"
            spellCheck="false"
          />
        </div>

        {/* Right Pane: Results */}
        <div className="w-full md:w-1/3 flex flex-col bg-gray-950">
          <div className="p-4 border-b border-gray-800">
            <button
              onClick={handleTest}
              disabled={testing || !policyCode.trim() || !assetJson.trim()}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold flex justify-center items-center gap-2 transition disabled:opacity-50"
            >
              {testing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
              Evaluate Policy
            </button>
          </div>
          
          <div className="p-6 flex-1 overflow-y-auto">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Evaluation Result</h3>
            
            {error && (
              <div className="bg-red-900/20 border border-red-700/50 p-4 rounded-lg">
                <div className="flex items-start gap-3 text-red-400">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Evaluation Error</p>
                    <p className="text-sm mt-1 text-red-300">{error}</p>
                  </div>
                </div>
              </div>
            )}
            
            {result && !error && (
              <div className={`p-4 rounded-lg border ${result.allow ? 'bg-green-900/20 border-green-700/50' : 'bg-orange-900/20 border-orange-700/50'}`}>
                <div className={`flex items-start gap-3 ${result.allow ? 'text-green-400' : 'text-orange-400'}`}>
                  {result.allow ? <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" /> : <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />}
                  <div>
                    <p className="font-bold">{result.allow ? 'Policy Passed (Allowed)' : 'Policy Violated (Denied)'}</p>
                    {!result.allow && result.violation && (
                      <p className={`text-sm mt-1 ${result.allow ? 'text-green-300' : 'text-orange-300'}`}>{result.violation}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {!result && !error && !testing && (
              <p className="text-gray-500 text-sm text-center mt-10">
                Click Evaluate to test your policy against the mock asset data.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
