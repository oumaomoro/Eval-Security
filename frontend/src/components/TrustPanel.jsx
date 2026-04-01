import React, { useState, useEffect } from 'react'
import { ShieldCheck, Lock, Globe, Database, Cpu, Zap, CheckCircle, ArrowRight, Download, Clock } from 'lucide-react'

export default function TrustPanel() {
  const [logs, setLogs] = useState([])
  const [loadingLogs, setLoadingLogs] = useState(true)

  useEffect(() => {
    async function fetchLogs() {
      try {
        const token = localStorage.getItem('token') || ''
        const url = import.meta.env.VITE_API_URL || 'http://localhost:3001'
        const res = await fetch(`${url}/api/audit/logs`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await res.json()
        if (data.success) setLogs(data.data)
      } catch (err) {
        console.error('Failed to fetch audit logs:', err)
      } finally {
        setLoadingLogs(false)
      }
    }
    fetchLogs()
  }, [])

  const certifications = [
    { name: 'SOC 2 Type II', status: 'Compliant', date: 'March 2026', icon: ShieldCheck, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { name: 'ISO 27001:2022', status: 'Audit Ready', date: 'Scheduled Q3', icon: Lock, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { name: 'GDPR / KDPA', status: 'Verified', date: 'Active', icon: Globe, color: 'text-blue-600', bg: 'bg-blue-50' }
  ]

  const technicalControls = [
    { title: 'Data Residency', desc: 'Siloed database instances with regional pinning (KE/EU).', icon: Database },
    { title: 'AES-256 Encryption', desc: 'Military-grade encryption for all contract blobs at rest.', icon: Lock },
    { title: 'Zero-Knowledge RAG', desc: 'Vectors are isolated per organization ID (MSP-grade).', icon: Cpu },
    { title: '99.9% SLA Guarantee', desc: 'Enterprise-grade uptime with multi-region failover.', icon: Zap }
  ]

  return (
    <div className="p-8 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-10">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
          Security & Trust Center
        </h1>
        <p className="text-slate-500 mt-2 text-lg">Detailed documentation of the Costloci security posture and compliance certifications.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {certifications.map((cert) => (
          <div key={cert.name} className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${cert.bg} dark:bg-opacity-10`}>
              <cert.icon className={`${cert.color} h-6 w-6`} />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1">{cert.name}</h3>
            <p className="text-sm font-bold text-slate-500 mb-4 flex items-center gap-2">
              <CheckCircle size={14} className="text-emerald-500" /> {cert.status}
            </p>
            <div className="text-[10px] uppercase font-black tracking-widest text-slate-400 bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-full inline-block">
              Since {cert.date}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-900 rounded-[2.5rem] p-12 text-white relative overflow-hidden mb-12 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-black mb-6">Enterprise-Grade <br/><span className="text-blue-400">Security Controls</span></h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {technicalControls.map((control) => (
                <div key={control.title}>
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mb-4 backdrop-blur-md">
                    <control.icon size={20} className="text-blue-300" />
                  </div>
                  <h4 className="font-bold text-lg mb-1">{control.title}</h4>
                  <p className="text-sm text-slate-400 leading-relaxed">{control.desc}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 p-8 rounded-[2rem] backdrop-blur-xl">
            <h3 className="text-xl font-bold mb-4">Request Compliance Pack</h3>
            <p className="text-sm text-slate-400 mb-6">Download our latest SOC 2 Type II summary report and penetration test executive summary.</p>
            <button className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center gap-2">
              Download Artifacts <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Lock className="text-blue-600" /> Immutable Audit Trail
          </h2>
          <button className="text-sm bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-xl flex items-center gap-2 transition-colors font-bold">
            <Download size={16} /> Export CSV
          </button>
        </div>
        
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
          {loadingLogs ? (
            <div className="p-12 text-center text-slate-400 animate-pulse">Loading immutable records...</div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center text-slate-400">No audit logs dynamically recorded yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase text-xs tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <th className="p-4 font-black">Timestamp (UTC)</th>
                    <th className="p-4 font-black">Action Event</th>
                    <th className="p-4 font-black">Description</th>
                    <th className="p-4 font-black text-right">Tracing ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {logs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="p-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                        <Clock size={14} className="text-slate-400" />
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="p-4 whitespace-nowrap text-sm font-bold text-slate-900 dark:text-white">
                        <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md text-xs">
                          {log.action_type}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-slate-600 dark:text-slate-400 max-w-md truncate">
                        {log.description}
                      </td>
                      <td className="p-4 whitespace-nowrap text-xs text-slate-400 font-mono text-right">
                        ...{log.id.slice(-8)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
