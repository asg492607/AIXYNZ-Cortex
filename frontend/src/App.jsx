import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Shield, LayoutDashboard, AlertCircle, Settings2 } from 'lucide-react';

import Dashboard from './pages/Dashboard';
import Findings from './pages/Findings';
import Integrations from './pages/Integrations';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import AuditLogs from './pages/AuditLogs';
import AssetInventory from './pages/AssetInventory';
import Compliance from './pages/Compliance';
import Reports from './pages/Reports';
import { AuthProvider, useAuth } from './context/AuthContext';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', Icon: LayoutDashboard },
  { path: '/assets', label: 'Asset Inventory', Icon: Database },
  { path: '/findings', label: 'Risk Queue', Icon: AlertCircle },
  { path: '/compliance', label: 'Compliance', Icon: ShieldCheck },
  { path: '/reports', label: 'Reports', Icon: Download },
  { path: '/integrations', label: 'Integrations', Icon: Settings2 },
  { path: '/audit-logs', label: 'Audit Trail', Icon: Settings2 },
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

      {/* Footer / Profile */}
      <div className="p-4 border-t border-gray-800">
        <Link
          to="/profile"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition text-sm font-medium ${isActive('/profile')}`}
        >
          <Settings2 className="w-4 h-4 shrink-0" />
          Profile
        </Link>
        <p className="text-xs text-gray-600 text-center mt-4">Cortex MVP-2</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="flex h-screen items-center justify-center bg-gray-900 text-white">Loading...</div>;
  if (!user) {
    window.location.href = '/login';
    return null;
  }
  
  return children;
}

function MainLayout({ children }) {
  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 overflow-auto bg-gray-900/50">
        {children}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route path="/" element={<ProtectedRoute><MainLayout><Dashboard /></MainLayout></ProtectedRoute>} />
          <Route path="/assets" element={<ProtectedRoute><MainLayout><AssetInventory /></MainLayout></ProtectedRoute>} />
          <Route path="/findings" element={<ProtectedRoute><MainLayout><Findings /></MainLayout></ProtectedRoute>} />
          <Route path="/compliance" element={<ProtectedRoute><MainLayout><Compliance /></MainLayout></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><MainLayout><Reports /></MainLayout></ProtectedRoute>} />
          <Route path="/integrations" element={<ProtectedRoute><MainLayout><Integrations /></MainLayout></ProtectedRoute>} />
          <Route path="/audit-logs" element={<ProtectedRoute><MainLayout><AuditLogs /></MainLayout></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><MainLayout><Profile /></MainLayout></ProtectedRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
