import React, { useEffect, useState } from 'react';
import { Users, UserPlus, Mail, Shield, Trash2, CheckCircle2 } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function Team() {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [membersRes, invitesRes] = await Promise.all([
        api.get('/users'),
        api.get('/org/invites')
      ]);
      setMembers(membersRes.data.data);
      setInvites(invitesRes.data.data);
    } catch (err) {
      console.error("Failed to fetch team data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviteError('');
    setInviteSuccess('');
    
    try {
      const res = await api.post('/org/invites', {
        email: inviteEmail,
        role: inviteRole
      });
      
      setInviteSuccess(`Invitation sent! Link: ${res.data.data.invite_link}`);
      setInviteEmail('');
      fetchData(); // Refresh list
    } catch (err) {
      setInviteError(err.response?.data?.detail || "Failed to send invitation");
    }
  };

  const handleRevoke = async (inviteId) => {
    try {
      await api.delete(`/org/invites/${inviteId}`);
      fetchData();
    } catch (err) {
      console.error("Failed to revoke invite", err);
    }
  };

  if (loading) return <div className="p-8 text-gray-400">Loading team...</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-400" /> Team Management
          </h1>
          <p className="text-gray-400">Manage organization members and invitations.</p>
        </div>
        
        {user.role === 'admin' && (
          <button 
            onClick={() => { setShowInviteModal(true); setInviteSuccess(''); setInviteError(''); }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition"
          >
            <UserPlus className="w-4 h-4" />
            Invite Member
          </button>
        )}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-800 bg-gray-900/50">
          <h2 className="text-lg font-semibold text-white">Active Members</h2>
        </div>
        <table className="w-full text-left">
          <thead className="bg-gray-800/50 text-gray-400 text-sm">
            <tr>
              <th className="px-6 py-3 font-medium">User</th>
              <th className="px-6 py-3 font-medium">Role</th>
              <th className="px-6 py-3 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {members.map(member => (
              <tr key={member.id} className="hover:bg-gray-800/20 transition">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-900/50 text-blue-400 flex items-center justify-center font-bold">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-white font-medium">{member.name} {member.id === user.id && '(You)'}</div>
                      <div className="text-sm text-gray-400 flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {member.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${
                    member.role === 'admin' ? 'bg-purple-900/20 border-purple-800/50 text-purple-400' :
                    member.role === 'analyst' ? 'bg-blue-900/20 border-blue-800/50 text-blue-400' :
                    'bg-gray-800 border-gray-700 text-gray-300'
                  }`}>
                    <Shield className="w-3 h-3" />
                    {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-400">
                  {new Date(member.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {user.role === 'admin' && invites.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800 bg-gray-900/50">
            <h2 className="text-lg font-semibold text-white">Pending Invitations</h2>
          </div>
          <table className="w-full text-left">
            <thead className="bg-gray-800/50 text-gray-400 text-sm">
              <tr>
                <th className="px-6 py-3 font-medium">Email</th>
                <th className="px-6 py-3 font-medium">Role</th>
                <th className="px-6 py-3 font-medium">Sent On</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {invites.map(invite => (
                <tr key={invite.id} className="hover:bg-gray-800/20 transition">
                  <td className="px-6 py-4 text-gray-300">{invite.email}</td>
                  <td className="px-6 py-4">
                    <span className="capitalize text-sm text-gray-400 bg-gray-800 px-2 py-1 rounded">
                      {invite.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">
                    {new Date(invite.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleRevoke(invite.id)}
                      className="text-red-400 hover:text-red-300 transition text-sm flex items-center gap-1 ml-auto"
                    >
                      <Trash2 className="w-4 h-4" /> Revoke
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4">Invite New Member</h2>
            
            {inviteError && (
              <div className="mb-4 p-3 bg-red-900/20 border border-red-900/50 text-red-400 rounded-lg text-sm">
                {inviteError}
              </div>
            )}
            
            {inviteSuccess && (
              <div className="mb-4 p-3 bg-emerald-900/20 border border-emerald-900/50 text-emerald-400 rounded-lg text-sm flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="break-all">{inviteSuccess}</div>
              </div>
            )}

            <form onSubmit={handleInvite}>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Email Address</label>
                  <input 
                    type="email" required 
                    value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:border-blue-500 transition"
                    placeholder="colleague@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Role</label>
                  <select 
                    value={inviteRole} onChange={e => setInviteRole(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:border-blue-500 transition appearance-none"
                  >
                    <option value="viewer">Viewer (Read-only)</option>
                    <option value="analyst">Analyst (Manage findings)</option>
                    <option value="admin">Admin (Full access)</option>
                  </select>
                </div>
              </div>
              
              <div className="flex gap-3 justify-end">
                <button 
                  type="button" 
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition"
                >
                  Close
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
