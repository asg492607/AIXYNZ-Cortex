import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function AcceptInvite() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  
  const [status, setStatus] = useState('processing');
  const [error, setError] = useState('');
  
  useEffect(() => {
    // Wait for auth to resolve
    if (authLoading) return;
    
    // If not logged in, they can't accept yet
    if (!user) {
      setStatus('unauthorized');
      return;
    }
    
    const acceptToken = async () => {
      try {
        await api.post('/org/invites/accept', { token });
        setStatus('success');
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } catch (err) {
        setStatus('error');
        setError(err.response?.data?.detail || "Failed to accept invitation. It may be invalid or expired.");
      }
    };
    
    acceptToken();
  }, [token, user, authLoading, navigate]);

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 font-sans">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md p-8 shadow-2xl text-center">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-2">Organization Invitation</h1>
        
        {status === 'processing' && (
          <div className="py-8">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Verifying your invitation...</p>
          </div>
        )}
        
        {status === 'unauthorized' && (
          <div className="py-4 text-center">
            <p className="text-gray-300 mb-6">
              You've been invited to join an organization on AIXYNZ Cortex. Please sign in or create an account first.
            </p>
            <div className="flex flex-col gap-3">
              <Link to="/login" className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition">
                Sign In
              </Link>
              <Link to="/register" className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition border border-gray-700">
                Create Account
              </Link>
            </div>
            <p className="text-sm text-gray-500 mt-6">
              After signing in, return to the invitation link in your email.
            </p>
          </div>
        )}
        
        {status === 'error' && (
          <div className="py-4">
            <div className="bg-red-900/20 border border-red-900/50 p-4 rounded-xl mb-6 flex items-start gap-3 text-left">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <span className="text-red-400 text-sm">{error}</span>
            </div>
            <Link to="/dashboard" className="text-blue-400 hover:text-blue-300 font-medium">
              Go to Dashboard
            </Link>
          </div>
        )}
        
        {status === 'success' && (
          <div className="py-4">
            <div className="w-12 h-12 rounded-full bg-emerald-900/30 text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-800/50">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <p className="text-emerald-400 font-medium text-lg mb-2">Invitation Accepted!</p>
            <p className="text-gray-400 text-sm">Redirecting you to the dashboard...</p>
          </div>
        )}
      </div>
    </div>
  );
}
