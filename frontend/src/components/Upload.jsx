import React, { useState, useRef } from 'react'
import { UploadCloud, File, X, CheckCircle, AlertCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../utils/api'
import { Zap, ShieldCheck, Crown, Info } from 'lucide-react'

export default function Upload() {
  const [file, setFile] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [status, setStatus] = useState('idle') // idle, uploading, success, error
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)
  const navigate = useNavigate()
  const [deepAnalysis, setDeepAnalysis] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  const { user } = useAuth()

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
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile?.type === 'application/pdf') {
      setFile(droppedFile)
      setError('')
    } else {
      setError('Please upload a valid PDF document.')
    }
  }

  const handleFileSelect = (e) => {
    const selected = e.target.files[0]
    if (selected?.type === 'application/pdf') {
      setFile(selected)
      setError('')
    } else {
      setError('Please select a valid PDF document.')
    }
  }

  const handleUpload = async () => {
    if (!file) return
    setStatus('uploading')
    setError('')

    try {
      const localToken = localStorage.getItem('cyberoptimize_token')
      
      const formData = new FormData()
      formData.append('file', file)
      formData.append('clientId', 'default-client')
      formData.append('deepAnalysis', deepAnalysis ? 'true' : 'false')

      const json = await api.upload('/contracts/analyze', formData)
      
      if (json.success) {
        setStatus('success')
        setTimeout(() => navigate('/contracts'), 2000)
      } else {
        throw new Error(json.error || 'Failed to analyze contract')
      }
    } catch (err) {
      if (err.data?.limit_reached) {
        setStatus('limit_reached')
        setError('')
      } else {
        setError(err.message)
        setStatus('error')
      }
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Upload Contract</h1>
        <p className="text-slate-500 mt-2">Upload your vendor agreements or licenses for automated AI analysis.</p>
      </div>

      <div 
        className={`mt-4 border-2 border-dashed rounded-3xl p-12 text-center transition duration-200 ease-in-out
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-white hover:bg-slate-50'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {status === 'limit_reached' ? (
          <div className="flex flex-col items-center animate-in zoom-in duration-300">
            <div className="h-20 w-20 bg-blue-100 rounded-full flex items-center justify-center mb-6 text-blue-600">
              <AlertCircle size={40} />
            </div>
            <h3 className="text-2xl font-black text-slate-900">Limit Reached: Time to Unleash AI</h3>
            <p className="text-slate-500 mt-3 mb-8 max-w-md mx-auto text-base">
              You've successfully analyzed your first 5 contracts. Upgrade to Professional today to unlock unlimited legal power.
            </p>
            <button 
              onClick={() => navigate('/billing')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-xl font-bold shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5"
            >
              Upgrade Plan
            </button>
          </div>
        ) : user?.role === 'viewer' ? (
          <div className="flex flex-col items-center animate-in zoom-in duration-300">
            <div className="h-20 w-20 bg-amber-100 rounded-full flex items-center justify-center mb-6 text-amber-600">
              <AlertCircle size={40} />
            </div>
            <h3 className="text-2xl font-black text-slate-900">Access Restricted</h3>
            <p className="text-slate-500 mt-3 mb-8 max-w-md mx-auto text-base">
              Your current role ("Viewer") does not permit uploading or analyzing new contracts. Please contact your administrator.
            </p>
          </div>
        ) : !file ? (
          <div className="flex flex-col items-center">
            <div className="h-20 w-20 bg-blue-100 rounded-full flex items-center justify-center mb-6 text-blue-600">
              <UploadCloud size={40} />
            </div>
            <h3 className="text-xl font-semibold text-slate-800">Drag & Drop your PDF</h3>
            <p className="text-slate-500 mt-2 mb-6 text-sm">Max file size: 10MB.</p>
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
              onChange={handleFileSelect} 
            />
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="h-20 w-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6 text-emerald-600">
              <File size={40} />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 break-all px-4">{file.name}</h3>
            <p className="text-slate-500 mt-2 mb-6 text-sm">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            <div className="flex gap-4">
              <button 
                onClick={() => setFile(null)}
                className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 px-6 py-2.5 rounded-lg font-medium transition"
                disabled={status === 'uploading' || status === 'success'}
              >
                Cancel
              </button>
              <button 
                onClick={handleUpload}
                disabled={status === 'uploading' || status === 'success'}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium shadow flex items-center gap-2 disabled:bg-blue-400"
              >
                {status === 'uploading' && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>}
                {status === 'success' ? 'Uploaded!' : (status === 'uploading' ? 'Analyzing...' : 'Start AI Analysis')}
              </button>
            </div>

            {/* Phase 21: Enterprise-Only Deep Analysis Toggle */}
            <div className="mt-8 pt-8 border-t border-slate-100 w-full max-w-md">
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${deepAnalysis ? 'bg-amber-100 text-amber-600' : 'bg-slate-200 text-slate-400'}`}>
                    <Zap size={18} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
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
      </div>

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
              <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                <ShieldCheck size={18} className="text-emerald-500" />
                <span>Dedicated SADC Compliance Vault</span>
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
          <span className="font-medium">File successfully analyzed! Redirecting to contracts...</span>
        </div>
      )}
    </div>
  )
}
