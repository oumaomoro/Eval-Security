import React, { useState, useEffect } from 'react'
import { ShieldCheck, AlertCircle, CheckCircle, ArrowRight, Play, BarChart3, Database, Globe, Search } from 'lucide-react'
import { api } from '../utils/api'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

export default function Compliance() {
  const [activeTab, setActiveTab] = useState('overview') // 'overview' | 'dpo_matrix'
  const [audits, setAudits] = useState([])
  const [tasks, setTasks] = useState([])
  const [contracts, setContracts] = useState([])
  const [dpoContacts, setDpoContacts] = useState([])
  const [dpoTasks, setDpoTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)

  // DPO Matrix State
  const [selectedContract, setSelectedContract] = useState('')
  const [selectedFramework, setSelectedFramework] = useState('GDPR')
  const [matrixData, setMatrixData] = useState(null)
  const [generatingMatrix, setGeneratingMatrix] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [auditsRes, tasksRes, contractsRes, dpoRes, dpoTasksRes] = await Promise.all([
          api.get('/compliance/audits'),
          api.get('/compliance/remediation'),
          api.get('/contracts'),
          api.get('/compliance/dpo/contacts'),
          api.get('/compliance/dpo/tasks')
        ])
        setAudits(auditsRes.data || [])
        setTasks(tasksRes.data || [])
        setContracts(contractsRes.data || [])
        setDpoContacts(dpoRes.data || [])
        setDpoTasks(dpoTasksRes.data || [])
      } catch (err) {
        console.error('Error fetching compliance data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const runAudit = async () => {
    setRunning(true)
    try {
      await api.post('/compliance/audits/run', { name: 'Manual KDPA Audit', standards: ['KDPA', 'GDPR'] })
      const res = await api.get('/compliance/audits')
      setAudits(res.data)
    } finally {
      setTimeout(() => setRunning(false), 2000)
    }
  }

  const generateMatrix = async () => {
    if (!selectedContract) return;
    setGeneratingMatrix(true);
    setMatrixData(null);
    try {
      const res = await api.post(`/compliance/matrix/${selectedContract}`, { framework: selectedFramework });
      setMatrixData(res.data);
    } catch (err) {
      console.error('Matrix gen failed', err);
    } finally {
      setGeneratingMatrix(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 dark:border-white"></div>
      </div>
    )
  }

  const chartData = audits.map(a => ({
    name: a.audit_name.split(' ')[0],
    score: a.overall_compliance_score
  })).reverse()

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Compliance & DPO Center</h1>
          <p className="text-slate-500 mt-2">Monitor regulatory adherence and execute exact framework mappings.</p>
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'overview' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
          >
            Audits
          </button>
          <button
            onClick={() => setActiveTab('dpo_matrix')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${activeTab === 'dpo_matrix' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
          >
            Frameworks
          </button>
          <button
            onClick={() => setActiveTab('governance')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${activeTab === 'governance' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
          >
            <ShieldCheck size={16} /> DPO Governance
          </button>
        </div>
      </div>

      {activeTab === 'overview' ? (
        <>
          {/* Top Quick Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                  <ShieldCheck className="text-emerald-600 dark:text-emerald-400" size={24} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Avg Baseline Health</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">
                    {audits.length > 0 ? (audits.reduce((acc, a) => acc + a.overall_compliance_score, 0) / audits.length).toFixed(1) : 0}%
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/30 rounded-xl flex items-center justify-center">
                  <AlertCircle className="text-rose-600 dark:text-rose-400" size={24} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Open DPO Tasks</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">{tasks.filter(t => t.status !== 'completed').length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-blue-600 flex flex-col justify-center">
              <button
                onClick={runAudit}
                disabled={running}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-sm disabled:opacity-50"
              >
                {running ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <Play size={18} fill="currentColor" />}
                {running ? 'Running Scan...' : 'Run Point-in-Time Audit'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
              <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
                <h3 className="font-semibold text-slate-900 dark:text-white">Audit History</h3>
              </div>
              <div className="divide-y divide-slate-50 dark:divide-slate-800">
                {audits.map(audit => (
                  <div key={audit.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-between">
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">{audit.audit_name}</div>
                      <div className="text-sm text-slate-500 mt-1">
                        {audit.status === 'completed' ? `Score: ${audit.overall_compliance_score}%` : 'Analysis in progress...'}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase ${audit.status === 'completed' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        }`}>
                        {audit.status}
                      </span>
                      <ArrowRight size={16} className="text-slate-300" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
              <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
                <h3 className="font-semibold text-slate-900 dark:text-white">Priority Remediation</h3>
              </div>
              <div className="divide-y divide-slate-50 dark:divide-slate-800">
                {tasks.map(task => (
                  <div key={task.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-start gap-4">
                    <div className={`mt-1 h-3 w-3 rounded-full flex-shrink-0 ${task.severity === 'critical' ? 'bg-rose-500' :
                      task.severity === 'high' ? 'bg-amber-500' : 'bg-blue-500'
                      }`} />
                    <div className="flex-1">
                      <div className="font-medium text-slate-900 dark:text-white text-sm leading-relaxed">{task.description}</div>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs font-medium text-slate-500">Due {task.due_date}</span>
                        <span className="text-[10px] font-bold uppercase text-blue-500">{task.status.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : activeTab === 'dpo_matrix' ? (
        /* DPO REGULATORY HEATMAP TAB */
        <div className="animate-in slide-in-from-right-4 duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-sm border border-slate-100 dark:border-slate-800 mb-8">
            <div className="flex flex-col lg:flex-row gap-6 items-end">
              <div className="flex-1 w-full">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Target Contract</label>
                <select
                  value={selectedContract}
                  onChange={e => setSelectedContract(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
                >
                  <option value="">Select a vendor agreement...</option>
                  {contracts.map(c => (
                    <option key={c.id} value={c.id}>{c.vendor_name || 'Unknown Vendor'} - {c.contract_type}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1 w-full">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Legal Framework</label>
                <select
                  value={selectedFramework}
                  onChange={e => setSelectedFramework(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
                >
                  <option value="GDPR">GDPR (EU) - General Data Protection Regulation</option>
                  <option value="CCPA">CCPA (California) - Privacy Act</option>
                  <option value="PIPEDA">PIPEDA (Canada) - Personal Information Protection</option>
                  <option value="APPI">APPI (Japan) - Act on Information Protection</option>
                  <option value="LGPD">LGPD (Brazil) - Lei Geral de Proteção de Dados</option>
                  <option value="SOC2">SOC 2 Type II - Security Controls</option>
                </select>
              </div>
              <button
                onClick={generateMatrix}
                disabled={generatingMatrix || !selectedContract}
                className="w-full lg:w-auto px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {generatingMatrix ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <Search size={18} />}
                Map Framework
              </button>
            </div>
          </div>

          {matrixData && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
              <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                <div>
                  <h3 className="font-bold text-xl text-slate-900 dark:text-white flex items-center gap-2">
                    <Database size={20} className="text-blue-500" />
                    {matrixData.framework} Mapping Matrix
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">AI-powered granular clause alignment generated in real-time.</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black text-slate-900 dark:text-white">
                    {matrixData.overall_readiness_score}<span className="text-lg text-slate-400 font-medium">/100</span>
                  </div>
                  <div className="text-xs uppercase font-bold text-slate-400 tracking-wider">Readiness Score</div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950/50">
                      <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider w-32">Control ID</th>
                      <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Requirement</th>
                      <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider w-32 text-center">Status</th>
                      <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider w-1/3">Remediation Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {matrixData.matrix.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="p-4 font-mono text-xs text-slate-500 dark:text-slate-400">{row.control_id}</td>
                        <td className="p-4 font-medium text-slate-900 dark:text-slate-200">{row.requirement_name}</td>
                        <td className="p-4 text-center">
                          <span className={`inline-block px-3 py-1 rounded-full text-[10px] uppercase font-black tracking-widest ${row.status === 'compliant' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                            row.status === 'partial' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                              'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                            }`}>
                            {row.status}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-slate-600 dark:text-slate-400">
                          {row.remediation_action || <span className="text-slate-300 dark:text-slate-700 italic">No action required</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* DPO GOVERNANCE TAB */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <ShieldCheck className="text-blue-500" size={18} /> Appointed DPO Contact
              </h3>
              {dpoContacts.length > 0 ? (
                <div className="space-y-4">
                  {dpoContacts.map(contact => (
                    <div key={contact.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                      <p className="font-bold text-slate-900 dark:text-white">{contact.name}</p>
                      <p className="text-sm text-slate-500">{contact.email}</p>
                      <p className="text-xs text-slate-400 mt-1">Assigned: {new Date(contact.assigned_date).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <button
                  onClick={async () => {
                    const name = prompt("DPO Full Name:");
                    const email = prompt("DPO Email:");
                    if (name && email) {
                      const res = await api.post('/compliance/dpo/contacts', { name, email });
                      setDpoContacts([...dpoContacts, res.data]);
                    }
                  }}
                  className="w-full py-3 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 hover:text-blue-500 hover:border-blue-500 transition-all text-sm font-bold"
                >
                  + Appoint DPO Officer
                </button>
              )}
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white mb-4">Governance Health</h3>
              <div className="space-y-4">
                <div className="flex justify-between text-xs font-bold uppercase text-slate-400 mb-1">
                  <span>GDPR Mapping</span>
                  <span>85%</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 w-[85%]"></div>
                </div>
                <div className="flex justify-between text-xs font-bold uppercase text-slate-400 mb-1">
                  <span>Policy Coverage</span>
                  <span>92%</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-[92%]"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
              <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">DPO Governance Tasks</h3>
                  <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-bold">Priority Action Matrix</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={async () => {
                      const contact = dpoContacts[0] || { name: 'DPO', email: user?.email };
                      const vendorName = prompt("System/Vendor for Alert:", "Critical Infrastructure");
                      const riskLevel = prompt("Risk Level:", "Immediate/Critical");
                      const actionRequired = prompt("Action Required:", "Emergency DPA Audit");
                      if (vendorName && riskLevel && actionRequired) {
                        try {
                          await api.post('/compliance/dpo/alert', {
                            dpoEmail: contact.email,
                            dpoName: contact.name,
                            vendorName,
                            riskLevel,
                            actionRequired
                          });
                          alert(`Global Compliance Alert dispatched to ${contact.name}`);
                        } catch (err) {
                          alert("Failed to send alert. Check console.");
                        }
                      }
                    }}
                    className="px-4 py-2 bg-rose-600 text-white text-xs font-black rounded-xl hover:bg-rose-700 transition-all shadow-lg shadow-rose-900/20 flex items-center gap-2 animate-pulse-glow"
                  >
                    <AlertCircle size={14} /> Dispatch System Alert
                  </button>
                  <span className="text-xs font-bold text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full uppercase tracking-wider">
                    {dpoTasks.filter(t => t.status !== 'completed').length} Pending
                  </span>
                </div>
              </div>
              <div className="divide-y divide-slate-50 dark:divide-slate-800">
                {dpoTasks.length > 0 ? dpoTasks.map(task => {
                  const contact = dpoContacts[0] || { name: 'DPO', email: 'dpo@company.com' };
                  return (
                    <div key={task.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-between">
                      <div className="flex items-start gap-4">
                        <div className={`mt-1 h-3 w-3 rounded-full flex-shrink-0 ${task.priority === 'critical' ? 'bg-rose-500' : task.priority === 'high' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{task.title}</p>
                          <p className="text-sm text-slate-500 mt-1">{task.description}</p>
                          <p className="text-[10px] font-black uppercase text-slate-400 mt-2">Due: {task.due_date}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={async () => {
                            const vendorName = prompt("Vendor Name for Alert:", "Unknown Vendor");
                            const riskLevel = prompt("Risk Level:", "High");
                            const actionRequired = prompt("Action Required:", "Full DPA Review");
                            if (vendorName && riskLevel && actionRequired) {
                              try {
                                await api.post('/compliance/dpo/alert', {
                                  dpoEmail: contact.email,
                                  dpoName: contact.name,
                                  vendorName,
                                  riskLevel,
                                  actionRequired
                                });
                                alert(`Compliance alert sent to ${contact.name}`);
                              } catch (err) {
                                alert("Failed to send alert. Check console.");
                              }
                            }
                          }}
                          className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors"
                          title="Send Urgent Compliance Alert"
                        >
                          <AlertCircle size={20} />
                        </button>
                        <button
                          onClick={async () => {
                            const nextStatus = task.status === 'completed' ? 'todo' : 'completed';
                            await api.patch(`/compliance/dpo/tasks/${task.id}`, { status: nextStatus });
                            setDpoTasks(dpoTasks.map(t => t.id === task.id ? { ...t, status: nextStatus } : t));
                          }}
                          className={`p-2 rounded-lg transition-colors ${task.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400 hover:bg-blue-100 hover:text-blue-600'}`}
                        >
                          <CheckCircle size={20} />
                        </button>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="p-12 text-center text-slate-500 italic">No governance tasks assigned yet.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
