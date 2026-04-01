import React, { useState, useEffect } from 'react'
import { AlertCircle, FileText, CheckCircle, Shield, ArrowRight } from 'lucide-react'

const WordTaskpane = () => {
  const { user, loading, login } = useAuth()
  const [status, setStatus] = useState('initializing...')
  const [findings, setFindings] = useState([])
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState(null)
 
  // Automatically start analysis if we already have selection on load and authed
  useEffect(() => {
    if (user) setStatus('Ready.')
    else setStatus('Please sign in...')
  }, [user])
 
  const analyzeSelectedText = async () => {
    if (!user) {
      setError('You must be signed in to analyze clauses.')
      return
    }
    setAnalyzing(true)
    setError(null)
    
    try {
      await window.Word.run(async (context) => {
        const selection = context.document.getSelection()
        selection.load('text')
        await context.sync()
        
        const text = selection.text
        if (!text || text.trim().length < 20) {
          throw new Error('Please select a larger block of text for analysis.')
        }

        setStatus('AI Analyzing...')
        
        // Call the production API endpoint for "Clause Analysis"
        // Call the production API endpoint for "Clause Analysis" with the user's token
        const token = localStorage.getItem('costloci_token')
        const response = await fetch('https://api.costloci.com/api/ai/analyze-clause', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ text })
        })

        if (!response.ok) throw new Error('AI analysis failed.')
        
        const data = await response.json()
        setFindings(data.findings || [])
        setStatus('Analysis Complete.')
      })
    } catch (err) {
      setError(err.message)
      setStatus('Ready.')
    } finally {
      setAnalyzing(false)
    }
  }

  const applyRedline = async (suggestion) => {
    try {
      await window.Word.run(async (context) => {
        const selection = context.document.getSelection()
        selection.insertText(suggestion, 'Replace')
        await context.sync()
      })
    } catch (err) {
      setError('Failed to insert redline.')
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 border-l border-slate-700 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center mb-6 border border-blue-500/20 shadow-2xl shadow-blue-500/10">
          <Shield className="w-8 h-8 text-blue-500" />
        </div>
        <h2 className="text-2xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 font-outfit uppercase">Costloci AI</h2>
        <p className="text-slate-400 text-sm mb-8 leading-relaxed font-inter">
          Sign in to your Costloci account to analyze vendor agreements directly in Microsoft Word.
        </p>
        <a 
          href="/login" 
          target="_blank"
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 font-inter"
        >
          Open Login Page
        </a>
        <p className="mt-6 text-[10px] text-slate-500 uppercase tracking-widest font-black font-inter">Secure Endpoint Verified</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col font-sans border-l border-slate-800">
      <header className="p-4 flex items-center justify-between border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-1.5 rounded-lg shadow-lg">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-black tracking-tighter uppercase gradient-text font-outfit">Costloci</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold">
            {user?.email?.[0].toUpperCase()}
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 space-y-6 overflow-y-auto custom-scrollbar">
        <section className="bg-slate-800/50 backdrop-blur border border-white/5 p-4 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between mb-4">
             <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 font-inter">Live Guard</h3>
             <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-inter ${status.includes('Ready') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'}`}>
                {status}
             </span>
          </div>
          <button
            onClick={analyzeSelectedText}
            disabled={analyzing}
            className={`w-full py-3.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-xl group font-inter ${
              analyzing 
                ? 'bg-slate-800 cursor-not-allowed text-slate-600 border border-slate-700' 
                : 'bg-white text-slate-900 hover:bg-slate-50 active:scale-95'
            }`}
          >
            {analyzing ? (
              <div className="w-4 h-4 border-2 border-slate-600 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <FileText className="w-5 h-5 group-hover:scale-110 transition-transform text-slate-900" />
            )}
            {analyzing ? 'Analyzing...' : 'Analyze Selection'}
          </button>
        </section>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl flex gap-3 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-xs font-semibold leading-relaxed font-inter">{error}</p>
          </div>
        )}

        {findings.length > 0 ? (
          <div className="space-y-4 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 font-inter">Analysis Results</h3>
              <span className="text-[10px] font-bold text-blue-400 font-inter">{findings.length} findings</span>
            </div>
            {findings.map((f, i) => (
              <div key={i} className="bg-slate-800/40 border border-white/5 p-4 rounded-2xl shadow-xl hover:border-blue-500/30 transition-all group">
                <div className="flex justify-between items-start mb-3">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider font-inter ${
                    f.severity === 'critical' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {f.severity}
                  </span>
                </div>
                <h4 className="font-bold text-sm text-white mb-2 leading-tight font-inter">{f.title}</h4>
                <p className="text-xs text-slate-400 mb-4 font-medium leading-relaxed font-inter">{f.description}</p>
                
                {f.suggested_redline && (
                  <button 
                    onClick={() => applyRedline(f.suggested_redline)}
                    className="w-full text-[10px] font-black uppercase tracking-widest bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-xl flex items-center justify-between group transition-all shadow-lg font-inter"
                  >
                    Apply AI Redline <ArrowRight className="w-3 h-3 group-hover:translate-x-1 duration-300" />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : !analyzing && (
          <div className="py-12 text-center text-slate-600 opacity-50">
             <Shield size={32} className="mx-auto mb-3" />
             <p className="text-[10px] font-bold uppercase tracking-widest leading-relaxed font-inter">
               Select document text<br/>to begin security scan
             </p>
          </div>
        )}
      </main>

      <footer className="p-4 text-center border-t border-slate-800/50 mt-auto">
        <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest font-inter">
          Costloci Enterprise AI v2.2.0 • PROD
        </p>
      </footer>
    </div>
  )
}

export default WordTaskpane

