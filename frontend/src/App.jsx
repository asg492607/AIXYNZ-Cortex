import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Shield, LayoutDashboard, AlertCircle, Settings2 } from 'lucide-react';

import Dashboard from './pages/Dashboard';
import Findings from './pages/Findings';
import Integrations from './pages/Integrations';

function Sidebar() {
  const location = useLocation();

  const isActive = (path) =>
    location.pathname === path
      ? 'bg-gray-800 text-white shadow-md border border-gray-700'
      : 'text-gray-400 hover:bg-gray-800 hover:text-white border border-transparent';

  return (
    <div className="w-64 bg-gray-950 border-r border-gray-800 flex flex-col shrink-0">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-blue-500" />
          <span className="text-xl font-bold tracking-wider text-white">AIXYNZ CORTEX</span>
        </div>
      </div>

      <nav className="flex-1 px-4 mt-4 space-y-2">
        <Link to="/" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${isActive('/')}`}>
          <LayoutDashboard className="w-5 h-5" />
          Dashboard
        </Link>

        <Link to="/findings" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${isActive('/findings')}`}>
          <AlertCircle className="w-5 h-5" />
          Risk Queue
        </Link>

        <Link to="/integrations" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${isActive('/integrations')}`}>
          <Settings2 className="w-5 h-5" />
          Integrations
        </Link>
      </nav>
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
