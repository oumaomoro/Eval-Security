import React, { useState, useEffect } from 'react'
import { BookOpen, GitCompare, Wand2, Shield, AlertTriangle, CheckCircle, XCircle, ChevronDown, ChevronRight, Sparkles, Zap, Lock } from 'lucide-react'
import { api } from '../utils/api'
import { useAuth } from '../contexts/AuthContext'

const CATEGORY_LABELS = {
  data_protection: 'Data Protection',
  liability: 'Liability',
  termination: 'Termination',
  sla: 'SLA / Uptime',
  security: 'Security',
}

const DEVIATION_COLORS = {
  critical: 'bg-rose-50 text-rose-700 border-rose-200',
  high: 'bg-amber-50 text-amber-700 border-amber-200',
  major: 'bg-amber-50 text-amber-700 border-amber-200',
  moderate: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  minor: 'bg-blue-50 text-blue-700 border-blue-200',
  none: 'bg-emerald-50 text-emerald-700 border-emerald-200',
}

export default function ClauseIntelligence() {
  const { user } = useAuth()
  const isPro = user?.tier !== 'free'
  const [tab, setTab] = useState('library')
  const [library, setLibrary] = useState([])
  const [comparison, setComparison] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [generatedClause, setGeneratedClause] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [expandedClause, setExpandedClause] = useState(null)
  const [genForm, setGenForm] = useState({ category: 'data_protection', standards: ['KDPA'], tone: 'balanced', requirements: '' })
  
  // Custom RAG state
  const [customClauses, setCustomClauses] = useState(user?.user_metadata?.custom_clauses || [])
  const [newCustomClause, setNewCustomClause] = useState({ name: '', category: 'liability', text: '' })
  const [isSavingCustom, setIsSavingCustom] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [libRes, compRes] = await Promise.all([
          api.get('/clauses/library'),
          api.get('/clauses/compare/cont-1')
        ])
        setLibrary(libRes.data)
        setComparison(compRes.data)
      } catch (err) {
        console.error('Failed to fetch clause data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleGenerate = async () => {
    setGenerating(true)
    setGeneratedClause(null)
    try {
      const res = await api.post('/clauses/generate', genForm)
      setGeneratedClause(res.data)
    } catch (err) {
      console.error('Generation failed:', err)
    } finally {
      setGenerating(false)
    }
  }

  const handleSaveCustomClause = async () => {
    if (!newCustomClause.name || !newCustomClause.text) return;
    setIsSavingCustom(true);
    try {
      const updatedClauses = [...customClauses, { id: Date.now().toString(), ...newCustomClause }];
      const { error } = await api.post('/auth/update', { user_metadata: { custom_clauses: updatedClauses } }).catch(async () => {
         // fallback if /auth/update doesn't exist
         const { supabase } = await import('../utils/supabaseClient');
         return await supabase.auth.updateUser({ data: { custom_clauses: updatedClauses } });
      });
      setCustomClauses(updatedClauses);
      setNewCustomClause({ name: '', category: 'liability', text: '' });
      alert('Custom Standard Clause saved successfully. The RAG engine will now prioritize this.');
    } catch (err) {
      console.error(err);
      alert('Failed to save custom clause.');
    } finally {
      setIsSavingCustom(false);
    }
  }

  const handleDeleteCustomClause = async (id) => {
    const updatedClauses = customClauses.filter(c => c.id !== id);
    try {
      const { supabase } = await import('../utils/supabaseClient');
      await supabase.auth.updateUser({ data: { custom_clauses: updatedClauses } });
      setCustomClauses(updatedClauses);
    } catch (err) { }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    )
  }

  const filteredLibrary = selectedCategory === 'all' ? library : library.filter(c => c.clause_category === selectedCategory)

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Clause Intelligence</h1>
        <p className="text-slate-500 mt-2">AI-powered clause library, contract comparison engine, and clause generation.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-8 w-fit">
        {[
          { id: 'library', label: 'Global Standard Library', icon: BookOpen },
          { id: 'custom', label: 'My Custom RAG', icon: Shield },
          { id: 'compare', label: 'Compare Contract', icon: GitCompare },
          { id: 'generate', label: 'AI Generator', icon: Wand2 },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              tab === t.id ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <t.icon size={16} />
            {t.label}
          </button>
        ))}
      </div>

      {/* CLAUSE LIBRARY TAB */}
      {tab === 'library' && (
        <div>
          <div className="flex gap-2 mb-6 flex-wrap">
            {['all', 'data_protection', 'liability', 'termination', 'sla'].map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition-all border ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white border-transparent'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                {cat === 'all' ? 'All Clauses' : CATEGORY_LABELS[cat] || cat}
              </button>
            ))}
          </div>
          <div className="space-y-4">
            {filteredLibrary.map(clause => (
              <div key={clause.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <button
                  onClick={() => setExpandedClause(expandedClause === clause.id ? null : clause.id)}
                  className="w-full px-6 py-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-center gap-4 text-left">
                    <div className={`p-2 rounded-xl ${clause.risk_level_if_missing === 'critical' ? 'bg-rose-50' : 'bg-amber-50'}`}>
                      <Shield size={18} className={clause.risk_level_if_missing === 'critical' ? 'text-rose-600' : 'text-amber-600'} />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{clause.clause_name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-500 capitalize">{CATEGORY_LABELS[clause.clause_category] || clause.clause_category}</span>
                        {clause.is_mandatory && (
                          <span className="px-1.5 py-0.5 bg-rose-50 text-rose-600 rounded text-[10px] font-bold uppercase">Mandatory</span>
                        )}
                        {clause.applicable_standards.map(s => (
                          <span key={s} className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-semibold">{s}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  {expandedClause === clause.id ? <ChevronDown size={18} className="text-slate-400" /> : <ChevronRight size={18} className="text-slate-400" />}
                </button>
                {expandedClause === clause.id && (
                  <div className="px-6 pb-6 border-t border-slate-50">
                    <p className="text-sm text-slate-600 mt-4 leading-relaxed bg-slate-50 rounded-xl p-4 font-mono">
                      {clause.standard_language}
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      <span className="text-xs text-slate-400">Jurisdiction:</span>
                      <span className="text-xs font-semibold text-slate-600 capitalize">{clause.jurisdiction.replace('_', ' ')}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CUSTOM RAG TAB */}
      {tab === 'custom' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-white rounded-2xl p-6 shadow-sm border border-slate-100 h-fit">
            <h3 className="font-semibold text-slate-900 mb-2">Create Custom Standard</h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">Add your organization's specific fallback language for rigorous RAG tuning. CyberOptimize will prioritize this over Global standards.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Clause Name</label>
                <input 
                  type="text" 
                  value={newCustomClause.name}
                  onChange={e => setNewCustomClause(prev => ({...prev, name: e.target.value}))}
                  placeholder="e.g. Acme Corp Maximum Liability Cap"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Category</label>
                <select 
                  value={newCustomClause.category}
                  onChange={e => setNewCustomClause(prev => ({...prev, category: e.target.value}))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="data_protection">Data Protection</option>
                  <option value="liability">Liability</option>
                  <option value="termination">Termination</option>
                  <option value="security">Security / Audit</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Verified Language</label>
                <textarea 
                  value={newCustomClause.text}
                  onChange={e => setNewCustomClause(prev => ({...prev, text: e.target.value}))}
                  placeholder="Paste your exact legal language here..."
                  rows={6}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none font-mono"
                />
              </div>
              <button 
                onClick={handleSaveCustomClause}
                disabled={isSavingCustom || !newCustomClause.name || !newCustomClause.text}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl transition-colors disabled:opacity-50"
              >
                {isSavingCustom ? 'Saving to RAG Database...' : 'Save Custom Standard'}
              </button>
            </div>
          </div>
          
          <div className="lg:col-span-2">
            <h3 className="font-semibold text-slate-900 mb-4">Enterprise Custom Library</h3>
            {customClauses.length === 0 ? (
              <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-12 text-center text-slate-500 text-sm">
                No custom clauses mapped to your organization yet.<br/>Create one to aggressively tune your contract analysis.
              </div>
            ) : (
              <div className="space-y-4">
                {customClauses.map(c => (
                  <div key={c.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative group overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2"></div>
                    <div className="flex justify-between items-start mb-4 relative z-10">
                      <div>
                        <h4 className="font-bold text-slate-900">{c.name}</h4>
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[10px] font-bold uppercase border border-indigo-100">
                          {c.category}
                        </span>
                      </div>
                      <button onClick={() => handleDeleteCustomClause(c.id)} className="text-slate-300 hover:text-rose-500 transition-colors">
                        <XCircle size={18} />
                      </button>
                    </div>
                    <p className="text-sm text-slate-600 bg-slate-50 p-4 rounded-xl font-mono leading-relaxed relative z-10">
                      {c.text}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* COMPARE TAB */}
      {tab === 'compare' && comparison && (
        <div>
          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 col-span-1">
              <p className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-1">Overall Score</p>
              <p className={`text-5xl font-black ${comparison.overall_score >= 80 ? 'text-emerald-600' : comparison.overall_score >= 60 ? 'text-amber-600' : 'text-rose-600'}`}>
                {comparison.overall_score}
                <span className="text-xl font-semibold text-slate-400">%</span>
              </p>
              <p className="text-sm text-slate-500 mt-2">{comparison.contract_name}</p>
            </div>
            <div className="col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <p className="text-sm font-semibold text-slate-700 mb-3">Key Recommendations</p>
              <ul className="space-y-2">
                {comparison.key_recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                    <Zap size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            {comparison.clauses.map((clause, i) => (
              <div key={i} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${DEVIATION_COLORS[clause.deviation] || 'border-slate-100'}`}>
                <div className="px-6 py-5 flex items-start gap-4">
                  <div className="mt-0.5">
                    {clause.status === 'missing' ? <XCircle size={20} className="text-rose-500" /> : <CheckCircle size={20} className="text-emerald-500" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <p className="font-semibold text-slate-900">{clause.clause_name}</p>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${DEVIATION_COLORS[clause.deviation]}`}>
                        {clause.deviation}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${clause.status === 'missing' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
                        {clause.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">{clause.risk_implication}</p>
                    <p className="text-sm font-medium text-blue-700 mt-2">→ {clause.recommendation}</p>
                    {clause.current_language && (
                      <div className="mt-3 bg-slate-50 rounded-xl p-3">
                        <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Current Language</p>
                        <p className="text-xs text-slate-600 italic">"{clause.current_language}"</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI GENERATOR TAB */}
      {tab === 'generate' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="font-semibold text-slate-900 mb-6 flex items-center gap-2">
              <Sparkles size={18} className="text-blue-600" /> Configure Clause Generation
            </h3>
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Clause Category</label>
                <select
                  value={genForm.category}
                  onChange={(e) => setGenForm(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="data_protection">Data Protection</option>
                  <option value="liability">Liability</option>
                  <option value="termination">Termination</option>
                  <option value="sla">SLA / Uptime</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Tone</label>
                <div className="grid grid-cols-3 gap-2">
                  {['balanced', 'client-favorable', 'vendor-favorable'].map(t => (
                    <button
                      key={t}
                      onClick={() => setGenForm(prev => ({ ...prev, tone: t }))}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold capitalize transition-all border ${genForm.tone === t ? 'bg-slate-900 text-white border-transparent' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Standards</label>
                <div className="flex flex-wrap gap-2">
                  {['KDPA', 'GDPR', 'CBK', 'ISO27001'].map(s => (
                    <button
                      key={s}
                      onClick={() => setGenForm(prev => ({
                        ...prev,
                        standards: prev.standards.includes(s)
                          ? prev.standards.filter(x => x !== s)
                          : [...prev.standards, s]
                      }))}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${genForm.standards.includes(s) ? 'bg-blue-600 text-white border-transparent' : 'bg-white text-slate-600 border-slate-200'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Specific Requirements</label>
                <textarea
                  value={genForm.requirements}
                  onChange={(e) => setGenForm(prev => ({ ...prev, requirements: e.target.value }))}
                  placeholder="e.g. Must include 30-day deletion window, include audit logs..."
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-sm hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {generating ? (
                  <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> Generating...</>
                ) : (
                  <><Wand2 size={16} /> Generate Clause</>
                )}
              </button>
            </div>
          </div>

          <div>
            {!generatedClause && !generating && (
              <div className="h-full bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl border border-slate-100 flex flex-col items-center justify-center p-12 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
                  <Wand2 size={28} className="text-blue-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">AI Clause Generator</h3>
                <p className="text-sm text-slate-500">Configure your requirements and click Generate to produce a legally-informed, standards-compliant clause.</p>
              </div>
            )}
            {generating && (
              <div className="h-full bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                  <p className="text-sm font-medium text-slate-600">AI is drafting your clause...</p>
                </div>
              </div>
            )}
            {generatedClause && !generating && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
                  <p className="font-semibold text-slate-900">Generated Clause</p>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">{generatedClause.ai_confidence}% Confidence</span>
                </div>
                <div className="p-6 space-y-4">
                  <div className="bg-slate-50 rounded-xl p-4 relative overflow-hidden">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-2">Clause Text</p>
                    <div className={!isPro ? 'blur-md select-none transition-all' : ''}>
                      <p className="text-sm text-slate-800 leading-relaxed font-mono">{generatedClause.generated_text}</p>
                    </div>
                    {!isPro && (
                      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/20 backdrop-blur-[2px]">
                        <div className="bg-white/90 px-6 py-4 rounded-2xl shadow-lg border border-slate-200 text-center">
                          <Lock size={20} className="text-slate-700 mx-auto mb-2" />
                          <p className="font-bold text-slate-900 text-sm">Professional Plan Required</p>
                          <p className="text-xs text-slate-500 mt-1 mb-3">Upgrade to view and copy AI-generated clauses.</p>
                          <a href="/billing" className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold inline-block">Upgrade to Pro</a>
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase mb-2">Standards Applied</p>
                    <div className="flex gap-2 flex-wrap">
                      {generatedClause.applicable_standards.map(s => (
                        <span key={s} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full">{s}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase mb-2">Implementation Notes</p>
                    <p className="text-xs text-slate-600">{generatedClause.implementation_notes}</p>
                  </div>
                  <button className="w-full py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                    Copy to Clipboard
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
