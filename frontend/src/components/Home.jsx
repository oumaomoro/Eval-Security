import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Shield, Zap, CheckCircle, ChevronRight, Lock, Activity, Cpu, Database, PieChart, Globe } from 'lucide-react'
import BrandingConfig from '../config/branding'

export default function Home() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-slate-950 font-sans selection:bg-cyan-500/30 text-slate-200 overflow-x-hidden">
      {/* Background Decor */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px]"></div>
        
        {/* Floating Orbs */}
        <div className="absolute top-[20%] left-[10%] w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-[30%] right-[15%] w-80 h-80 bg-blue-500/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre-big.png')] opacity-[0.03]"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-transparent to-slate-950"></div>
      </div>

      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'glass h-16 shadow-xl' : 'bg-transparent h-24'}`}>
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/10 bg-slate-900 border border-white/5 overflow-hidden group-hover:scale-105 transition-transform duration-300">
                {BrandingConfig.logoUrl ? (
                  <img src={BrandingConfig.logoUrl} alt={BrandingConfig.appName} className="w-full h-full object-cover" />
                ) : (
                  <Shield className="text-cyan-400" size={22} strokeWidth={2.5} />
                )}
              </div>
              <span className="text-2xl font-black tracking-tighter text-white uppercase italic">
                {BrandingConfig.appName}
              </span>
            </Link>
          </div>
          <div className="hidden md:flex items-center gap-10">
            <a href="#intelligence" className="text-xs font-bold text-slate-400 hover:text-white transition-colors tracking-widest uppercase">Intelligence</a>
            <a href="#pricing" className="text-xs font-bold text-slate-400 hover:text-white transition-colors tracking-widest uppercase">Network</a>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-xs font-black text-slate-100 hover:text-cyan-400 transition-colors uppercase tracking-widest px-4">
              Access
            </Link>
            <Link to="/login?signup=true" className="px-6 py-2.5 bg-white text-slate-950 rounded-full text-xs font-black transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.2)] uppercase tracking-widest">
              Deploy Now
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section: THE COMMAND CENTER */}
      <section className="relative pt-48 pb-32 px-6 z-10 text-center">
        <div className="max-w-6xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase tracking-[0.2em] mb-10 animate-in fade-in slide-in-from-top-4 duration-1000">
            <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></div>
            Sector-A1 Status: Operational
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-[0.95] mb-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            THE COMMAND <br/>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400">CENTER FOR RISK.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-400 mb-14 max-w-3xl mx-auto leading-relaxed font-medium animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
            AI-driven vendor intelligence for the world's most demanding security teams. <br className="hidden md:block"/>
            Automate regulatory mapping, extract peak financial value, and secure the perimeter.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500">
            <Link to="/login" className="group relative px-10 py-5 bg-cyan-600 text-white rounded-full font-black text-lg transition-all hover:shadow-[0_0_40px_rgba(6,182,212,0.4)] hover:scale-105 flex items-center gap-3 overflow-hidden animate-pulse-glow">
               <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
               Initialize System <ChevronRight size={22} />
            </Link>
            <a href="#intelligence" className="px-10 py-5 bg-slate-900/50 hover:bg-slate-800 backdrop-blur-md text-white border border-white/10 rounded-full font-black text-xs transition-all uppercase tracking-widest">
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
                     <div className="absolute inset-0 bg-blue-500/20 blur-3xl group-hover:bg-cyan-500/20 transition-all duration-1000"></div>
                     <div className="relative w-32 h-32 md:w-48 md:h-48 rounded-full border-2 border-dashed border-slate-700 mx-auto flex items-center justify-center animate-[spin_20s_linear_infinite]">
                        <Shield className="text-cyan-500 rotate-[-45deg]" size={40} />
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
        </div>
      </section>

      {/* Trust & Certs */}
      <section className="py-16 border-y border-white/5 bg-slate-900/30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-12">Certified Infrastructure • SOC 2 Type II • ISO 27001 • HIPAA</p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
             <div className="flex items-center gap-2 font-black text-white text-xs tracking-widest"><Lock size={16}/> ENCRYPTION_AES_256</div>
             <div className="flex items-center gap-2 font-black text-white text-xs tracking-widest"><Activity size={16}/> REALTIME_MONITORING</div>
             <div className="flex items-center gap-2 font-black text-white text-xs tracking-widest"><Database size={16}/> ISOLATED_STORAGE</div>
             <div className="flex items-center gap-2 font-black text-white text-xs tracking-widest"><Cpu size={16}/> NEURAL_ANALYSIS</div>
          </div>
        </div>
      </section>

      {/* Benefits: PRECISION & SPEED */}
      <section id="intelligence" className="py-32 px-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row gap-20 items-center">
            <div className="flex-1 space-y-10 text-left">
                <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-none">
                  HIGH PRECISION <br />
                  <span className="text-cyan-500">LOW FRICTION.</span>
                </h2>
                <p className="text-lg text-slate-400 leading-relaxed max-w-lg">
                  Traditional manual reviews take weeks. Costloci AI renders full MSA/DPA reports in sub-30 seconds with 99.4% accuracy.
                </p>
                <div className="space-y-6">
                    {[
                      { title: 'Global Compliance Mapping', desc: 'Auto-sync with GDPR, KDPA, POPIA, CCPA and ISO standard libraries.' },
                      { title: 'Value Capture Engine', desc: 'Real-time market benchmarking ensures you never overpay for licenses.' },
                      { title: 'Immutable Audit Trail', desc: 'Every revision and AI decision is hashed for multi-year compliance readiness.' }
                    ].map((item, i) => (
                      <div key={i} className="flex gap-4 group">
                          <CheckCircle className="text-cyan-500 mt-1 flex-shrink-0" size={20} />
                          <div>
                             <h4 className="font-bold text-white group-hover:text-cyan-400 transition-colors uppercase tracking-widest text-[10px]">{item.title}</h4>
                             <p className="text-slate-500 text-sm mt-1">{item.desc}</p>
                          </div>
                      </div>
                    ))}
                </div>
            </div>
            <div className="flex-1 relative w-full lg:w-auto">
                <div className="bg-gradient-to-br from-cyan-600 to-blue-700 rounded-[3rem] p-1 shadow-2xl overflow-hidden group">
                   <div className="bg-slate-950 rounded-[2.8rem] p-10 overflow-hidden relative">
                      <PieChart className="text-cyan-500/10 absolute -right-20 bottom-0" size={300} />
                      <div className="relative z-10 space-y-8">
                         <div className="p-4 bg-slate-900/50 border border-white/5 rounded-2xl backdrop-blur-sm">
                             <div className="flex justify-between mb-2">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">LLM CERTAINTY</span>
                                <span className="text-[10px] font-black text-emerald-500 tracking-widest">99.8%</span>
                             </div>
                             <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 w-[99.8%] shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                             </div>
                         </div>
                         <div className="p-4 bg-slate-900/50 border border-white/5 rounded-2xl backdrop-blur-sm">
                             <div className="flex justify-between mb-2">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">RESPONSE LATENCY</span>
                                <span className="text-[10px] font-black text-cyan-500 tracking-widest">1.2ms</span>
                             </div>
                             <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-cyan-500 w-[15%] shadow-[0_0_10px_rgba(34,211,238,0.5)]"></div>
                             </div>
                         </div>
                      </div>
                   </div>
                </div>
            </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 px-6 bg-white text-slate-950 rounded-[4rem] mx-4 relative overflow-hidden">
         <div className="absolute top-0 right-0 p-20 opacity-5 pointer-events-none">
            <Globe size={400} className="text-cyan-600" />
         </div>
         <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
               <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-none mb-6">ESTABLISH <br/>CONNECTION.</h2>
               <p className="text-slate-500 font-medium max-w-xl mx-auto">Scalable infrastructure for businesses of all sizes. Pay natively via PayPal or Stripe.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                <div className="p-10 glass dark:glass rounded-[2.5rem] border border-slate-200 bg-slate-50/50 hover:scale-105 transition-all duration-300">
                    <h3 className="text-xl font-black mb-2 uppercase tracking-widest">Starter Fleet</h3>
                    <p className="text-slate-500 text-xs mb-8 uppercase tracking-widest font-bold">Standard Risk Intelligence</p>
                    <div className="text-5xl font-black mb-10 tracking-tighter">$149 <span className="text-xs font-bold text-slate-400 uppercase tracking-widest tracking-normal">/mo</span></div>
                    <ul className="space-y-4 mb-10">
                        {['10 Contract Cap', 'Regional Compliance', 'Basic Risk Matrix'].map(t => (
                            <li key={t} className="flex items-center gap-3 text-sm font-bold text-slate-700 tracking-tight"><CheckCircle size={16} className="text-cyan-600"/> {t}</li>
                        ))}
                    </ul>
                    <Link to="/login?signup=true" className="block text-center py-4 bg-slate-950 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-cyan-600 transition-colors">Start Mission</Link>
                </div>
                
                <div className="p-10 glass dark:glass rounded-[2.5rem] bg-slate-900 border-2 border-cyan-500 ring-2 ring-cyan-500 text-white hover:scale-105 transition-all duration-300 animate-pulse-glow relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-cyan-500 opacity-10 rounded-full blur-3xl"></div>
                    <div className="flex justify-between items-center mb-2">
                       <h3 className="text-xl font-black uppercase tracking-widest">Enterprise Elite</h3>
                       <span className="px-3 py-1 bg-cyan-500 text-[10px] font-black uppercase tracking-widest rounded-full">Popular</span>
                    </div>
                    <p className="text-cyan-400 text-xs mb-8 uppercase tracking-widest font-bold">Full Command Access</p>
                    <div className="text-5xl font-black mb-10 tracking-tighter">$999 <span className="text-xs font-bold text-slate-500 uppercase tracking-widest tracking-normal">/mo</span></div>
                    <ul className="space-y-4 mb-10">
                        {['Unlimited Synthesis', 'Strategic Board Reports', 'API Direct Access', 'Dedicated Support'].map(t => (
                            <li key={t} className="flex items-center gap-3 text-sm font-bold text-slate-300 tracking-tight"><CheckCircle size={16} className="text-cyan-400"/> {t}</li>
                        ))}
                    </ul>
                    <Link to="/login?signup=true" className="block text-center py-4 bg-cyan-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-white hover:text-cyan-600 transition-all">Command Now</Link>
                </div>
            </div>
         </div>
      </section>

      {/* Footer */}
      <footer className="py-24 px-6 text-center border-t border-white/5">
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center opacity-40">
            <div className="flex items-center gap-3 mb-6 md:mb-0">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/10 bg-slate-900 border border-white/5 overflow-hidden">
                {BrandingConfig.logoUrl ? (
                  <img src={BrandingConfig.logoUrl} alt={BrandingConfig.appName} className="w-full h-full object-cover" />
                ) : (
                  <Shield className="text-cyan-400" size={18} strokeWidth={2.5} />
                )}
              </div>
              <span className="text-xl font-black uppercase italic tracking-tighter text-white">{BrandingConfig.appName}</span>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em]">© 2026 {BrandingConfig.companyName} • Secure Operations • Full Encryption Enabled</p>
         </div>
      </footer>
    </div>
  )
}
