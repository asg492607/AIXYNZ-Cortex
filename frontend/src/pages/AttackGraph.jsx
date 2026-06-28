import React, { useEffect, useRef, useState, useCallback } from 'react';
import { AlertTriangle, Shield, Server, Database, GitBranch, Key, Zap, RefreshCw, Info } from 'lucide-react';
import api from '../lib/api';

// ── Risk colour helpers ─────────────────────────────────────────────────────
const RISK_COLORS = {
  critical: '#ef4444',
  high:     '#f97316',
  medium:   '#eab308',
  low:      '#22c55e',
  unknown:  '#6b7280',
};

const TYPE_ICONS = {
  S3Bucket:      { label: 'S3',    color: '#60a5fa' },
  EC2Instance:   { label: 'EC2',   color: '#34d399' },
  IAMRole:       { label: 'IAM',   color: '#a78bfa' },
  IAMUser:       { label: 'USR',   color: '#c084fc' },
  repository:    { label: 'REPO',  color: '#fb923c' },
  Secret:        { label: 'SEC!',  color: '#ef4444' },
  SecurityGroup: { label: 'SG',    color: '#f472b6' },
  storage_account: { label: 'SA',  color: '#60a5fa' },
  virtual_machine: { label: 'VM',  color: '#34d399' },
  key_vault:     { label: 'KV',    color: '#fcd34d' },
  security_group: { label: 'NSG',  color: '#f472b6' },
  unknown:       { label: '?',     color: '#6b7280' },
};

// ── Force-directed graph (pure canvas, no deps) ──────────────────────────────
function useForceGraph(nodes, edges, width, height) {
  const [positions, setPositions] = useState({});

  useEffect(() => {
    if (!nodes.length) return;

    // Initialize random positions
    const pos = {};
    nodes.forEach((n, i) => {
      const angle = (i / nodes.length) * 2 * Math.PI;
      const r = Math.min(width, height) * 0.3;
      pos[n.id] = {
        x: width / 2 + r * Math.cos(angle) + (Math.random() - 0.5) * 60,
        y: height / 2 + r * Math.sin(angle) + (Math.random() - 0.5) * 60,
        vx: 0, vy: 0,
      };
    });

    // Simple force simulation
    const simulate = () => {
      const k = Math.sqrt((width * height) / nodes.length) * 0.8;
      const ITER = 80;

      for (let iter = 0; iter < ITER; iter++) {
        // Repulsion between all pairs
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const a = pos[nodes[i].id];
            const b = pos[nodes[j].id];
            if (!a || !b) continue;
            const dx = b.x - a.x || 0.01;
            const dy = b.y - a.y || 0.01;
            const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
            const force = (k * k) / dist;
            a.vx -= (dx / dist) * force * 0.01;
            a.vy -= (dy / dist) * force * 0.01;
            b.vx += (dx / dist) * force * 0.01;
            b.vy += (dy / dist) * force * 0.01;
          }
        }
        // Attraction along edges
        edges.forEach(e => {
          const a = pos[e.source];
          const b = pos[e.target];
          if (!a || !b) return;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
          const force = (dist * dist) / k * 0.01;
          a.vx += (dx / dist) * force;
          a.vy += (dy / dist) * force;
          b.vx -= (dx / dist) * force;
          b.vy -= (dy / dist) * force;
        });
        // Apply velocity + damping + bounds
        nodes.forEach(n => {
          const p = pos[n.id];
          if (!p) return;
          p.x = Math.max(60, Math.min(width - 60, p.x + p.vx));
          p.y = Math.max(60, Math.min(height - 60, p.y + p.vy));
          p.vx *= 0.85;
          p.vy *= 0.85;
        });
      }
      setPositions({ ...pos });
    };

    simulate();
  }, [nodes, edges, width, height]);

  return positions;
}

