import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle2, Zap, Shield, Crown, Loader2, AlertCircle } from 'lucide-react';
import api from '../lib/api';

export default function Billing() {
  const [billingData, setBillingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [upgrading, setUpgrading] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState('');

  useEffect(() => {
    const fetchBilling = async () => {
      try {
        const res = await api.get('/org/billing');
        setBillingData(res.data.data);
      } catch (err) {
        setError("Failed to load billing information.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchBilling();
  }, []);

  const handleUpgrade = (tier) => {
    setUpgrading(true);
    setUpgradeMessage('');
    // Simulate Stripe checkout redirect or API call
    setTimeout(() => {
      setUpgrading(false);
      setUpgradeMessage(`Successfully upgraded to the ${tier} plan! (Simulated)`);
      setBillingData(prev => ({ ...prev, plan: tier }));
      setTimeout(() => setUpgradeMessage(''), 5000);
    }, 1500);
  };

  if (loading) return <div className="p-8 text-white flex items-center gap-3"><Loader2 className="animate-spin" /> Loading billing details...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  const usagePercent = (billingData.usage.assets_scanned / billingData.usage.assets_limit) * 100;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <CreditCard className="w-8 h-8 text-emerald-500" />
          Billing & Subscriptions
        </h1>
        <p className="text-gray-400 mt-1">Manage your organization's plan, view usage, and update payment methods.</p>
      </div>

      {upgradeMessage && (
        <div className="bg-emerald-900/40 border border-emerald-500/50 text-emerald-300 p-4 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 shrink-0" />
          <span className="font-semibold">{upgradeMessage}</span>
        </div>
      )}

      {/* Current Usage Overview */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex-1 w-full">
          <h2 className="text-lg font-bold text-white mb-2">Current Plan: <span className="text-emerald-400">{billingData.plan}</span></h2>
          <p className="text-sm text-gray-400 mb-6">Your next billing cycle starts on {new Date(billingData.next_billing_date).toLocaleDateString()}.</p>
          
          <div className="mb-2 flex justify-between text-sm font-bold text-white">
            <span>Asset Usage</span>
            <span>{billingData.usage.assets_scanned} / {billingData.usage.assets_limit} Scanned</span>
          </div>
          <div className="h-4 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
            <div 
              className={`h-full ${usagePercent > 90 ? 'bg-red-500' : 'bg-emerald-500'} transition-all duration-1000`} 
              style={{ width: \`\${usagePercent}%\` }}
            ></div>
          </div>
          {usagePercent > 90 && (
             <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
               <AlertCircle className="w-3 h-3" /> Nearing plan limit. Upgrade to scan more assets.
             </p>
          )}
        </div>
        
        <div className="shrink-0 bg-gray-800/50 p-6 rounded-xl border border-gray-700 text-center min-w-[200px]">
          <div className="text-sm text-gray-400 font-bold uppercase tracking-wider mb-1">Status</div>
          <div className="text-2xl font-black text-emerald-400 capitalize">{billingData.status}</div>
        </div>
      </div>

      {/* Pricing Tiers */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">Available Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Free Tier */}
          <div className={`bg-gray-900 border rounded-2xl p-8 flex flex-col ${billingData.plan === 'Free' ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-800'}`}>
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2"><Shield className="w-5 h-5 text-gray-400" /> Free</h3>
            <div className="text-3xl font-black text-white mb-6">$0<span className="text-sm text-gray-500 font-normal"> / month</span></div>
            <ul className="space-y-3 mb-8 flex-1 text-gray-300 text-sm">
              <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" /> Up to 50 assets</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" /> Basic posture scanning</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" /> Community support</li>
            </ul>
            <button 
              disabled={billingData.plan === 'Free' || upgrading}
              className="w-full py-3 rounded-lg font-bold transition bg-gray-800 text-white hover:bg-gray-700 disabled:opacity-50"
            >
              {billingData.plan === 'Free' ? 'Current Plan' : 'Downgrade'}
            </button>
          </div>

          {/* Pro Tier */}
          <div className={`bg-gray-900 border rounded-2xl p-8 flex flex-col relative ${billingData.plan === 'Pro' ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-emerald-500/50'}`}>
            {billingData.plan !== 'Pro' && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                Recommended
              </div>
            )}
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2"><Zap className="w-5 h-5 text-emerald-400" /> Pro</h3>
            <div className="text-3xl font-black text-white mb-6">$499<span className="text-sm text-gray-500 font-normal"> / month</span></div>
            <ul className="space-y-3 mb-8 flex-1 text-gray-300 text-sm">
              <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" /> Up to 500 assets</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" /> Advanced Risk Engine (AI)</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" /> Auto-remediation (Jira)</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" /> Email support</li>
            </ul>
            <button 
              onClick={() => handleUpgrade('Pro')}
              disabled={billingData.plan === 'Pro' || upgrading}
              className={`w-full py-3 rounded-lg font-bold transition flex items-center justify-center gap-2 ${
                billingData.plan === 'Pro' ? 'bg-gray-800 text-white opacity-50 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
              }`}
            >
              {upgrading ? <Loader2 className="w-5 h-5 animate-spin" /> : billingData.plan === 'Pro' ? 'Current Plan' : 'Upgrade to Pro'}
            </button>
          </div>

          {/* Enterprise Tier */}
          <div className={`bg-gray-900 border rounded-2xl p-8 flex flex-col ${billingData.plan === 'Enterprise' ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-800'}`}>
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2"><Crown className="w-5 h-5 text-purple-400" /> Enterprise</h3>
            <div className="text-3xl font-black text-white mb-6">Custom</div>
            <ul className="space-y-3 mb-8 flex-1 text-gray-300 text-sm">
              <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" /> Unlimited assets</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" /> Custom SIEM integrations</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" /> Dedicated success manager</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" /> 24/7 Phone support</li>
            </ul>
            <button 
              onClick={() => handleUpgrade('Enterprise')}
              disabled={billingData.plan === 'Enterprise' || upgrading}
              className={`w-full py-3 rounded-lg font-bold transition flex items-center justify-center gap-2 ${
                billingData.plan === 'Enterprise' ? 'bg-gray-800 text-white opacity-50 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/20'
              }`}
            >
              {upgrading ? <Loader2 className="w-5 h-5 animate-spin" /> : billingData.plan === 'Enterprise' ? 'Current Plan' : 'Contact Sales'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
