import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, ChevronRight, CheckCircle, Building2, User, Zap, UploadCloud } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function Onboarding() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({ company: '', role: 'Security Engineer' })
  const navigate = useNavigate()
  const { user } = useAuth()

  const handleNext = () => {
    if (step < 3) setStep(step + 1)
    else navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Bar */}
      <div className="bg-white border-b border-slate-100 px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
           <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/10 bg-slate-900 border border-white/5 overflow-hidden">
             {BrandingConfig.logoUrl ? (
               <img src={BrandingConfig.logoUrl} alt={BrandingConfig.appName} className="w-full h-full object-cover" />
             ) : (
               <Shield className="text-cyan-400" size={16} strokeWidth={2.5} />
             )}
           </div>
           <span className="text-xl font-bold text-slate-900 tracking-tight">{BrandingConfig.appName}</span>
        </div>
        <div className="text-sm font-semibold text-slate-500">
           Step {step} of 3
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-500">
          
          {/* Progress Bar */}
          <div className="flex border-b border-slate-100">
             {[1, 2, 3].map(s => (
                <div key={s} className={`flex-1 h-1.5 ${s <= step ? 'bg-blue-600' : 'bg-slate-100'} transition-all duration-500`}></div>
             ))}
          </div>

          <div className="p-10 md:p-14">
            {step === 1 && (
              <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                  <Building2 size={24} />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mb-3">Welcome, {user?.email?.split('@')[0] || 'User'}!</h2>
                <p className="text-slate-500 mb-8 text-lg">Let's set up your workspace so the AI can tailor its risk analysis to your organization.</p>
                
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Company Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Acme Corp" 
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-slate-900"
                      value={formData.company}
                      onChange={e => setFormData({...formData, company: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Your Role</label>
                    <div className="relative">
                      <select 
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none appearance-none text-slate-900 font-medium"
                        value={formData.role}
                        onChange={e => setFormData({...formData, role: e.target.value})}
                      >
                        <option>Chief Information Security Officer (CISO)</option>
                        <option>Security Engineer</option>
                        <option>Procurement / Legal</option>
                        <option>IT Director</option>
                      </select>
                      <User className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} pointerEvents="none" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-6">
                  <Zap size={24} />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mb-3">Connect your toolchain</h2>
                <p className="text-slate-500 mb-8 text-lg">Integrate Costloci with your existing workflow for automated continuous monitoring.</p>
                
                <div className="space-y-4">
                  {[
                    { name: 'DocuSign', desc: 'Auto-import executed MSAs', connected: true },
                    { name: 'Slack', desc: 'Get alerts on high-risk vendors', connected: false },
                    { name: 'Jira', desc: 'Create tickets for mitigation', connected: false }
                  ].map(integration => (
                    <div key={integration.name} className="flex items-center justify-between p-5 border border-slate-200 rounded-2xl bg-white hover:border-blue-300 transition-colors cursor-pointer group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex flex-shrink-0 items-center justify-center font-bold text-slate-500 text-lg group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                          {integration.name[0]}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{integration.name}</p>
                          <p className="text-xs text-slate-500">{integration.desc}</p>
                        </div>
                      </div>
                      <button className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${integration.connected ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                        {integration.connected ? 'Connected' : 'Connect'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
                  <UploadCloud size={24} />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mb-3">Upload your first contract</h2>
                <p className="text-slate-500 mb-8 text-lg">Let's analyze your first vendor agreement to instantly uncover risks and savings.</p>
                
                <div className="border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center bg-slate-50/50 hover:bg-blue-50 hover:border-blue-300 transition-all cursor-pointer group">
                  <div className="w-16 h-16 bg-white shadow-sm rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <UploadCloud className="text-blue-500" size={28} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-700 mb-2">Drag & Drop PDF</h3>
                  <p className="text-sm text-slate-500">or click to browse from your computer</p>
                  <p className="text-xs text-slate-400 mt-4">(You can also skip this and do it later)</p>
                </div>
              </div>
            )}

            <div className="mt-10 flex items-center justify-between pt-6 border-t border-slate-100">
              <button 
                onClick={() => setStep(step > 1 ? step - 1 : 1)} 
                className={`text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors ${step === 1 ? 'invisible' : ''}`}
              >
                Back
              </button>
              <button 
                onClick={handleNext} 
                className="px-8 py-3.5 bg-slate-900 hover:bg-blue-600 text-white rounded-xl font-bold transition-all shadow-md flex items-center gap-2"
              >
                {step === 3 ? 'Go to Dashboard' : 'Continue'} <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
