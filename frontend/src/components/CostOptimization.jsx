import React, { useState, useEffect } from 'react'
import { DollarSign, TrendingDown, BarChart2, Zap, CheckCircle, Clock, Eye, ArrowUpRight, Lock } from 'lucide-react'
import { api } from '../utils/api'
import { useAuth } from '../contexts/AuthContext'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const EFFORT_COLORS = { low: 'bg-emerald-50 text-emerald-700', medium: 'bg-amber-50 text-amber-700', high: 'bg-rose-50 text-rose-700' }
const STATUS_COLORS = { identified: 'bg-slate-100 text-slate-600', under_review: 'bg-blue-50 text-blue-700', approved: 'bg-emerald-50 text-emerald-700' }

export default function CostOptimization() {
  const { user } = useAuth()
  const isPro = user?.tier !== 'free'
  const [opportunities, setOpportunities] = useState([])
  const [benchmarks, setBenchmarks] = useState([])
  const [summary, setSummary] = useState(null)
  const [tab, setTab] = useState('savings')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [savRes, bmRes] = await Promise.all([
          api.get('/savings/opportunities'),
          api.get('/savings/benchmarks')
        ])
        setOpportunities(savRes.data)
        setSummary(savRes.summary)
        setBenchmarks(bmRes.data)
      } catch (err) {
        console.error('Failed to fetch savings data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    )
  }

  const chartData = opportunities.map(o => ({
    name: o.vendor_name.split(' ')[0],
    savings: o.potential_savings,
    effort: o.effort
  }))

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Cost Optimization</h1>
        <p className="text-slate-500 mt-2">AI-identified savings opportunities and vendor market benchmarking.</p>
      </div>

      {/* Summary KPIs */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { label: 'Total Potential Savings', value: `$${summary.total_potential.toLocaleString()}`, icon: TrendingDown, color: 'emerald' },
            { label: 'Quick Wins (Low Effort)', value: summary.quick_wins, icon: Zap, color: 'blue' },
            { label: 'Approved Actions', value: summary.approved, icon: CheckCircle, color: 'indigo' }
          ].map((kpi, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-${kpi.color}-50`}>
                <kpi.icon className={`text-${kpi.color}-600`} size={22} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{kpi.label}</p>
                <p className="text-2xl font-bold text-slate-900 mt-0.5">{kpi.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-8 w-fit">
        {[
          { id: 'savings', label: 'Savings Opportunities', icon: DollarSign },
          { id: 'benchmark', label: 'Market Benchmarks', icon: BarChart2 },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === t.id ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <t.icon size={16} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'savings' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Bar chart */}
          <div className="lg:col-span-1 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="font-semibold text-slate-900 mb-4 text-sm">Savings by Vendor</h3>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} width={60} />
                  <Tooltip formatter={v => [`$${v.toLocaleString()}`, 'Savings']} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                  <Bar dataKey="savings" radius={[0, 4, 4, 0]} barSize={20}>
                    {chartData.map((entry, index) => (
                      <Cell key={index} fill={entry.effort === 'low' ? '#10b981' : entry.effort === 'medium' ? '#f59e0b' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Opportunity cards */}
          <div className="lg:col-span-2 space-y-4 relative">
            {opportunities.map((opp, index) => (
              <div key={opp.id} className="relative">
                <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex items-start gap-4 group transition-colors ${!isPro && index >= 1 ? 'blur-md select-none opacity-60' : 'hover:border-blue-200'}`}>
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <TrendingDown className="text-emerald-600" size={18} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-slate-900">{opp.vendor_name}</p>
                        <p className="text-xs text-slate-500 capitalize mt-0.5">{opp.opportunity_type.replace(/_/g, ' ')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-emerald-600">${opp.potential_savings.toLocaleString()}</p>
                        <p className="text-[10px] text-slate-400">{opp.confidence}% confidence</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 mt-2 leading-relaxed">{opp.description}</p>
                    <div className="flex items-center gap-3 mt-3 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${EFFORT_COLORS[opp.effort]}`}>
                        {opp.effort} effort
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${STATUS_COLORS[opp.status]}`}>
                        {opp.status.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-slate-500 ml-auto">{opp.action_required}</span>
                    </div>
                  </div>
                </div>
                
                {/* Paywall Overlay */}
                {!isPro && index === 1 && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pt-8">
                    <div className="bg-slate-900/95 backdrop-blur-sm px-8 py-6 rounded-2xl shadow-xl border border-slate-700 text-center max-w-sm">
                      <Lock size={24} className="text-emerald-400 mx-auto mb-3" />
                      <p className="font-bold text-white text-base">Unlock {opportunities.length - 1} More Opportunities</p>
                      <p className="text-xs text-slate-300 mt-2 mb-4 leading-relaxed">Your account identified additional savings opportunities worth over $100k. Upgrade to Professional to view all details.</p>
                      <a href="/billing" className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold transition-all inline-block">
                        Upgrade to Pro
                      </a>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'benchmark' && (
        <div className="space-y-4">
          {benchmarks.map(bm => {
            const isAbove = bm.status.includes('above')
            const isBelow = bm.status === 'below_market'
            return (
              <div key={bm.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-semibold text-slate-900">{bm.vendor_name}</p>
                    <p className="text-xs text-slate-500">{bm.category}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                      isAbove ? 'bg-rose-50 text-rose-700' : isBelow ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {bm.status.replace(/_/g, ' ')}
                    </span>
                    {isAbove && <ArrowUpRight size={16} className="text-rose-600" />}
                  </div>
                </div>

                {/* Price bar visual */}
                {bm.your_cost_per_seat && (
                  <div className="space-y-2 text-xs text-slate-500">
                    <div className="flex justify-between">
                      <span>Market Low: ${bm.market_low}/seat</span>
                      <span className="font-semibold text-slate-900">Your: ${bm.your_cost_per_seat}/seat</span>
                      <span>Market High: ${bm.market_high}/seat</span>
                    </div>
                    <div className="relative h-2 bg-slate-100 rounded-full">
                      <div className="absolute h-full bg-emerald-500 rounded-full" style={{left: '0%', width: `${((bm.market_median - bm.market_low) / (bm.market_high - bm.market_low)) * 100}%`}}></div>
                      <div className={`absolute h-4 w-1 -top-1 rounded-full ${isAbove ? 'bg-rose-500' : 'bg-blue-500'}`}
                        style={{left: `${Math.min(100, ((bm.your_cost_per_seat - bm.market_low) / (bm.market_high - bm.market_low)) * 100)}%`}}>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span>Peers surveyed: {bm.peers_count} organizations</span>
                      <span>You are in the <strong>{bm.pricing_percentile}th percentile</strong></span>
                    </div>
                  </div>
                )}

                {bm.your_annual_cost && (
                  <div className="flex gap-6 text-sm mt-2">
                    <div><span className="text-slate-500">Your Annual Cost: </span><strong>${bm.your_annual_cost.toLocaleString()}</strong></div>
                    <div><span className="text-slate-500">Market Median: </span><strong>${bm.market_annual_median.toLocaleString()}</strong></div>
                    <div><span className="text-slate-500">Peers: </span><strong>{bm.peers_count}</strong></div>
                  </div>
                )}

                <div className="mt-4 pt-3 border-t border-slate-50 flex items-center gap-2 text-xs">
                  <Eye size={12} className="text-blue-500" />
                  <span className="text-slate-600">{bm.recommendation}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
