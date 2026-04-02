import React from 'react'
import { Link } from 'react-router-dom'
import { Shield, CheckCircle, Zap, Lock, Award, Globe, ArrowRight, Star } from 'lucide-react'
import BrandingConfig from '../config/branding'

const PILLARS = [
    {
        icon: Shield,
        title: 'Zero-Trust Architecture',
        desc: 'Every request is authenticated and authorized at the API layer. No implicit trust. End-to-end AES-256 encryption at rest and in transit.',
        badge: 'SOC 2 Type II',
        color: 'cyan',
    },
    {
        icon: Zap,
        title: 'AI-Grade Accuracy',
        desc: 'Our RAG-augmented LLM achieves 99.4% clause extraction accuracy across 12+ legal jurisdictions, trained on over 500,000 enterprise contracts.',
        badge: '99.4% Accuracy',
        color: 'blue',
    },
    {
        icon: Lock,
        title: 'Immutable Audit Trail',
        desc: 'Every AI decision, contract revision, and user action is cryptographically hashed and stored in an immutable audit log for multi-year compliance.',
        badge: 'GDPR / KDPA / POPIA',
        color: 'indigo',
    },
    {
        icon: Globe,
        title: 'Global Compliance Coverage',
        desc: 'Automatic mapping against GDPR, KDPA, POPIA, CCPA, ISO 27001, and HIPAA. Multi-jurisdiction risk scoring in a single platform.',
        badge: '12+ Jurisdictions',
        color: 'emerald',
    },
    {
        icon: Award,
        title: 'Enterprise SLA Guarantee',
        desc: '99.9% uptime SLA backed by multi-region Cloudflare edge and Vercel serverless. Cold-start latency optimized to under 200ms.',
        badge: '99.9% Uptime',
        color: 'amber',
    },
    {
        icon: Star,
        title: 'MSP-Grade Scalability',
        desc: 'Multi-tenant isolation, role-based access control, and dedicated client workspaces allow managed service providers to serve hundreds of clients from one dashboard.',
        badge: 'Multi-Tenant',
        color: 'rose',
    },
]

const colorMap = {
    cyan: 'border-cyan-500/30 bg-cyan-500/5 text-cyan-400',
    blue: 'border-blue-500/30 bg-blue-500/5 text-blue-400',
    indigo: 'border-indigo-500/30 bg-indigo-500/5 text-indigo-400',
    emerald: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400',
    amber: 'border-amber-500/30 bg-amber-500/5 text-amber-400',
    rose: 'border-rose-500/30 bg-rose-500/5 text-rose-400',
}

const badgeMap = {
    cyan: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
    blue: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    indigo: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    rose: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
}

export default function GoldStandard() {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 overflow-x-hidden font-sans">
            {/* Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-600/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-5%] right-[-5%] w-[40%] h-[40%] bg-yellow-600/5 rounded-full blur-[120px]" />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre-big.png')] opacity-[0.03]" />
            </div>

            {/* Nav */}
            <nav className="relative z-50 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
                <Link to="/" className="flex items-center gap-3 group">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-900 border border-white/5 overflow-hidden group-hover:scale-105 transition-transform">
                        {BrandingConfig.logoUrl
                            ? <img src={BrandingConfig.logoUrl} alt={BrandingConfig.appName} className="w-full h-full object-cover" />
                            : <Shield className="text-amber-400" size={20} strokeWidth={2.5} />
                        }
                    </div>
                    <span className="text-xl font-black tracking-tighter uppercase italic text-white">{BrandingConfig.appName}</span>
                </Link>
                <Link to="/login" className="px-6 py-2.5 bg-amber-500 text-slate-950 rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 transition-all">
                    Access Platform
                </Link>
            </nav>

            {/* Hero */}
            <section className="relative z-10 text-center pt-24 pb-20 px-6">
                <div className="max-w-5xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-black uppercase tracking-[0.2em] mb-8">
                        <Star size={12} className="fill-amber-400" /> Gold Standard Compliance
                    </div>
                    <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-[0.9] mb-8">
                        THE GOLD <br />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400">STANDARD.</span>
                    </h1>
                    <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed mb-12 font-medium">
                        Not all contract intelligence platforms are equal. {BrandingConfig.appName} was engineered to the highest standards of security, accuracy, and global compliance from day one.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link to="/login?signup=true" className="group px-10 py-5 bg-amber-500 text-slate-950 rounded-full font-black text-sm transition-all hover:shadow-[0_0_40px_rgba(245,158,11,0.4)] hover:scale-105 flex items-center gap-3 uppercase tracking-widest">
                            Start for Free <ArrowRight size={18} />
                        </Link>
                        <Link to="/" className="px-10 py-5 bg-slate-900/50 hover:bg-slate-800 backdrop-blur-md text-white border border-white/10 rounded-full font-black text-xs transition-all uppercase tracking-widest">
                            Back to Home
                        </Link>
                    </div>
                </div>
            </section>

            {/* Certification Banner */}
            <section className="border-y border-white/5 bg-slate-900/40 py-8 px-6">
                <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-8 md:gap-16 opacity-60">
                    {['SOC 2 TYPE II', 'GDPR', 'ISO 27001', 'HIPAA', 'POPIA', 'KDPA', 'CCPA'].map(cert => (
                        <div key={cert} className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white">
                            <CheckCircle size={14} className="text-amber-400" /> {cert}
                        </div>
                    ))}
                </div>
            </section>

            {/* Pillars Grid */}
            <section className="relative z-10 py-32 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-4">SIX PILLARS OF EXCELLENCE</h2>
                        <p className="text-slate-500 max-w-2xl mx-auto">Every feature engineered for enterprise-grade resilience, security, and long-term value extraction.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {PILLARS.map((pillar) => {
                            const Icon = pillar.icon
                            return (
                                <div
                                    key={pillar.title}
                                    className={`p-8 rounded-3xl border bg-slate-900/60 backdrop-blur-md hover:scale-[1.02] transition-all duration-300 ${colorMap[pillar.color]}`}
                                >
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 border ${colorMap[pillar.color]}`}>
                                        <Icon size={22} />
                                    </div>
                                    <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 ${badgeMap[pillar.color]}`}>
                                        {pillar.badge}
                                    </span>
                                    <h3 className="text-xl font-black text-white mb-3 leading-tight">{pillar.title}</h3>
                                    <p className="text-slate-400 text-sm leading-relaxed">{pillar.desc}</p>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="relative z-10 py-24 px-6 text-center">
                <div className="max-w-3xl mx-auto bg-gradient-to-br from-amber-500/10 to-yellow-500/5 border border-amber-500/20 rounded-[3rem] p-16">
                    <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-4">READY TO DEPLOY THE GOLD STANDARD?</h2>
                    <p className="text-slate-400 mb-8">Join enterprise security teams who trust {BrandingConfig.appName} for mission-critical contract intelligence.</p>
                    <Link to="/login?signup=true" className="inline-flex items-center gap-3 px-12 py-5 bg-amber-500 text-slate-950 rounded-full font-black uppercase tracking-widest text-sm hover:scale-105 hover:shadow-[0_0_40px_rgba(245,158,11,0.4)] transition-all">
                        <Award size={18} /> Initialize Your Command Center
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-6 text-center border-t border-white/5">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-600">
                    © 2026 {BrandingConfig.companyName} • Gold Standard Security • All Transmissions Encrypted
                </p>
            </footer>
        </div>
    )
}
