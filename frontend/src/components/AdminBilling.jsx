import React, { useState, useEffect } from 'react'
import { DollarSign, Users, Activity, ExternalLink, Shield, CheckCircle, AlertCircle, Search } from 'lucide-react'
import { api } from '../utils/api'
import { useAuth } from '../contexts/AuthContext'

export default function AdminBilling() {
  const [stats, setStats] = useState(null)
  const [subscriptions, setSubscriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, subRes] = await Promise.all([
          api.get('/billing/admin/stats'),
          api.get('/billing/admin/subscriptions')
        ])
        setStats(statsRes.data)
        setSubscriptions(subRes.data)
      } catch (err) {
        console.error('Failed to fetch admin billing data:', err)
      } finally {
        setLoading(false)
      }
    }
    if (user?.tier === 'admin') fetchData()
  }, [user])

  if (user?.tier !== 'admin') {
    return (
      <div className="p-12 text-center">
        <Shield size={48} className="mx-auto text-rose-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900">Access Restricted</h2>
        <p className="text-slate-500">Only system administrators can access the billing dashboard.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Financial Command Center</h1>
        <p className="text-slate-500 mt-2">Global revenue monitoring and subscription lifecycle management.</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase mb-1">Estimated MRR</p>
          <div className="flex items-center gap-2">
            <h3 className="text-3xl font-black text-slate-900">${stats?.estimated_mrr.toLocaleString()}</h3>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">+12%</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase mb-1">Total Portfolio Users</p>
          <h3 className="text-3xl font-black text-slate-900">{stats?.total_users}</h3>
        </div>
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
          <p className="text-xs font-bold text-slate-500 uppercase mb-1">Conversion Rate</p>
          <h3 className="text-3xl font-black text-white">4.2%</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase mb-1">Active Enterprise Plans</p>
          <h3 className="text-3xl font-black text-blue-600">{stats?.tier_breakdown?.enterprise}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Tier Breakdown */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 overflow-hidden">
          <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Activity size={18} className="text-blue-500" /> Subscription Segments
          </h3>
          <div className="space-y-6">
            {Object.entries(stats?.tier_breakdown || {}).map(([tier, count]) => (
              <div key={tier}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-bold text-slate-700 capitalize">{tier}</span>
                  <span className="text-sm font-black text-slate-900">{count}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${tier === 'enterprise' ? 'bg-blue-600' :
                        tier === 'pro' ? 'bg-indigo-500' :
                          tier === 'api' ? 'bg-violet-500' :
                            tier === 'starter' ? 'bg-emerald-500' :
                              'bg-slate-300'
                      }`}
                    style={{ width: `${(count / stats?.total_users) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Subscriptions */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between">
            <h3 className="font-bold text-slate-900">Portfolio Accounts</h3>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="Search accounts..." className="pl-9 pr-4 py-1.5 bg-slate-50 border-none rounded-lg text-xs" />
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-50">
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Account (Sub-id)</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Plan</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fulfillment Date</th>
                  <th className="p-4 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {subscriptions.map(sub => (
                  <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-slate-900 text-sm">{sub.email}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{sub.id}</p>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${sub.tier === 'enterprise' ? 'bg-blue-50 text-blue-700' :
                          sub.tier === 'pro' ? 'bg-indigo-50 text-indigo-700' :
                            sub.tier === 'api' ? 'bg-violet-50 text-violet-700' :
                              'bg-emerald-50 text-emerald-700'
                        }`}>
                        {sub.tier}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-slate-500">
                      {sub.upgraded_at ? new Date(sub.upgraded_at).toLocaleDateString() : 'Manual Migration'}
                    </td>
                    <td className="p-4 text-right">
                      <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors rounded-lg">
                        <ExternalLink size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
