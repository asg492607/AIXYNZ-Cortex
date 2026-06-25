import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Shield, LayoutDashboard, AlertCircle, Settings2 } from 'lucide-react';

import Dashboard from './pages/Dashboard';
import Findings from './pages/Findings';
import Integrations from './pages/Integrations';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', Icon: LayoutDashboard },
  { path: '/findings', label: 'Risk Queue', Icon: AlertCircle },
  { path: '/integrations', label: 'Integrations', Icon: Settings2 },
];

function Sidebar() {
  const location = useLocation();

  const isActive = (path) =>
    location.pathname === path
      ? 'bg-gray-800 text-white shadow-md border border-gray-700'
      : 'text-gray-400 hover:bg-gray-800 hover:text-white border border-transparent';

  return (
    <div className="w-60 bg-gray-950 border-r border-gray-800 flex flex-col shrink-0">
      {/* Logo */}
      <div className="p-5 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <Shield className="w-7 h-7 text-blue-500 shrink-0" />
          <span className="text-base font-bold tracking-widest text-white leading-tight">
            AIXYNZ<br />
            <span className="text-blue-400">CORTEX</span>
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 mt-4 space-y-1">
        {NAV_ITEMS.map(({ path, label, Icon }) => (
          <Link
            key={path}
            to={path}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition text-sm font-medium ${isActive(path)}`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800">
        <p className="text-xs text-gray-600 text-center">Cortex MVP-1</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <div className="flex h-screen bg-gray-900 text-gray-100 overflow-hidden font-sans">
        <Sidebar />
        <div className="flex-1 overflow-auto bg-gray-900/50">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/findings" element={<Findings />} />
            <Route path="/integrations" element={<Integrations />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}
