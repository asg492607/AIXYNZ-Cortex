import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import {
  Shield, LayoutDashboard, AlertCircle, Settings2, Database, ShieldCheck,
  Download, GitBranch, Zap, Moon, Sun, LogOut, User, Users, Key, ClipboardList, Plug, Send, Code, CalendarClock
} from 'lucide-react';

import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Findings from './pages/Findings';
import Integrations from './pages/Integrations';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import AuditLogs from './pages/AuditLogs';
import AssetInventory from './pages/AssetInventory';
import AssetDetails from './pages/AssetDetails';
import ApiKeys from './pages/ApiKeys';
import Compliance from './pages/Compliance';
import ComplianceDetails from './pages/ComplianceDetails';
import Reports from './pages/Reports';
import Workflows from './pages/Workflows';
import AttackGraph from './pages/AttackGraph';
import Team from './pages/Team';
import AcceptInvite from './pages/AcceptInvite';
import SIEMSettings from './pages/SIEMSettings';
import Policies from './pages/Policies';
import Schedules from './pages/Schedules';
import { AuthProvider, useAuth } from './context/AuthContext';

const NAV_ITEMS = [
  { path: '/dashboard',   label: 'Dashboard',      Icon: LayoutDashboard },
  { path: '/assets',      label: 'Asset Inventory', Icon: Database },
  { path: '/findings',    label: 'Risk Queue',      Icon: AlertCircle },
  { path: '/attack-graph',label: 'Attack Graph',    Icon: GitBranch },
  { path: '/compliance',  label: 'Compliance',      Icon: ShieldCheck },
  { path: '/workflows',   label: 'Workflows',       Icon: Zap },
  { path: '/reports',     label: 'Reporting',       Icon: Download },
];

const BOTTOM_ITEMS = [
  { path: '/integrations',label: 'Integrations',   Icon: Plug },
  { path: '/api-keys',    label: 'API Keys',        Icon: Key },
  { path: '/audit-logs',  label: 'Audit Trail',     Icon: ClipboardList },
  { path: '/settings/siem',label: 'SIEM & Export',  Icon: Send },
  { path: '/settings/schedules',label: 'Scan Schedules',Icon: CalendarClock },
  { path: '/policies',    label: 'Custom Policies', Icon: Code },
  { path: '/team',        label: 'Team',            Icon: Users },
  { path: '/profile',     label: 'Profile',         Icon: User },
];

