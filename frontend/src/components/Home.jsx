import React from 'react'
import { Link } from 'react-router-dom'
import { Shield, Zap, TrendingDown, CheckCircle, ChevronRight, Lock, Activity, FileText, Globe, Cpu, Database, PieChart } from 'lucide-react'
import BrandingConfig from '../config/branding'

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 font-sans selection:bg-blue-500/30 text-slate-200 overflow-x-hidden">
      {/* Background Decor */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre-big.png')] opacity-[0.03]"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-transparent to-slate-950"></div>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/40 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20" style={{ backgroundColor: BrandingConfig.primaryColor }}>
              <Shield className="text-white" size={22} strokeWidth={2.5} />
            </div>
            <span className="text-2xl font-black tracking-tighter text-white uppercase italic">
              {BrandingConfig.appName}
            </span>
          </div>
          <div className="hidden md:flex items-center gap-10">
            <a href="#intelligence" className="text-sm font-bold text-slate-400 hover:text-white transition-colors tracking-widest uppercase">Intelligence</a>
            <a href="#precision" className="text-sm font-bold text-slate-400 hover:text-white transition-colors tracking-widest uppercase">Precision</a>
            <a href="#pricing" className="text-sm font-bold text-slate-400 hover:text-white transition-colors tracking-widest uppercase">Network</a>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-black text-slate-100 hover:text-blue-400 transition-colors uppercase tracking-widest px-4">
              Access
            </Link>
            <Link to="/login?signup=true" className="px-6 py-3 bg-white text-slate-950 rounded-full text-sm font-black transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.2)] uppercase tracking-widest">
              Deploy Now
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section: THE COMMAND CENTER */}
      <section className="relative pt-40 pb-32 px-6 z-10 text-center">
        <div className="max-w-6xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mb-10 animate-in fade-in slide-in-from-top-4 duration-1000">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
            Sector-A1 Status: Operational
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-[0.95] mb-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            THE COMMAND <br/>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400">CENTER FOR RISK.</span>
          </h1>
          
          <p className="text-lg md:text-2xl text-slate-400 mb-14 max-w-3xl mx-auto leading-relaxed font-medium animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
            AI-driven vendor intelligence for the world's most demanding security teams. <br className="hidden md:block"/>
            Automate regulatory mapping, extract peak financial value, and secure the perimeter.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500">
            <Link to="/login" className="group relative px-10 py-5 bg-blue-600 text-white rounded-full font-black text-lg transition-all hover:shadow-[0_0_40px_rgba(37,99,235,0.4)] hover:scale-105 flex items-center gap-3 overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
               Initialize System <ChevronRight size={22} />
            </Link>
            <a href="#intelligence" className="px-10 py-5 bg-slate-900/50 hover:bg-slate-800 backdrop-blur-md text-white border border-white/10 rounded-full font-black text-lg transition-all uppercase tracking-widest">
              Review Specs
            </a>
          </div>
        </div>

        {/* Global Portfolio Visualization */}
        <div className="max-w-7xl mx-auto mt-32 relative animate-in fade-in zoom-in duration-1000 delay-700">
          <div className="bg-slate-900/80 rounded-[2.5rem] p-4 shadow-[0_0_80px_rgba(0,0,0,0.5)] border border-white/5 relative z-10 overflow-hidden backdrop-blur-2xl">
            <div className="bg-slate-950 rounded-[2rem] aspect-[21/9] flex items-center justify-center relative border border-white/5 overflow-hidden">
               {/* Cyber Grid */}
               <div className="absolute inset-0 opacity-20" style={{backgroundImage: 'linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)', backgroundSize: '40px 40px'}}></div>
               
               <div className="z-10 grid grid-cols-1 md:grid-cols-3 gap-12 text-center items-center w-full px-12">
                  <div className="space-y-4">
                     <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">Active Audits</p>
                     <p className="text-5xl font-black text-white italic">2,841</p>
                     <div className="h-1 w-24 bg-blue-600/30 mx-auto rounded-full"></div>
                  </div>
                  <div className="relative group">
                     <div className="absolute inset-0 bg-blue-500/20 blur-3xl group-hover:bg-emerald-500/20 transition-all duration-1000"></div>
                     <div className="relative w-32 h-32 md:w-48 md:h-48 rounded-full border-2 border-dashed border-slate-700 mx-auto flex items-center justify-center animate-[spin_20s_linear_infinite]">
                        <Shield className="text-blue-500 rotate-[-45deg]" size={40} />
                     </div>
                     <p className="mt-8 text-xs font-bold text-slate-400 uppercase tracking-widest">Core Consensus Engine</p>
                  </div>
                  <div className="space-y-4">
                     <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">Savings Extracted</p>
                     <p className="text-5xl font-black text-white italic">$42.4M</p>
                     <div className="h-1 w-24 bg-emerald-600/30 mx-auto rounded-full"></div>
                  </div>
               </div>
            </div>
          </div>
          {/* Neon Orbs */}
          <div className="absolute -left-20 -top-20 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] -z-10"></div>
          <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-emerald-600/20 rounded-full blur-[120px] -z-10"></div>
        </div>
      </section>

      {/* Trust & Certs */}
      <section className="py-16 border-y border-white/5 bg-slate-900/30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-12">Certified Infrastructure • SOC 2 Type II • ISO 27001 • HIPAA</p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
             <div className="flex items-center gap-2 font-black text-white text-sm"><Lock size={16}/> ENCRYPTION_AES_256</div>
             <div className="flex items-center gap-2 font-black text-white text-sm"><Activity size={16}/> REALTIME_MONITORING</div>
             <div className="flex items-center gap-2 font-black text-white text-sm"><Database size={16}/> ISOLATED_STORAGE</div>
             <div className="flex items-center gap-2 font-black text-white text-sm"><Cpu size={16}/> NEURAL_ANALYSIS</div>
          </div>
        </div>
      </section>

      {/* Benefits: PRECISION & SPEED */}
      <section id="intelligence" className="py-32 px-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row gap-20 items-center">
            <div className="flex-1 space-y-10 text-left">
                <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-none">
                  HIGH PRECISION <br />
                  <span className="text-blue-500">LOW FRICTION.</span>
                </h2>
                <p className="text-xl text-slate-400 leading-relaxed max-w-lg">
                  Traditional manual reviews take weeks. CyberOptimize AI renders full MSA/DPA reports in sub-30 seconds with 99.4% accuracy.
                </p>
                <div className="space-y-6">
                    {[
                      { title: 'Global Compliance Mapping', desc: 'Auto-sync with GDPR, KDPA, POPIA, CCPA and ISO standard libraries.' },
                      { title: 'Value Capture Engine', desc: 'Real-time market benchmarking ensures you never overpay for licenses.' },
                      { title: 'Immutable Audit Trail', desc: 'Every revision and AI decision is hashed for multi-year compliance readiness.' }
                    ].map((item, i) => (
                      <div key={i} className="flex gap-4 group">
                          <CheckCircle className="text-blue-500 mt-1 flex-shrink-0" size={20} />
                          <div>
                             <h4 className="font-bold text-white group-hover:text-blue-400 transition-colors uppercase tracking-widest text-xs">{item.title}</h4>
                             <p className="text-slate-500 text-sm mt-1">{item.desc}</p>
                          </div>
                      </div>
                    ))}
                </div>
            </div>
            <div className="flex-1 relative w-full lg:w-auto">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[3rem] p-1 shadow-2xl overflow-hidden group">
                   <div className="bg-slate-950 rounded-[2.8rem] p-10 overflow-hidden relative">
                      <div className="absolute inset-0 bg-blue-600/5 group-hover:bg-blue-600/10 transition-colors"></div>
                      <PieChart className="text-blue-500/20 absolute -right-20 bottom-0" size={300} />
                      <div className="relative z-10 space-y-8">
                         <div className="p-4 bg-slate-900 border border-white/5 rounded-2xl">
                             <div className="flex justify-between mb-2">
                                <span className="text-[10px] font-black text-slate-500">LLM CERTAINTY</span>
                                <span className="text-[10px] font-black text-emerald-500">99.8%</span>
                             </div>
                             <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 w-[99.8%] shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                             </div>
                         </div>
                         <div className="p-4 bg-slate-900 border border-white/5 rounded-2xl">
                             <div className="flex justify-between mb-2">
                                <span className="text-[10px] font-black text-slate-500">RESPONSE LATENCY</span>
                                <span className="text-[10px] font-black text-blue-500">1.2ms</span>
                             </div>
                             <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 w-[15%] shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                             </div>
                         </div>
                      </div>
                   </div>
                </div>
            </div>
        </div>
      </section>

      {/* Network & Pricing */}
      <section id="pricing" className="py-32 px-6 bg-white text-slate-950 rounded-[4rem] mx-4 relative overflow-hidden">
         <div className="absolute top-0 right-0 p-20 opacity-10 pointer-events-none">
            <Globe size={400} className="text-blue-600" />
         </div>
         <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-20 items-start">
            <div className="lg:w-1/3">
               <h2 className="text-5xl font-black tracking-tighter leading-none mb-8">GLOBAL <br/>NETWORK.</h2>
               <p className="text-slate-500 font-medium mb-12">Pay natively via PayPal or Paystack. Enterprise-grade support available in 140+ countries.</p>
               <div className="space-y-4">
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 italic font-medium text-slate-600">
                    "The shift from manual legal review to CyberOptimize command center reduced our procurement cycle by 82%."
                    <p className="mt-4 not-italic font-black text-slate-900">— CTO, EMEA Fintech Core</p>
                  </div>
               </div>
            </div>
            <div className="lg:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                <div className="p-10 bg-slate-50 rounded-[2.5rem] border border-slate-100 hover:shadow-xl transition-all">
                    <h3 className="text-xl font-black mb-2 uppercase tracking-widest">Starter Fleet</h3>
                    <p className="text-slate-500 text-sm mb-8">Base-level intelligence for SMBs.</p>
                    <div className="text-5xl font-black mb-10">$149 <span className="text-sm font-medium text-slate-400">/mo</span></div>
                    <ul className="space-y-4 mb-10">
                        {['10 Contract Cap', 'Regional Compliance', 'Basic Risk Matrix'].map(t => (
                            <li key={t} className="flex items-center gap-3 text-sm font-bold"><CheckCircle size={16} className="text-blue-600"/> {t}</li>
                        ))}
                    </ul>
                    <Link to="/login?signup=true" className="block text-center py-4 bg-slate-950 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-600 transition-colors">Authorize Account</Link>
                </div>
                <div className="p-10 bg-slate-900 text-white rounded-[2.5rem] border border-blue-500/30 shadow-2xl shadow-blue-500/20 relative overflow-hidden group">
                    <div className="absolute top-5 right-5 w-3 h-3 bg-blue-500 rounded-full animate-ping"></div>
                    <h3 className="text-xl font-black mb-2 uppercase tracking-widest">Enterprise Elite</h3>
                    <p className="text-slate-400 text-sm mb-8">Full command center capabilities.</p>
                    <div className="text-5xl font-black mb-10">$999 <span className="text-sm font-medium text-slate-500">/mo</span></div>
                    <ul className="space-y-4 mb-10">
                        {['Unlimited Synthesis', 'Strategic Board Reports', 'API Direct Access', 'Dedicated Compliance Officer'].map(t => (
                            <li key={t} className="flex items-center gap-3 text-sm font-bold text-slate-200"><CheckCircle size={16} className="text-blue-400"/> {t}</li>
                        ))}
                    </ul>
                    <Link to="/login?signup=true" className="block text-center py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-white hover:text-blue-600 transition-all">Establish Connection</Link>
                </div>
            </div>
         </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 text-center">
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center opacity-40">
            <div className="flex items-center gap-2 mb-6 md:mb-0">
               <Shield size={20} /> <span className="font-black uppercase italic tracking-tighter">{BrandingConfig.appName}</span>
            </div>
            <p className="text-xs font-bold uppercase tracking-widest">© 2026 {BrandingConfig.companyName} • Secure Operations • All Portals Encrypted</p>
         </div>
      </footer>
    </div>
  )
}
