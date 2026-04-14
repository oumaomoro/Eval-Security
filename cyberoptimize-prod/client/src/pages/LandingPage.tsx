import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, ShieldCheck, Zap, BarChart3, Globe, Lock, Users, ArrowRight, Star } from "lucide-react";
import { DiamondIcon } from "@/components/DiamondIcon";
import { SEO } from "@/components/SEO";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-emerald-500/30">
      <SEO title="AI Contract Governance & Regional Compliance Software | Costloci" description="Costloci provides AI-driven contract governance, forensic risk mapping, and autonomic compliance (KDPA, POPIA, GDPR) for MSPs and global enterprises." />

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center border border-emerald-500/30 relative shadow-lg shadow-emerald-500/10">
                <DiamondIcon className="w-5 h-5" />
             </div>
             <span className="text-xl font-black tracking-tighter text-white uppercase italic">Costloci</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-bold uppercase tracking-widest text-slate-400 hover:text-emerald-400 transition-colors">Solutions</a>
            <a href="#trust" className="text-sm font-bold uppercase tracking-widest text-slate-400 hover:text-emerald-400 transition-colors">Trust</a>
            <a href="#pricing" className="text-sm font-bold uppercase tracking-widest text-slate-400 hover:text-emerald-400 transition-colors">Pricing</a>
            <Link href="/auth">
              <Button variant="outline" className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300">
                Access Portal
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] mb-8">
              <Zap className="w-3 h-3 animate-pulse" /> Now with Autonomic Compliance Engines
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white leading-tight tracking-tighter mb-6 max-w-5xl mx-auto">
              AI Contract Governance & <br />
              <span className="text-emerald-500 italic drop-shadow-[0_0_30px_rgba(16,185,129,0.4)]">Regional Compliance</span>
            </h1>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed mb-10 font-medium">
              The Sovereign Intelligence Standard for identifying forensic contract risks, streamlining KDPA & POPIA compliance, and maximizing enterprise vendor ROI. Built for MSPs and Global 2000 DPOs.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link href="/auth">
                <Button size="lg" className="h-16 px-10 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-lg rounded-2xl shadow-[0_20px_50px_rgba(16,185,129,0.3)] group uppercase italic transition-all active:scale-95">
                  Start Free Audit <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="h-16 px-10 border-white/10 text-white font-bold text-lg rounded-2xl hover:bg-white/5 backdrop-blur-sm uppercase italic transition-all">
                Schedule Demo
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust Grid */}
      <section id="trust" className="py-24 border-y border-white/5 bg-slate-900/20">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-12">Certified Across Global Jurisdictions</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {[
              { name: "KDPA", region: "Kenya", color: "text-emerald-500" },
              { name: "POPIA", region: "So. Africa", color: "text-blue-500" },
              { name: "GDPR", region: "EU Standard", color: "text-blue-600" },
              { name: "CBK", region: "Central Bank", color: "text-amber-500" },
              { name: "SOC 2 TYPE II", region: "Global Trust", color: "text-cyan-500 border border-cyan-500/20 px-2 py-1 rounded" },
              { name: "HIPAA", region: "Healthcare", color: "text-teal-500 border border-teal-500/20 px-2 py-1 rounded" },
              { name: "ISO 27001", region: "Security", color: "text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded" },
              { name: "PCI DSS", region: "Payments", color: "text-indigo-400" },
            ].map((badge, i) => (
              <div key={i} className="flex flex-col items-center justify-center grayscale hover:grayscale-0 transition-all opacity-50 hover:opacity-100 cursor-pointer">
                <ShieldCheck className={`w-8 h-8 mb-2 ${badge.color}`} />
                <span className="text-xs font-black uppercase tracking-tighter">{badge.name}</span>
                <span className="text-[8px] font-medium text-slate-600 uppercase tracking-widest">{badge.region}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features/Solutions */}
      <section id="features" className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {[
              {
                title: "For MSPs & SecOps",
                description: "Deep-tensor forensic analysis of vendor contracts. Correlate insurance limits with cybersecurity risk posture automatically.",
                icon: Zap,
                features: ["Billing Telemetry", "Multi-tenant Dashboard", "ROI Automated Benchmarking"]
              },
              {
                title: "For DPOs & Legal",
                description: "Autonomic regional compliance engine. Generate local jurisdictional evidence packs for KDPA, POPIA, and GDPR in seconds.",
                icon: Globe,
                features: ["Regional Policy Mapping", "Self-Healing Compliance", "Evidence Repository"]
              },
              {
                title: "Enterprise ROI Engine",
                description: "Uncover hidden savings in SaaS and vendor portfolios. Autonomic negotiation intelligence with real-time market data.",
                icon: BarChart3,
                features: ["Savings Identification", "Autonomic Remediation", "Executive ROI Reporting"]
              }
            ].map((feature, i) => (
              <Card key={i} className="bg-slate-900/40 border-white/5 p-8 rounded-[2rem] hover:border-emerald-500/20 transition-all group overflow-hidden relative">
                <div className="absolute -right-8 -top-8 w-24 h-24 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-colors" />
                <CardContent className="p-0">
                  <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-emerald-500/20 flex items-center justify-center mb-6 shadow-inner text-emerald-500">
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-black text-white mb-4 italic uppercase">{feature.title}</h3>
                  <p className="text-slate-400 mb-8 font-medium leading-relaxed">
                    {feature.description}
                  </p>
                  <ul className="space-y-3">
                    {feature.features.map((f, j) => (
                      <li key={j} className="flex items-center gap-3 text-xs font-bold text-slate-500 group-hover:text-slate-200 transition-colors">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" /> {f}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-32 bg-slate-900/10 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-4">Transparent Enterprise Value</h2>
            <p className="text-slate-400 font-medium">Simple tiers for the modern sovereign enterprise.</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { name: "Starter", price: "2,500", desc: "For boutique MSPs and small DPO teams.", features: ["Single Tenant", "AI Clause Audit", "KDPA/POPIA Sync"] },
              { name: "Professional", price: "10,000", desc: "Our most popular tier for active SecOps.", features: ["Forensic Risk Mapping", "Multi-tenant Support", "Full ROI Benchmarking", "Self-Healing Infra"], popular: true },
              { name: "Enterprise", price: "Custom", desc: "Global sovereign intelligence for the elite.", features: ["Autonomic Governance", "White-label Portal", "Direct API Synergies", "24/7 Sovereign Support"] }
            ].map((tier, i) => (
              <div key={i} className={`p-8 rounded-[2.5rem] border ${tier.popular ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-slate-900/40 border-white/5'} flex flex-col`}>
                <div className="mb-8">
                  <span className="text-xs font-black uppercase text-emerald-500 tracking-widest">{tier.name}</span>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-4xl font-black text-white">{tier.price === 'Custom' ? '' : '$'}</span>
                    <span className="text-5xl font-black text-white leading-none tracking-tighter">{tier.price}</span>
                    <span className="text-slate-500 text-sm font-bold">{tier.price === 'Custom' ? '' : '/mo'}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-4 font-medium leading-relaxed">{tier.desc}</p>
                </div>
                <div className="space-y-4 mb-10 flex-1">
                  {tier.features.map((f, j) => (
                    <div key={j} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      </div>
                      <span className="text-xs font-bold text-slate-300">{f}</span>
                    </div>
                  ))}
                </div>
                <Button className={`w-full h-14 rounded-2xl font-black uppercase italic ${tier.popular ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950' : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'}`}>
                  {tier.price === 'Custom' ? "Let's Talk" : "Deploy Instance"}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-4 gap-12">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center border border-emerald-500/30 relative shadow-lg shadow-emerald-500/10">
                 <DiamondIcon className="w-5 h-5" />
              </div>
              <span className="text-xl font-black tracking-tighter text-white uppercase italic">Costloci</span>
            </div>
            <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-sm">
              The Sovereign Intelligence Standard for the modern regulated enterprise. Engineered for DPOs, MSPs, and Cybersecurity Professionals.
            </p>
          </div>
          <div>
             <h4 className="text-white font-black uppercase tracking-widest text-xs mb-6 italic">Company</h4>
             <ul className="space-y-4">
                <li><a href="#" className="text-slate-500 hover:text-emerald-400 text-xs font-bold uppercase transition-colors">Privacy</a></li>
                <li><a href="#" className="text-slate-500 hover:text-emerald-400 text-xs font-bold uppercase transition-colors">Compliance</a></li>
                <li><a href="#" className="text-slate-500 hover:text-emerald-400 text-xs font-bold uppercase transition-colors">ROI Model</a></li>
             </ul>
          </div>
          <div>
             <h4 className="text-white font-black uppercase tracking-widest text-xs mb-6 italic">Portal</h4>
             <ul className="space-y-4">
                <li><Link href="/auth" className="text-slate-500 hover:text-emerald-400 text-xs font-bold uppercase transition-colors tracking-widest">Sign In</Link></li>
                <li><Link href="/auth" className="text-slate-500 hover:text-emerald-400 text-xs font-bold uppercase transition-colors tracking-widest">Secure Register</Link></li>
             </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-20 pt-10 border-t border-white/5 flex flex-col md:row items-center justify-between gap-6">
           <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] italic">© 2026 Costloci Intelligence Inc. Autonomic Remediation Engaged.</p>
           <div className="flex items-center gap-6">
              <Star className="w-4 h-4 text-emerald-500/30" />
              <Star className="w-4 h-4 text-emerald-500/30" />
              <Star className="w-4 h-4 text-emerald-500/30" />
           </div>
        </div>
      </footer>
    </div>
  );
}
