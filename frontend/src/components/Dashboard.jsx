import React, { useState, useEffect } from 'react'
import { Activity, AlertTriangle, FileText, DollarSign, Crown, Rocket, Zap, TrendingUp, ShieldCheck, Target, Banknote, Plus } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../utils/api'

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Using Promise.allSettled to ensure one failing route doesn't crash the whole UI
        const results = await Promise.allSettled([
          api.get('/dashboard/metrics'),
          api.get('/analytics/dashboard')
        ]);

        if (results[0].status === 'fulfilled') {
          setMetrics(results[0].value.data);
        } else {
          console.warn('[Dashboard] Metrics fetch failed:', results[0].reason);
        }

        if (results[1].status === 'fulfilled') {
          setAnalytics(results[1].value.data);
        } else {
          console.warn('[Dashboard] Analytics fetch failed:', results[1].reason);
        }

        // Only set error if BOTH failed - otherwise just show what we have
        if (results[0].status === 'rejected' && results[1].status === 'rejected') {
          setError('System is currently unable to retrieve your dashboard data. Please try again in a few minutes.');
        }
      } catch (err) {
        setError('A network error occurred while connecting to the server.');
      } finally {
        setLoading(false);
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 dark:border-white"></div>
      </div>
    )
  }

  if (error) {
    return <div className="p-6 text-red-600 dark:text-rose-400 bg-red-50 dark:bg-rose-950/30 border border-red-100 dark:border-rose-900/50 rounded-lg m-6">{error}</div>
  }

  const statCards = [
    { title: 'Economic Impact', value: `$${(analytics?.executive_roi?.total_economic_impact || 0).toLocaleString()}`, icon: Banknote, color: 'text-indigo-600', bg: 'bg-indigo-50', sub: 'Total Savings + Risk' },
    { title: 'Compliance Health', value: `${analytics?.compliance_health?.current_score || 0}%`, icon: ShieldCheck, color: 'text-blue-600', bg: 'bg-blue-50', sub: `vs ${analytics?.compliance_health?.benchmark || 75}% Segment` },
    { title: 'Hours Liberated', value: `${Math.round(analytics?.executive_roi?.hours_liberated || 0)} hrs`, icon: Rocket, color: 'text-emerald-600', bg: 'bg-emerald-50', sub: 'Legal Review Savings' },
    { title: 'Mitigated Exposure', value: `$${(analytics?.total_mitigated_exposure || 0).toLocaleString()}`, icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50', sub: 'Critical Gaps Resolved' }
  ]

  const { user } = useAuth()
  const currentTier = user?.tier || 'free'
  const limits = { free: 5, starter: 10, pro: 50, enterprise: 9999 }
  const currentLimit = limits[currentTier] || 5
  const usageCount = metrics?.total_contracts || 0
  const usagePercent = Math.min(Math.round((usageCount / currentLimit) * 100), 100)

  const hasData = metrics?.total_contracts > 0;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="p-8 max-w-7xl mx-auto"
    >
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <motion.div variants={itemVariants}>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            Dashboard Overview
            {['pro', 'enterprise'].includes(currentTier) && (
              <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] uppercase font-black px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800/50 flex items-center gap-1">
                <Crown size={10} /> {currentTier}
              </span>
            )}
          </h1>
          <p className="text-slate-500 mt-1">Welcome back. Here's a summary of your automated contract analyses.</p>
        </motion.div>

        {/* Tier Usage Card */}
        <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm min-w-[280px]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Plan Usage ({currentTier})</span>
            <span className="text-xs font-bold text-slate-900 dark:text-white">{usageCount} / {currentLimit === 9999 ? '∞' : currentLimit}</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mb-3">
            <div
              className={`h-full transition-all duration-1000 ${usagePercent > 80 ? 'bg-rose-500' : 'bg-blue-600'}`}
              style={{ width: `${usagePercent}%` }}
            ></div>
          </div>
          {usagePercent >= 80 && currentLimit !== 9999 && (
            <button
              onClick={() => window.location.href = '/billing'}
              className="w-full py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[11px] font-bold rounded-lg border border-blue-100 dark:border-blue-800/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors flex items-center justify-center gap-1"
            >
              <Zap size={10} /> Boost Your Limit
            </button>
          )}
        </motion.div>
      </div>

      {!hasData ? (
        <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] p-12 text-center relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

          <div className="relative z-10 max-w-2xl mx-auto">
            <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-3xl flex items-center justify-center text-blue-600 dark:text-blue-400 mx-auto mb-8 shadow-inner animate-float">
              <Rocket size={40} />
            </div>
            <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">Your AI Compliance Journey Starts Here</h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg mb-10 leading-relaxed">
              Upload your first vendor agreement to unlock predictive ROI analytics, regional risk heatmaps, and automated legal redlining aligned with IRA and CMA standards.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => navigate('/upload')}
                className="w-full sm:w-auto px-10 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-2xl hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center justify-center gap-2 animate-pulse-glow"
              >
                <Plus size={20} /> Analyze First Contract
              </button>
              <button
                onClick={() => navigate('/gold-standard')}
                className="w-full sm:w-auto px-10 py-4 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all hover:scale-105"
              >
                Explore Legal Library
              </button>
            </div>

            <div className="mt-12 flex items-center justify-center gap-8 grayscale opacity-50">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} /> <span className="text-[10px] font-bold uppercase tracking-widest">IRA Ready</span>
              </div>
              <div className="flex items-center gap-2">
                <Target size={16} /> <span className="text-[10px] font-bold uppercase tracking-widest">CMA Aligned</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity size={16} /> <span className="text-[10px] font-bold uppercase tracking-widest">POPIA Shield</span>
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statCards.map((stat, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{
                  scale: 1.02,
                  boxShadow: '0 25px 30px -10px rgba(0, 0, 0, 0.15)',
                  borderColor: 'rgba(59, 130, 246, 0.3)'
                }}
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-500/10 transition-colors"></div>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${stat.bg} dark:bg-opacity-10 backdrop-blur-sm shadow-sm ring-1 ring-black/5 group-hover:scale-110 transition-transform duration-500`}>
                  <stat.icon className={`h-6 w-6 ${stat.color} dark:opacity-80`} strokeWidth={2.5} />
                </div>
                <h3 className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest">{stat.title}</h3>
                <div className="flex items-baseline gap-1 mt-1">
                  <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{stat.value}</p>
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 flex items-center gap-1 font-black uppercase tracking-tight">
                  <TrendingUp size={10} className="text-emerald-500" /> {stat.sub}
                </p>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Futuristic Trend Chart */}
            <motion.div variants={itemVariants} className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">Compliance Velocity</h2>
                  <p className="text-sm text-slate-500">Predictive risk reduction trajectory over last 7 batches.</p>
                </div>
                <div className="flex gap-2">
                  <div className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-full border border-emerald-100 dark:border-emerald-800/50">
                    +14% Improvement
                  </div>
                </div>
              </div>

              <div className="h-64 flex items-end justify-between gap-2 px-4 mb-4">
                {(metrics?.risk_trend || [40, 45, 52, 58, 65, 75, 84]).map((val, i) => (
                  <div key={i} className="flex-1 group relative">
                    <div
                      className="w-full bg-blue-600/10 dark:bg-blue-400/5 group-hover:bg-blue-600/20 rounded-t-lg transition-all duration-1000 origin-bottom"
                      style={{ height: `${val}%`, minHeight: '10%' }}
                    >
                      <div
                        className="absolute top-0 left-1/2 -translate-x-1/2 -mt-8 opacity-0 group-hover:opacity-100 bg-slate-900 text-white text-[10px] px-2 py-1 rounded-md transition-all shadow-xl font-bold"
                      >
                        {val}%
                      </div>
                    </div>
                    <div className="mt-3 text-[10px] font-bold text-slate-400 text-center uppercase tracking-tighter">B-{i + 1}</div>
                  </div>
                ))}
              </div>
              <div className="absolute top-0 right-0 w-full h-full pointer-events-none opacity-5 dark:opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-500 via-transparent to-transparent"></div>
            </motion.div>

            {/* Global Readiness Matrix (East, Central, South Africa Focus) */}
            <motion.div variants={itemVariants} className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
              <div className="relative z-10">
                <h2 className="text-xl font-black mb-1">Regional Readiness</h2>
                <p className="text-indigo-300 text-xs mb-8">Africa & MEA Compliance footprint.</p>

                <div className="space-y-6">
                  {[
                    { label: 'IRA (Kenya Insurance)', val: analytics?.risk_heatmap?.['Regulatory (IRA/CMA)'] ? Math.max(0, 100 - analytics.risk_heatmap['Regulatory (IRA/CMA)'] * 20) : 95 },
                    { label: 'CMA (Capital Markets)', val: analytics?.risk_heatmap?.['Regulatory (IRA/CMA)'] ? Math.max(0, 100 - analytics.risk_heatmap['Regulatory (IRA/CMA)'] * 15) : 88 },
                    { label: 'KDPA (Kenya Data)', val: analytics?.risk_heatmap?.['Data Privacy (GDPR/KDPA)'] ? Math.max(0, 100 - analytics.risk_heatmap['Data Privacy (GDPR/KDPA)'] * 10) : 99 },
                    { label: 'POPIA/SADC (South Africa)', val: 84 }
                  ].map(readiness => (
                    <div key={readiness.label}>
                      <div className="flex justify-between text-xs font-bold mb-2">
                        <span className="text-indigo-200">{readiness.label}</span>
                        <span>{readiness.val}%</span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full transition-all duration-1000"
                          style={{ width: `${readiness.val}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-10 p-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
                  <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest mb-1">AI Recommendation</p>
                  <p className="text-xs leading-relaxed text-indigo-50">"Update your HIPAA Sub-processor addendums to reach 100% readiness across global markets."</p>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </motion.div>
  )
}
