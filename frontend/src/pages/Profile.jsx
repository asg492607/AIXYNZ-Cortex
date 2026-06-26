import React, { useEffect, useState } from 'react';
import { User, Building, ShieldCheck, Mail, Calendar, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

export default function Profile() {
  const { user, logout } = useAuth();
  const [org, setOrg] = useState(null);

  useEffect(() => {
    async function fetchOrg() {
      try {
        const res = await api.get('/organizations/current');
        setOrg(res.data.data);
      } catch (err) {
        console.error("Failed to fetch organization", err);
      }
    }
    fetchOrg();
  }, []);

  if (!user) return null;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">My Profile</h1>
          <p className="text-gray-400">Manage your account and organization settings.</p>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 px-4 py-2 bg-red-900/20 text-red-400 hover:bg-red-900/40 border border-red-900/50 rounded-lg transition"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <User className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-semibold text-white">Personal Information</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-500">Name</label>
              <div className="text-white font-medium">{user.name}</div>
            </div>
            <div>
              <label className="text-sm text-gray-500">Email Address</label>
              <div className="flex items-center gap-2 text-white font-medium">
                <Mail className="w-4 h-4 text-gray-400" />
                {user.email}
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-500">System Role</label>
              <div className="flex items-center gap-2 text-white font-medium mt-1">
                <ShieldCheck className={`w-4 h-4 ${user.role === 'admin' ? 'text-purple-400' : 'text-blue-400'}`} />
                <span className="capitalize px-2 py-0.5 bg-gray-800 rounded text-sm">{user.role}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Building className="w-6 h-6 text-emerald-400" />
            <h2 className="text-xl font-semibold text-white">Organization</h2>
          </div>
          {org ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-500">Organization Name</label>
                <div className="text-white font-medium">{org.name}</div>
              </div>
              <div>
                <label className="text-sm text-gray-500">Subscription Plan</label>
                <div className="text-white font-medium capitalize mt-1">
                  <span className="px-2 py-0.5 bg-emerald-900/20 text-emerald-400 border border-emerald-900/50 rounded text-sm">
                    {org.plan}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-500">Joined</label>
                <div className="flex items-center gap-2 text-white font-medium mt-1">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  {new Date(org.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-gray-400">Loading organization details...</div>
          )}
        </div>
      </div>
    </div>
  );
}
