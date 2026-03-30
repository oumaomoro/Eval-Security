import React, { useState, useEffect } from 'react'
import { AlertTriangle, ShieldAlert, TrendingUp, DollarSign, Filter, Search, ChevronRight } from 'lucide-react'
import { api } from '../utils/api'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

export default function RiskManagement() {
  const [risks, setRisks] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    const fetchRisks = async () => {
      try {
        const res = await api.get('/risk/register')
        setRisks(res.data)
      } catch (err) {
        console.error('Error fetching risk register:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchRisks()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    )
  }

  const categoryStats = risks.reduce((acc, risk) => {
    acc[risk.risk_category] = (acc[risk.risk_category] || 0) + 1
    return acc
  }, {})

  const pieData = Object.keys(categoryStats).map(cat => ({
    name: cat.charAt(0).toUpperCase() + cat.slice(1),
    value: categoryStats[cat]
  }))

  const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#6366f1', '#8b5cf6']

  const filteredRisks = filter === 'all' ? risks : risks.filter(r => r.severity === filter)

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Risk Management</h1>
        <p className="text-slate-500 mt-2">Centralized register of AI-identified risks and mitigation strategies.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Risk Distribution Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col">
          <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
            <TrendingUp size={20} className="text-blue-600" />
            Risk by Category
          </h3>
          <div className="h-[250px] w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Legend iconType="circle" wrapperStyle={{fontSize: '12px', color: '#64748b'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Financial Exposure Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
            <DollarSign size={20} className="text-emerald-600" />
            Financial Exposure
          </h3>
          <div className="space-y-6">
            <div>
              <p className="text-sm font-medium text-slate-500 text-center">Estimated Total Exposure (Max)</p>
              <p className="text-4xl font-bold text-slate-900 mt-2 text-center">
                ${risks.reduce((acc, r) => acc + r.financial_exposure.max_estimate, 0).toLocaleString()}
              </p>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
              <div className="h-full bg-rose-500" style={{width: '60%'}}></div>
              <div className="h-full bg-amber-500" style={{width: '25%'}}></div>
              <div className="h-full bg-blue-500" style={{width: '15%'}}></div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-500"></span> Critical</div>
              <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500"></span> High</div>
              <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-500"></span> Medium</div>
            </div>
          </div>
        </div>

        {/* High Confidence Risks */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
            <ShieldAlert size={20} className="text-rose-600" />
            Critical Findings
          </h3>
          <div className="space-y-4">
            {risks.filter(r => r.severity === 'critical' || r.severity === 'high').map(risk => (
              <div key={risk.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                    risk.severity === 'critical' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {risk.severity}
                  </span>
                  <span className="text-xs text-slate-400">{risk.ai_confidence}% AI Match</span>
                </div>
                <p className="text-sm font-semibold text-slate-900 line-clamp-1">{risk.risk_title}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Risk Register Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search risks..." 
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-slate-400" />
              <select 
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="bg-transparent text-sm font-medium text-slate-600 border-none focus:ring-0 p-0 cursor-pointer"
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
              </select>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-50">
                <th className="px-6 py-4">Risk Title</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Severity</th>
                <th className="px-6 py-4">Score</th>
                <th className="px-6 py-4">Exposure</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredRisks.map(risk => (
                <tr key={risk.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-5">
                    <p className="font-semibold text-slate-900 text-sm">{risk.risk_title}</p>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{risk.risk_description}</p>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-xs font-medium text-slate-600 capitalize">{risk.risk_category}</span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${
                        risk.severity === 'critical' ? 'bg-rose-500' : 
                        risk.severity === 'high' ? 'bg-amber-500' : 'bg-blue-500'
                      }`} />
                      <span className="text-xs font-semibold text-slate-900 capitalize">{risk.severity}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 font-mono text-xs font-bold text-slate-700">{risk.risk_score}</td>
                  <td className="px-6 py-5 text-xs font-semibold text-slate-900">
                    ${risk.financial_exposure.max_estimate.toLocaleString()}
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${
                      risk.mitigation_status === 'mitigated' ? 'bg-emerald-50 text-emerald-700' : 
                      risk.mitigation_status === 'mitigation_planned' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {risk.mitigation_status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button className="p-2 opacity-0 group-hover:opacity-100 hover:bg-white rounded-lg transition-all text-slate-400 hover:text-blue-600 shadow-sm border border-transparent hover:border-slate-100">
                      <ChevronRight size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
