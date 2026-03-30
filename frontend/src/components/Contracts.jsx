import React, { useEffect, useState } from 'react'
import { Search, Filter, ShieldAlert, CheckCircle2, ChevronRight, X, Clock, FileText, Activity, Zap, Download, CheckCircle } from 'lucide-react'
import { api } from '../utils/api'
import { generateRiskScorecardPdf } from '../utils/pdfService'
import { exportRedlinesToWord, getWordBlob } from '../utils/wordService'
import ClauseDiffViewer from './ClauseDiffViewer'

export default function Contracts() {
  const [contracts, setContracts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  // Detailed View State for Phase 11.3 (SOC 2 Readiness)
  const [selectedContract, setSelectedContract] = useState(null)
  const [auditLogs, setAuditLogs] = useState([])
  const [loadingAudits, setLoadingAudits] = useState(false)
  const [sendingSignnow, setSendingSignnow] = useState(false)
  const [signnowUrl, setSignnowUrl] = useState(null)
  const [isSignnowModalOpen, setIsSignnowModalOpen] = useState(false)

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        const json = await api.get('/contracts')
        setContracts(Array.isArray(json.data) ? json.data : [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchContracts()
  }, [])

  const handleSelectContract = async (contract) => {
    setSelectedContract(contract)
    setLoadingAudits(true)
    try {
      const res = await api.get(`/contracts/${contract.id}/audit`)
      setAuditLogs(res.data || [])
    } catch (err) {
      console.error('Failed to fetch audit logs', err)
    } finally {
      setLoadingAudits(false)
    }
  }

  const closeDetails = () => {
    setSelectedContract(null)
    setAuditLogs([])
  }

  const handleSignNowInvite = async (contract) => {
    const email = prompt("Enter the Signer Email for embedded signing:");
    if (!email) return;

    setSendingSignnow(true);
    try {
      const res = await api.post('/signnow/embedded', {
        contract_id: contract.id,
        signer_email: email
      });
      
      if (res.data?.embedded_url) {
        setSignnowUrl(res.data.embedded_url);
        setIsSignnowModalOpen(true);
      } else {
        alert("SignNow invite sent via email (Legacy mode). Status: " + res.data?.status);
      }
    } catch (err) {
      console.error(err);
      alert(`SignNow Integration failed: ${err.message || 'Unknown Error'}`);
    } finally {
      setSendingSignnow(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 dark:border-white"></div>
      </div>
    )
  }

  const filteredContracts = contracts.filter(c => 
    c.vendor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.product_service?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500 relative">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Contract Registry</h1>
          <p className="text-slate-500 mt-2">Manage all AI-analyzed vendor agreements and review immutable Chain of Custody trails.</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-rose-950/30 text-red-700 dark:text-rose-400 rounded-xl border border-red-100 dark:border-rose-900/50">
          {error}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search vendor or service..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium text-sm transition-colors">
          <Filter className="w-4 h-4" /> Filter
        </button>
      </div>

      {/* Contracts Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Vendor</th>
                <th className="px-6 py-4">Global Context</th>
                <th className="px-6 py-4">Cost Structure</th>
                <th className="px-6 py-4">Term Dates</th>
                <th className="px-6 py-4">Readiness Score</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {filteredContracts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    No contracts found. Visit the Upload tab to add new contracts.
                  </td>
                </tr>
              ) : (
                filteredContracts.map((c) => (
                  <tr 
                    key={c.id} 
                    onClick={() => handleSelectContract(c)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900 dark:text-white">{c.vendor_name}</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400 block max-w-[150px] truncate" title={c.file_name}>
                        {c.file_name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-900 dark:text-slate-200 text-sm font-bold uppercase tracking-tight">{c.detected_sector || 'General'}</div>
                      <div className="text-[10px] text-blue-500 font-bold mt-1 uppercase px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 rounded inline-block">
                        {c.detected_jurisdiction || 'Global'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900 dark:text-slate-200">${(c.annual_cost || 0).toLocaleString()} / yr</div>
                      <div className="text-sm text-slate-500 capitalize">{c.payment_frequency} billing</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-900 dark:text-slate-300 text-sm font-medium border-l-2 border-emerald-500 pl-2">Start: {c.contract_start_date}</div>
                      <div className="text-amber-600 text-sm font-medium mt-1 border-l-2 border-amber-500 pl-2">Renews: {c.renewal_date}</div>
                      {c.status === 'pending' && (
                        <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] font-black uppercase rounded border border-amber-200 dark:border-amber-800/50">
                          <Clock size={10} /> Pending Approval
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="relative inline-flex items-center justify-center">
                        <svg className="w-12 h-12 transform -rotate-90">
                          <circle
                            cx="24"
                            cy="24"
                            r="20"
                            stroke="currentColor"
                            strokeWidth="3"
                            fill="transparent"
                            className="text-slate-100 dark:text-slate-800"
                          />
                          <circle
                            cx="24"
                            cy="24"
                            r="20"
                            stroke="currentColor"
                            strokeWidth="3"
                            fill="transparent"
                            strokeDasharray={`${(c.ai_analysis?.compliance_readiness || 0) * 1.25}, 1000`}
                            className="text-blue-600 dark:text-blue-400 transition-all duration-1000"
                          />
                        </svg>
                        <span className="absolute text-[10px] font-black text-slate-900 dark:text-white">
                          {c.ai_analysis?.compliance_readiness || 0}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 text-slate-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronRight size={20} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sliding Details Panel (SOC 2 Chain of Custody) */}
      {selectedContract && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/20 dark:bg-black/40 backdrop-blur-sm transition-all animate-in fade-in">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right-8 overflow-y-auto">
            <div className="sticky top-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800 p-6 flex items-center justify-between z-10">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{selectedContract.vendor_name}</h2>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{selectedContract.product_service}</p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={closeDetails} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-300">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-8 space-y-8">
              {/* Action Bar */}
              <div className="flex gap-2 w-full">
                <button 
                  onClick={() => generateRiskScorecardPdf(selectedContract)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2 shadow-lg"
                >
                  <Download size={14} /> Board Scorecard
                </button>
                <button 
                  onClick={() => exportRedlinesToWord(selectedContract)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2 shadow-lg"
                >
                  <FileText size={14} /> Export to Word
                </button>
                <button 
                  onClick={() => handleSignNowInvite(selectedContract)}
                  disabled={sendingSignnow || selectedContract.status === 'pending'}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2 shadow-lg ml-auto disabled:opacity-50"
                  title={selectedContract.status === 'pending' ? 'Requires Admin Approval' : ''}
                >
                  {sendingSignnow ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <CheckCircle size={14} /> 
                  )}
                  {sendingSignnow ? 'Preparing Session...' : 'Request Signature'}
                </button>
              </div>

              {selectedContract.status === 'pending' && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 p-6 rounded-3xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-amber-100 dark:bg-amber-800 rounded-2xl text-amber-600 dark:text-amber-400">
                      <ShieldAlert size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">Awaiting Corporate Approval</h4>
                      <p className="text-xs text-slate-500">This contract must be reviewed and approved by an administrator before it can be sent for signature.</p>
                    </div>
                  </div>
                  {user?.role === 'admin' && (
                    <button 
                      onClick={async () => {
                        try {
                          await api.patch(`/contracts/${selectedContract.id}`, { status: 'active' });
                          setSelectedContract({ ...selectedContract, status: 'active' });
                          setContracts(contracts.map(c => c.id === selectedContract.id ? { ...c, status: 'active' } : c));
                        } catch (err) { alert(err.message); }
                      }}
                      className="px-6 py-2.5 bg-slate-900 dark:bg-amber-600 text-white text-xs font-black uppercase rounded-xl hover:shadow-xl transition-all"
                    >
                      Approve Contract
                    </button>
                  )}
                </div>
              )}

              {/* Compliance Readiness Score (Phase 11.5) */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-slate-500 uppercase">Compliance Readiness</span>
                  <span className="text-2xl font-black text-blue-600 dark:text-blue-400">{selectedContract.ai_analysis?.compliance_readiness || 0}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-blue-600 h-full transition-all duration-1000" 
                    style={{ width: `${selectedContract.ai_analysis?.compliance_readiness || 0}%` }}
                  ></div>
                </div>
              </div>

              {/* Categorized Findings & Gap Analysis */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-6 flex items-center gap-2">
                  <ShieldAlert size={16} /> Categorical Risk Analysis
                </h3>
                
                {selectedContract.ai_analysis?.categorized_findings?.length > 0 ? (
                  <div className="space-y-6">
                    {['security', 'legal', 'compliance', 'financial'].map(cat => {
                      const catFindings = selectedContract.ai_analysis.categorized_findings.filter(f => f.category === cat);
                      if (catFindings.length === 0) return null;
                      
                      return (
                        <div key={cat} className="space-y-4">
                          <div className="flex items-center gap-2">
                             <div className={`w-2 h-2 rounded-full ${cat === 'legal' ? 'bg-blue-500' : cat === 'security' ? 'bg-red-500' : 'bg-emerald-500'}`} />
                             <span className="text-xs font-bold uppercase tracking-widest text-slate-500">{cat}</span>
                          </div>
                          
                          {catFindings.map((f, i) => (
                            <div key={i} className="group relative bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all">
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-bold text-slate-900 dark:text-white text-sm">{f.title}</h4>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${f.severity === 'critical' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                  {f.severity}
                                </span>
                              </div>
                              <p className="text-sm text-slate-500 leading-relaxed mb-4">{f.description}</p>
                              
                              {/* Original extracted verbatim moved to diff viewer block if there's a redline */}
                              {f.verbatim_text && !f.gold_standard_alignment?.suggested_redline && (
                                <div className="mt-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Extracted Verbatim</p>
                                  <p className="text-xs text-slate-700 dark:text-slate-300 italic leading-relaxed font-mono">"{f.verbatim_text}"</p>
                                </div>
                              )}
                              
                              {f.gold_standard_alignment && (
                                <div className="mt-4 bg-indigo-50/50 dark:bg-indigo-950/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
                                   <div className="flex items-center justify-between mb-2">
                                     <span className="text-[10px] font-bold text-indigo-500 uppercase">Vector Match: {f.gold_standard_alignment.standard}</span>
                                     <span className="text-[10px] font-bold text-indigo-600">{f.gold_standard_alignment.similarity}%</span>
                                   </div>
                                   <p className="text-xs text-indigo-700 dark:text-indigo-300 font-medium">
                                     <span className="font-bold">Gap Analysis:</span> {f.gold_standard_alignment.gap_analysis}
                                   </p>

                                   {f.gold_standard_alignment.suggested_redline && (
                                      <ClauseDiffViewer 
                                        originalText={f.verbatim_text} 
                                        redlineText={f.gold_standard_alignment.suggested_redline} 
                                      />
                                   )}
                                   {f.gold_standard_alignment.suggested_redline && (
                                      <button className="mt-4 w-full py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors">
                                        Adopt Mitigation into Library
                                      </button>
                                   )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-slate-600 dark:text-slate-400 text-sm italic">
                    No immediate critical risks detected by modular generative AI.
                  </div>
                )}
              </div>

              {/* Chain of Custody Timeline (Phase 11.3) */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-6 flex items-center gap-2">
                  <Activity size={16} /> Immutable Audit Trail (Chain of Custody)
                </h3>
                
                {loadingAudits ? (
                  <div className="animate-pulse space-y-4">
                    <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
                    <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
                  </div>
                ) : auditLogs.length === 0 ? (
                  <div className="text-sm text-slate-500 italic p-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center">
                    No immutable audit records found for this resource.
                  </div>
                ) : (
                  <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-3 space-y-8 pb-4">
                    {auditLogs.map((log, idx) => {
                      const dateObj = new Date(log.created_at)
                      const isRecent = idx === 0;
                      return (
                        <div key={log.id} className="relative pl-6">
                          {/* Dot marker */}
                          <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 ${isRecent ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
                          
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-black tracking-widest uppercase ${isRecent ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}>
                                {log.action_type.replace(/_/g, ' ')}
                              </span>
                              <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                                <Clock size={12} />
                                {dateObj.toLocaleString()}
                              </span>
                            </div>
                            <p className="text-sm text-slate-700 dark:text-slate-300 mt-1.5 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                              {log.description}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}


      {/* SignNow Embedded Modal */}
      {isSignnowModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-5xl h-[85vh] rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle className="text-emerald-500" size={18} /> Digital Signature Terminal
              </h3>
              <button onClick={() => setIsSignnowModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                <X size={20} className="text-slate-500" />
              </button>
            </div>
            <div className="flex-1 bg-slate-50 dark:bg-slate-950 p-2">
              <iframe 
                src={signnowUrl} 
                className="w-full h-full border-none rounded-2xl bg-white shadow-inner"
                title="SignNow Embedded Signature"
              />
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Protected by SignNow Bank-Grade Security • Session ends when window is closed
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