// ── Canvas Renderer ──────────────────────────────────────────────────────────
function GraphCanvas({ nodes, edges, selected, onSelect, width, height }) {
  const canvasRef = useRef(null);
  const positions = useForceGraph(nodes, edges, width, height);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !Object.keys(positions).length) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, width, height);

    // Background grid
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); }
    for (let y = 0; y < height; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }

    // Edges
    edges.forEach(e => {
      const a = positions[e.source];
      const b = positions[e.target];
      if (!a || !b) return;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = e.type === 'ExposedBy' ? 'rgba(239,68,68,0.6)' : 'rgba(100,116,139,0.5)';
      ctx.lineWidth = e.type === 'ExposedBy' ? 2 : 1;
      ctx.setLineDash(e.type === 'CanAccess' ? [4, 4] : []);
      ctx.stroke();
      ctx.setLineDash([]);

      // Arrow
      const angle = Math.atan2(b.y - a.y, b.x - a.x);
      const ax = b.x - 20 * Math.cos(angle);
      const ay = b.y - 20 * Math.sin(angle);
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(ax - 8 * Math.cos(angle - 0.4), ay - 8 * Math.sin(angle - 0.4));
      ctx.lineTo(ax - 8 * Math.cos(angle + 0.4), ay - 8 * Math.sin(angle + 0.4));
      ctx.closePath();
      ctx.fillStyle = e.type === 'ExposedBy' ? 'rgba(239,68,68,0.8)' : 'rgba(100,116,139,0.7)';
      ctx.fill();

      // Edge label (midpoint)
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      ctx.fillStyle = 'rgba(148,163,184,0.8)';
      ctx.font = '9px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(e.label || e.type, mx, my - 4);
    });

    // Nodes
    nodes.forEach(n => {
      const p = positions[n.id];
      if (!p) return;
      const isSelected = selected?.id === n.id;
      const rc = RISK_COLORS[n.risk_level] || RISK_COLORS.unknown;
      const tc = TYPE_ICONS[n.type] || TYPE_ICONS.unknown;
      const radius = isSelected ? 28 : 22;

      // Glow on selected / critical
      if (isSelected || n.risk_level === 'critical') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius + 8, 0, 2 * Math.PI);
        ctx.fillStyle = isSelected ? 'rgba(96,165,250,0.15)' : 'rgba(239,68,68,0.12)';
        ctx.fill();
      }

      // Node circle
      const grad = ctx.createRadialGradient(p.x - 4, p.y - 4, 2, p.x, p.y, radius);
      grad.addColorStop(0, isSelected ? '#1e40af' : '#1e293b');
      grad.addColorStop(1, isSelected ? '#1d4ed8' : '#0f172a');
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = isSelected ? '#60a5fa' : rc;
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.stroke();

      // Type badge
      ctx.fillStyle = tc.color;
      ctx.font = `bold ${n.type === 'repository' ? 7 : 9}px Inter, monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(tc.label, p.x, p.y - 3);

      // Risk score badge
      ctx.fillStyle = rc;
      ctx.font = '8px Inter, sans-serif';
      ctx.fillText(n.risk_score, p.x, p.y + 8);

      // Label below
      ctx.fillStyle = isSelected ? '#e2e8f0' : '#94a3b8';
      ctx.font = `${isSelected ? 'bold ' : ''}10px Inter, sans-serif`;
      ctx.fillText(
        n.label.length > 14 ? n.label.slice(0, 12) + '…' : n.label,
        p.x, p.y + radius + 12
      );
    });
  }, [positions, nodes, edges, selected, width, height]);

  useEffect(() => { draw(); }, [draw]);

  const handleClick = useCallback((e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    for (const n of nodes) {
      const p = positions[n.id];
      if (!p) continue;
      const dx = mx - p.x, dy = my - p.y;
      if (Math.sqrt(dx * dx + dy * dy) < 26) { onSelect(n); return; }
    }
    onSelect(null);
  }, [nodes, positions, onSelect]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onClick={handleClick}
      className="cursor-pointer rounded-xl"
      style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1a2e 100%)' }}
    />
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AttackGraph() {
  const [graphData, setGraphData] = useState({ nodes: [], edges: [], meta: {} });
  const [attackPaths, setAttackPaths] = useState([]);
  const [blastRadius, setBlastRadius] = useState(null);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('graph'); // 'graph' | 'paths'

  const CANVAS_W = 900;
  const CANVAS_H = 540;

  const load = async () => {
    setLoading(true);
    try {
      const [g, p] = await Promise.all([
        api.get('/graph'),
        api.get('/graph/attack-paths'),
      ]);
      setGraphData(g.data);
      setAttackPaths(p.data.attack_paths || []);
    } catch (e) {
      console.error('Graph load error', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSelect = async (node) => {
    setSelected(node);
    if (!node) { setBlastRadius(null); return; }
    try {
      const res = await api.get(`/graph/blast-radius/${node.id}`);
      setBlastRadius(res.data);
    } catch { setBlastRadius(null); }
  };

  const riskColor = (level) => {
    const map = { critical: 'text-red-400', high: 'text-orange-400', medium: 'text-yellow-400', low: 'text-green-400' };
    return map[level] || 'text-gray-400';
  };

  const riskBg = (level) => {
    const map = { critical: 'bg-red-500/10 border-red-500/30', high: 'bg-orange-500/10 border-orange-500/30', medium: 'bg-yellow-500/10 border-yellow-500/30', low: 'bg-green-500/10 border-green-500/30' };
    return map[level] || 'bg-gray-800 border-gray-700';
  };

  return (
    <div className="p-6 min-h-screen" style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1a2e 100%)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
              <Zap className="w-4 h-4 text-red-400" />
            </div>
            Attack Graph
          </h1>
          <p className="text-slate-400 text-sm mt-1">Interactive visualization of asset relationships and attack paths</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Stats */}
          {[
            { label: 'Nodes', val: graphData.meta?.total_nodes || 0, color: 'text-blue-400' },
            { label: 'Edges', val: graphData.meta?.total_edges || 0, color: 'text-purple-400' },
            { label: 'Critical', val: graphData.meta?.critical_nodes || 0, color: 'text-red-400' },
          ].map(s => (
            <div key={s.label} className="bg-slate-800/60 border border-slate-700 rounded-lg px-4 py-2 text-center">
              <div className={`text-xl font-bold ${s.color}`}>{s.val}</div>
              <div className="text-slate-400 text-xs">{s.label}</div>
            </div>
          ))}
          <button onClick={load} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 mb-4">
        {['graph', 'paths'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition ${tab === t ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
            {t === 'graph' ? '🗺 Graph View' : '⚡ Attack Paths'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-slate-400">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Building attack graph…
          </div>
        </div>
      ) : tab === 'graph' ? (
        <div className="flex gap-4">
          {/* Canvas */}
          <div className="flex-1 rounded-xl border border-slate-700/50 overflow-hidden shadow-2xl">
            <GraphCanvas
              nodes={graphData.nodes}
              edges={graphData.edges}
              selected={selected}
              onSelect={handleSelect}
              width={CANVAS_W}
              height={CANVAS_H}
            />
          </div>

          {/* Side Panel */}
          <div className="w-72 flex flex-col gap-3">
            {/* Legend */}
            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
              <h3 className="text-white text-sm font-semibold mb-3 flex items-center gap-2"><Info className="w-4 h-4 text-slate-400" /> Legend</h3>
              <div className="space-y-1.5 text-xs">
                {Object.entries(RISK_COLORS).filter(([k]) => k !== 'unknown').map(([level, color]) => (
                  <div key={level} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full border-2" style={{ borderColor: color }} />
                    <span className="capitalize text-slate-300">{level} risk</span>
                  </div>
                ))}
                <div className="border-t border-slate-700 my-2" />
                <div className="flex items-center gap-2"><div className="w-4 h-0.5 bg-slate-500" style={{ borderTop: '1px dashed #64748b' }} /><span className="text-slate-400">Can Access</span></div>
                <div className="flex items-center gap-2"><div className="w-4 h-0.5 bg-red-500" /><span className="text-slate-400">Exposes Secret</span></div>
              </div>
            </div>

            {/* Selected node details */}
            {selected && (
              <div className={`border rounded-xl p-4 ${riskBg(selected.risk_level)}`}>
                <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4" /> {selected.label}
                </h3>
                <div className="space-y-1.5 text-xs text-slate-300">
                  <div className="flex justify-between"><span className="text-slate-400">Type</span><span className="font-mono">{selected.type}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Provider</span><span>{selected.provider}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Risk Score</span><span className={`font-bold ${riskColor(selected.risk_level)}`}>{selected.risk_score}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Findings</span><span>{selected.finding_count}</span></div>
                  {selected.critical_findings > 0 && (
                    <div className="flex justify-between"><span className="text-red-400">Critical</span><span className="text-red-400 font-bold">{selected.critical_findings}</span></div>
                  )}
                </div>
              </div>
            )}

            {/* Blast radius */}
            {blastRadius && blastRadius.reachable_count > 0 && (
              <div className="bg-red-950/30 border border-red-500/30 rounded-xl p-4">
                <h3 className="text-red-400 font-semibold text-sm mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Blast Radius
                </h3>
                <p className="text-xs text-slate-400 mb-3">If this asset is compromised:</p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-300"><span>Reachable Assets</span><span className="font-bold text-red-400">{blastRadius.reachable_count}</span></div>
                  <div className="flex justify-between text-slate-300"><span>Cumulative Risk</span><span className="font-bold text-orange-400">{blastRadius.risk_impact}</span></div>
                </div>
                <div className="mt-3 space-y-1">
                  {blastRadius.reachable.slice(0, 5).map(n => (
                    <div key={n.id} className={`flex items-center justify-between text-xs px-2 py-1 rounded ${riskBg(n.risk_level)}`}>
                      <span className="text-slate-300 truncate">{n.label}</span>
                      <span className={`font-mono ml-2 shrink-0 ${riskColor(n.risk_level)}`}>{n.risk_score}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Attack Paths tab */
        <div className="space-y-3">
          {attackPaths.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No critical attack paths detected.</p>
            </div>
          ) : attackPaths.map((path, i) => (
            <div key={i} className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-white font-semibold text-sm">Attack Path #{i + 1}</span>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-slate-400">{path.length} hops</span>
                  <span className="text-red-400 font-bold">Risk: {path.total_risk}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {path.path.map((node, j) => (
                  <React.Fragment key={node.id}>
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs ${riskBg(node.risk_level)}`}>
                      <span className="font-mono" style={{ color: TYPE_ICONS[node.type]?.color || '#94a3b8' }}>
                        {TYPE_ICONS[node.type]?.label || '?'}
                      </span>
                      <span className={`${riskColor(node.risk_level)} font-medium`}>{node.label.slice(0, 18)}</span>
                    </div>
                    {j < path.path.length - 1 && <span className="text-slate-600">→</span>}
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
