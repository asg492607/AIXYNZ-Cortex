import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Shield, LayoutDashboard, Settings } from 'lucide-react';

function Dashboard() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Command Center</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-lg">
          <h2 className="text-xl font-semibold text-gray-300">Posture Score</h2>
          <p className="text-5xl font-bold text-green-400 mt-4">A+</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-lg">
          <h2 className="text-xl font-semibold text-gray-300">Critical Risks</h2>
          <p className="text-5xl font-bold text-red-500 mt-4">0</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-lg">
          <h2 className="text-xl font-semibold text-gray-300">Integrations Active</h2>
          <p className="text-5xl font-bold text-blue-400 mt-4">0</p>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="flex h-screen bg-gray-900 text-gray-100">
        {/* Sidebar */}
        <div className="w-64 bg-gray-950 border-r border-gray-800 flex flex-col">
          <div className="p-6 flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-500" />
            <span className="text-xl font-bold tracking-wider">CORTEX</span>
          </div>
          <nav className="flex-1 px-4 mt-6 space-y-2">
            <Link to="/" className="flex items-center gap-3 px-4 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition">
              <LayoutDashboard className="w-5 h-5" />
              Dashboard
            </Link>
            <Link to="/settings" className="flex items-center gap-3 px-4 py-3 text-gray-400 rounded-lg hover:bg-gray-800 hover:text-white transition">
              <Settings className="w-5 h-5" />
              Settings
            </Link>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/settings" element={<div className="p-8"><h1 className="text-3xl font-bold">Settings</h1></div>} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
