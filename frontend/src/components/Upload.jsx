import React, { useState, useRef, useEffect } from 'react'
import { UploadCloud, File, X, CheckCircle, AlertCircle, Zap, ShieldCheck, Crown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../utils/api'

export default function Upload() {
  const [files, setFiles] = useState([])
  const [isDragging, setIsDragging] = useState(false)
  const [status, setStatus] = useState('idle') // idle, uploading, success, error
  const [error, setError] = useState('')
  const [results, setResults] = useState([])
  const fileInputRef = useRef(null)
  const navigate = useNavigate()
  const [deepAnalysis, setDeepAnalysis] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  const { user } = useAuth()
  const [clientId, setClientId] = useState('')
  const [clients, setClients] = useState([])

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await api.get('/clients')
        setClients(res.data.clients || [])
      } catch (err) { console.error('Failed to load clients:', err) }
    }
    fetchClients()
  }, [])

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf')
    if (droppedFiles.length > 0) {
      setFiles(prev => [...prev, ...droppedFiles])
      setError('')
    } else {
      setError('Please upload valid PDF documents.')
    }
  }

  const handleFileSelect = (e) => {
    const selected = Array.from(e.target.files).filter(f => f.type === 'application/pdf')
    if (selected.length > 0) {
      setFiles(prev => [...prev, ...selected])
      setError('')
    } else {
      setError('Please select valid PDF documents.')
    }
  }

  const handleUpload = async () => {
    if (files.length === 0) return
    setStatus('uploading')
    setError('')

    try {
      const formData = new FormData()
      files.forEach(f => formData.append('files', f))
      formData.append('deepAnalysis', deepAnalysis ? 'true' : 'false')
      if (clientId) formData.append('clientId', clientId)

      const json = await api.upload('/contracts/analyze', formData)

      if (json.success) {
        setResults(json.results || [])
        setStatus('success')
        setTimeout(() => navigate('/contracts'), 3000)
      } else {
        throw new Error(json.error || 'Failed to analyze contracts')
      }
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Batch Contract Upload</h1>
        <p className="text-slate-500 mt-2">Upload multiple vendor agreements for high-speed parallel AI analysis.</p>
      </div>

      <div className="mb-8 bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1 block">Client Attribution</label>
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="bg-transparent text-slate-900 font-bold outline-none cursor-pointer"
          >
            <option value="">Select Corporate Entity (Optional)</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.company_name}</option>
            ))}
          </select>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Analysis Mode</p>
          <p className="text-sm font-bold text-blue-600">{deepAnalysis ? 'Premium Deep Scan' : 'Standard Intelligence'}</p>
        </div>
      </div>

      <div
        className={`mt-4 border-2 border-dashed rounded-3xl p-12 text-center transition duration-200 ease-in-out
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-white hover:bg-slate-50'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {user?.role === 'viewer' ? (
          <div className="flex flex-col items-center">
            <AlertCircle className="text-amber-500 mb-4" size={48} />
            <h3 className="text-xl font-bold">Access Restricted</h3>
            <p className="text-slate-500">Viewers cannot upload contracts.</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="h-20 w-20 bg-blue-100 rounded-full flex items-center justify-center mb-6 text-blue-600">
              <UploadCloud size={40} />
            </div>
            <h3 className="text-xl font-semibold text-slate-800">Drag & Drop PDF Files</h3>
            <p className="text-slate-500 mt-2 mb-6 text-sm">Upload up to 10 contracts at once.</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-lg font-medium shadow-sm transition-colors"
            >
              Browse Files
            </button>
            <input
              type="file"
              className="hidden"
              ref={fileInputRef}
              accept=".pdf"
              multiple
              onChange={handleFileSelect}
            />
          </div>
        )}
      </div>

      {files.length > 0 && (
        <div className="mt-8 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Queue ({files.length})</h3>
          <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-sm">
            {files.map((f, i) => (
              <div key={i} className="p-4 flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                    <File size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 truncate max-w-xs">{f.name}</p>
                    <p className="text-[10px] text-slate-500">{(f.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <button
                  onClick={() => setFiles(files.filter((_, idx) => idx !== i))}
                  className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                  disabled={status === 'uploading'}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => setFiles([])}
              className="px-6 py-2.5 text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition-all"
              disabled={status === 'uploading'}
            >
              Clear All
            </button>
            <button
              onClick={handleUpload}
              disabled={status === 'uploading' || status === 'success'}
              className="px-8 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center gap-2 disabled:bg-blue-400"
            >
              {status === 'uploading' ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Analyzing...
                </>
              ) : 'Analyze Group'}
            </button>
          </div>

          {/* Premium Deep Analysis Toggle */}
          <div className="mt-8 pt-8 border-t border-slate-100">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${deepAnalysis ? 'bg-amber-100 text-amber-600' : 'bg-slate-200 text-slate-400'}`}>
                  <Zap size={18} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    Premium Deep Scan
                    {user?.plan !== 'enterprise' && <Crown size={12} className="text-amber-500 fill-amber-500" />}
                  </p>
                  <p className="text-[10px] text-slate-500">Cross-reference with regional SADC/COMESA regulatory standards.</p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (user?.plan !== 'enterprise') {
                    setShowUpgradeModal(true);
                    return;
                  }
                  setDeepAnalysis(!deepAnalysis);
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${deepAnalysis ? 'bg-amber-500' : 'bg-slate-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${deepAnalysis ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        </div>
      )}

      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500">
                <Crown size={32} />
              </div>
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white text-center mb-2">Unlock Enterprise Intelligence</h2>
            <p className="text-slate-500 text-center text-sm mb-8">
              "Deep Scan" utilizes advanced GPT-4o models to perform multi-pass regulatory checks across IRA, CMA, POPIA, and CBK standards.
            </p>
            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                <ShieldCheck size={18} className="text-emerald-500" />
                <span>Unlimited Regional Statutory Scans</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                <ShieldCheck size={18} className="text-emerald-500" />
                <span>Strategic Board-Level Board Briefs</span>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => navigate('/billing')}
                className="w-full py-3.5 bg-slate-900 dark:bg-amber-600 text-white font-bold rounded-2xl hover:shadow-xl transition-all"
              >
                Upgrade to Enterprise
              </button>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="w-full py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold rounded-2xl transition-all"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-6 flex items-center gap-3 bg-red-50 text-red-700 p-4 rounded-xl border border-red-100">
          <AlertCircle size={20} />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {status === 'success' && (
        <div className="mt-6 flex items-center gap-3 bg-emerald-50 text-emerald-700 p-4 rounded-xl border border-emerald-100">
          <CheckCircle size={20} />
          <span className="font-medium">Batch successfully analyzed! Redirecting...</span>
        </div>
      )}
    </div>
  )
}