function Sidebar({ darkMode, setDarkMode }) {
  const location = useLocation();
  const { logout, user } = useAuth();

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  const linkClass = (path) => isActive(path)
    ? 'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ' +
      (darkMode
        ? 'bg-indigo-600 text-white shadow-lg'
        : 'bg-indigo-50 text-indigo-700 border border-indigo-200')
    : 'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ' +
      (darkMode
        ? 'text-slate-400 hover:bg-slate-800 hover:text-white'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900');

  return (
    <div className={`w-56 flex flex-col shrink-0 border-r transition-colors ${
      darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'
    }`}>
      {/* Logo */}
      <div className={`px-4 py-5 border-b ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className={`text-sm font-bold leading-none ${darkMode ? 'text-white' : 'text-slate-900'}`}>AIXYNZ</p>
            <p className="text-xs font-semibold text-indigo-500 leading-none mt-0.5">CORTEX</p>
          </div>
        </div>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest mb-2 ${darkMode ? 'text-slate-600' : 'text-slate-400'}`}>
          Security
        </p>
        {NAV_ITEMS.map(({ path, label, Icon }) => (
          <Link key={path} to={path} className={linkClass(path)}>
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </Link>
        ))}
        <p className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest mt-4 mb-2 ${darkMode ? 'text-slate-600' : 'text-slate-400'}`}>
          Settings
        </p>
        {BOTTOM_ITEMS.map(({ path, label, Icon }) => (
          <Link key={path} to={path} className={linkClass(path)}>
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className={`px-3 py-3 border-t space-y-1 ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
        {/* User info */}
        {user && (
          <div className={`px-3 py-2 rounded-lg flex items-center gap-2 mb-1 ${darkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
            <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {(user.name || user.email || 'U')[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className={`text-xs font-semibold truncate ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                {user.name || user.email?.split('@')[0]}
              </p>
              <p className={`text-[10px] truncate ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{user.role}</p>
            </div>
          </div>
        )}
        {/* Dark mode toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            darkMode ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          {darkMode ? 'Light Mode' : 'Dark Mode'}
        </button>
        {/* Logout */}
        <button
          onClick={logout}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            darkMode ? 'text-red-400 hover:bg-red-900/20' : 'text-red-500 hover:bg-red-50'
          }`}
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { user, token, loading } = useAuth();
  if (loading) return null; // Wait for auth to resolve
  if (!user && !token) return <Navigate to="/login" replace />;
  return children;
}

function MainLayout({ children, darkMode, setDarkMode }) {
  return (
    <div className={`flex h-screen overflow-hidden font-sans transition-colors ${
      darkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      <Sidebar darkMode={darkMode} setDarkMode={setDarkMode} />
      <div className={`flex-1 overflow-auto transition-colors ${darkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
        {children}
      </div>
    </div>
  );
}

export default function App() {
  // Light mode is default; read preference from localStorage
  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem('cortex_dark_mode');
    return stored === 'true'; // default false = light mode
  });

  useEffect(() => {
    localStorage.setItem('cortex_dark_mode', darkMode);
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const layoutProps = { darkMode, setDarkMode };

  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/invite/:token" element={<AcceptInvite />} />

          {/* Protected app routes */}
          <Route path="/dashboard" element={<ProtectedRoute><MainLayout {...layoutProps}><Dashboard darkMode={darkMode} /></MainLayout></ProtectedRoute>} />
          <Route path="/assets" element={<ProtectedRoute><MainLayout {...layoutProps}><AssetInventory darkMode={darkMode} /></MainLayout></ProtectedRoute>} />
          <Route path="/assets/:id" element={<ProtectedRoute><MainLayout {...layoutProps}><AssetDetails darkMode={darkMode} /></MainLayout></ProtectedRoute>} />
          <Route path="/findings" element={<ProtectedRoute><MainLayout {...layoutProps}><Findings darkMode={darkMode} /></MainLayout></ProtectedRoute>} />
          <Route path="/attack-graph" element={<ProtectedRoute><MainLayout {...layoutProps}><AttackGraph darkMode={darkMode} /></MainLayout></ProtectedRoute>} />
          <Route path="/compliance" element={<ProtectedRoute><MainLayout {...layoutProps}><Compliance darkMode={darkMode} /></MainLayout></ProtectedRoute>} />
          <Route path="/compliance/:framework" element={<ProtectedRoute><MainLayout {...layoutProps}><ComplianceDetails darkMode={darkMode} /></MainLayout></ProtectedRoute>} />
          <Route path="/workflows" element={<ProtectedRoute><MainLayout {...layoutProps}><Workflows darkMode={darkMode} /></MainLayout></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><MainLayout {...layoutProps}><Reports darkMode={darkMode} /></MainLayout></ProtectedRoute>} />
          <Route path="/api-keys" element={<ProtectedRoute><MainLayout {...layoutProps}><ApiKeys darkMode={darkMode} /></MainLayout></ProtectedRoute>} />
          <Route path="/integrations" element={<ProtectedRoute><MainLayout {...layoutProps}><Integrations darkMode={darkMode} /></MainLayout></ProtectedRoute>} />
          <Route path="/audit-logs" element={<ProtectedRoute><MainLayout {...layoutProps}><AuditLogs darkMode={darkMode} /></MainLayout></ProtectedRoute>} />
          <Route path="/settings/siem" element={<ProtectedRoute><MainLayout {...layoutProps}><SIEMSettings darkMode={darkMode} /></MainLayout></ProtectedRoute>} />
          <Route path="/settings/schedules" element={<ProtectedRoute><MainLayout {...layoutProps}><Schedules darkMode={darkMode} /></MainLayout></ProtectedRoute>} />
          <Route path="/policies" element={<ProtectedRoute><MainLayout {...layoutProps}><Policies darkMode={darkMode} /></MainLayout></ProtectedRoute>} />
          <Route path="/team" element={<ProtectedRoute><MainLayout {...layoutProps}><Team darkMode={darkMode} /></MainLayout></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><MainLayout {...layoutProps}><Profile darkMode={darkMode} /></MainLayout></ProtectedRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
