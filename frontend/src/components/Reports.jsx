import React, { useState, useEffect } from 'react'
import { FileText, Plus, Download, Clock, CheckCircle, Loader, Calendar, Star, Shield, DollarSign, AlertTriangle, Briefcase, Zap } from 'lucide-react'
import { api } from '../utils/api'
import { useAuth } from '../contexts/AuthContext'
import { generateBrandedPdf } from '../utils/pdfService'

const REPORT_ICONS = { shield: Shield, alert: AlertTriangle, dollar: DollarSign, calendar: Calendar, star: Star }

export default function Reports() {
  const [reports, setReports] = useState([])
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [showBuilder, setShowBuilder] = useState(false)
  const { user } = useAuth()
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [reportName, setReportName] = useState('')
  const [payingForExport, setPayingForExport] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [repRes, tplRes] = await Promise.all([
          api.get('/reports'),
          api.get('/reports/templates')
        ])
        setReports(repRes.data)
        setTemplates(tplRes.data)
      } catch (err) {
        console.error('Failed to fetch reports:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleGenerate = async () => {
    if (!selectedTemplate) return
    setGenerating(true)
    try {
      const res = await api.post('/reports/generate', {
        template_id: selectedTemplate.id,
        name: reportName || selectedTemplate.name,
        scope: {}
      })
      setReports(prev => [res.data, ...prev])
      setShowBuilder(false)
      setSelectedTemplate(null)
      setReportName('')
    } catch (err) {
      console.error('Report generation failed:', err)
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Reports</h1>
          <p className="text-slate-500 mt-2">Generate AI-powered compliance, risk, and savings reports on demand.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              const token = localStorage.getItem('cyberoptimize_token');
              window.open(`${import.meta.env.VITE_API_URL}/reports/export/audit-pack?token=${token}`, '_blank');
            }}
            className="flex items-center gap-2 px-6 py-3 bg-blue-50 text-blue-700 border border-blue-100 rounded-xl hover:bg-blue-100 transition-all font-bold text-sm"
          >
            <Download size={18} />
            Audit Pack (.zip)
          </button>
          <button
            onClick={() => setShowBuilder(!showBuilder)}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all shadow-sm font-semibold text-sm"
          >
            <Plus size={18} />
            New Report
          </button>
        </div>
      </div>

      {/* Enterprise Portfolio Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-700"></div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Portfolio Readiness</p>
          <div className="flex items-end gap-2">
            <h3 className="text-3xl font-black text-slate-900 dark:text-white">74.2%</h3>
            <span className="text-emerald-500 text-xs font-bold mb-1">+5.2%</span>
          </div>
          <div className="mt-4 h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
             <div className="bg-blue-600 h-full w-[74.2%] rounded-full shadow-[0_0_10px_rgba(37,99,235,0.3)]"></div>
          </div>
        </div>

        <div className="bg-white/70 dark:bg-slate-900/40 backdrop-blur-md p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-700"></div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Critical Exceptions</p>
          <div className="flex items-end gap-2">
            <h3 className="text-3xl font-black text-slate-900 dark:text-white">12</h3>
            <span className="text-rose-500 text-xs font-bold mb-1">Action Required</span>
          </div>
          <div className="mt-4 flex gap-1">
             {[...Array(5)].map((_, i) => <div key={i} className={`h-1.5 flex-1 rounded-full ${i < 3 ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]' : 'bg-slate-100 dark:bg-slate-800'}`} />)}
          </div>
        </div>

        <div className="bg-slate-950/90 backdrop-blur-xl p-6 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-700"></div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Strategic Risk Heatmap</p>
          <div className="grid grid-cols-4 gap-2">
            {[...Array(12)].map((_, i) => (
              <div 
                key={i} 
                className={`h-6 rounded-md transition-all duration-500 hover:scale-110 cursor-help ${
                  i % 5 === 0 ? 'bg-rose-500/80 shadow-[0_0_8px_rgba(244,63,94,0.4)]' : 
                  i % 3 === 0 ? 'bg-amber-500/60' : 'bg-emerald-500/40'
                }`}
                title={i % 5 === 0 ? 'Critical Risk: Health-UK' : 'Aligned: Fintech-EU'}
              ></div>
            ))}
          </div>
          <div className="flex justify-between mt-4 text-[9px] font-black text-slate-400 tracking-tighter uppercase">
             <span>IRA (Insurance)</span>
             <span>CMA (Capital)</span>
             <span>POPIA (SADC)</span>
             <span>KDPA (KE)</span>
          </div>
        </div>
      </div>

      {/* Report Builder */}
      {showBuilder && (
        <div className="mb-8 bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-2xl border border-blue-100 p-6 shadow-sm">
          <h3 className="font-semibold text-slate-900 mb-5">Choose a Report Template</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {templates.map(tpl => {
              const Icon = REPORT_ICONS[tpl.icon] || FileText
              return (
                <button
                  key={tpl.id}
                  onClick={() => setSelectedTemplate(tpl)}
                  className={`p-4 rounded-xl border text-left transition-all ${selectedTemplate?.id === tpl.id ? 'bg-white border-blue-500 shadow-md' : 'bg-white/60 border-slate-200 hover:border-slate-300'}`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${selectedTemplate?.id === tpl.id ? 'bg-blue-50' : 'bg-slate-100'}`}>
                    <Icon size={17} className={selectedTemplate?.id === tpl.id ? 'text-blue-600' : 'text-slate-500'} />
                  </div>
                  <p className="font-semibold text-sm text-slate-900">{tpl.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{tpl.description}</p>
                </button>
              )
            })}
          </div>
          {selectedTemplate && (
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                placeholder={`Report name (default: ${selectedTemplate.name})`}
                className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-all disabled:opacity-60 flex items-center gap-2 flex-shrink-0"
              >
                {generating ? (
                  <><Loader size={16} className="animate-spin" /> Generating...</>
                ) : (
                  <>Generate Report</>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Report History */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Report History</h3>
          <span className="text-xs text-slate-400">{reports.length} reports total</span>
        </div>
        <div className="divide-y divide-slate-50">
          {reports.map(report => (
            <div key={report.id} className="px-6 py-5 flex items-center gap-4 hover:bg-slate-50/50 transition-colors group">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                report.status === 'completed' ? 'bg-emerald-50' :
                report.status === 'generating' ? 'bg-blue-50' : 'bg-slate-100'
              }`}>
                {report.status === 'completed' && <CheckCircle size={18} className="text-emerald-600" />}
                {report.status === 'generating' && <Loader size={18} className="text-blue-600 animate-spin" />}
                {report.status === 'scheduled' && <Clock size={18} className="text-slate-400" />}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-900 text-sm">{report.report_name}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <p className="text-xs text-slate-500 capitalize">{report.report_type?.replace(/_/g, ' ')}</p>
                  {report.pages && <span className="text-xs text-slate-400">{report.pages} pages</span>}
                  {report.generated_by && <span className="text-xs text-slate-400">by {report.generated_by}</span>}
                </div>
              </div>
              <div className="text-right">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  report.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                  report.status === 'generating' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  {report.status}
                </span>
                <p className="text-xs text-slate-400 mt-1">
                  {report.created_at ? new Date(report.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }) :
                    report.scheduled_for ? `Scheduled ${new Date(report.scheduled_for).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : ''}
                </p>
              </div>
              {report.status === 'completed' && (
                <div className="flex gap-2">
                  <button 
                    onClick={async () => {
                      if (user?.tier === 'enterprise' || user?.tier === 'pro' || user?.tier === 'admin') {
                        const token = localStorage.getItem('cyberoptimize_token');
                        window.open(`${import.meta.env.VITE_API_URL}/reports/${report.id}/strategic-brief?token=${token}`, '_blank');
                        return;
                      }

                      if (user?.tier === 'starter') {
                        if (window.confirm("Strategic Pack Export: This premium PDF summary requires a one-time $5.00 fee for Starter plans. Proceed to payment?")) {
                          setPayingForExport(true);
                          try {
                            const res = await api.post('/billing/charge-export');
                            if (res.data.allowed) {
                              const token = localStorage.getItem('cyberoptimize_token');
                              window.open(`${import.meta.env.VITE_API_URL}/reports/${report.id}/strategic-brief?token=${token}`, '_blank');
                            } else if (res.data.clientSecret) {
                              // In a real app, open Stripe Elements/PayPal here
                              alert("Redirecting to secure payment gateway ($5.00)...");
                              // Mock success for this demo flow
                              const token = localStorage.getItem('cyberoptimize_token');
                              window.open(`${import.meta.env.VITE_API_URL}/reports/${report.id}/strategic-brief?token=${token}`, '_blank');
                            }
                          } catch (err) {
                            alert("Charge failed: " + (err.response?.data?.error || err.message));
                          } finally {
                            setPayingForExport(false);
                          }
                        }
                      } else {
                        alert("Please upgrade to Starter or higher to download Strategic Packs.");
                      }
                    }}
                    disabled={payingForExport}
                    className={`p-2 rounded-lg border transition-all shadow-sm ${
                      (user?.tier === 'enterprise' || user?.tier === 'pro' || user?.tier === 'starter' || user?.tier === 'admin') 
                        ? 'hover:bg-amber-50 text-amber-600 border-amber-100' 
                        : 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
                    }`}
                  >
                    {payingForExport ? <Loader size={16} className="animate-spin" /> : <Briefcase size={16} />}
                  </button>
                  <button 
                    onClick={() => {
                      const branding = JSON.parse(localStorage.getItem('cyberoptimize_branding') || '{}');
                      generateBrandedPdf(report, branding);
                    }}
                    className="p-2 opacity-0 group-hover:opacity-100 hover:bg-white rounded-lg border border-transparent hover:border-slate-100 transition-all text-slate-400 hover:text-blue-600 shadow-sm"
                  >
                    <Download size={16} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
