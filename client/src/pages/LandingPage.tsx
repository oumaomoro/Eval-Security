import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, ShieldCheck, Zap, BarChart3, Globe, Lock, Users, ArrowRight, Star, Twitter, Linkedin, MapPin } from "lucide-react";
import { DiamondIcon } from "@/components/DiamondIcon";
import { SEO } from "@/components/SEO";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-emerald-500/30">
      <SEO title="Intelligence Contract Governance & Regional Compliance Software | Costloci" description="Costloci provides Intelligence-driven contract governance, risk mapping, and automated compliance (KDPA, POPIA, GDPR) for MSPs and global enterprises." />

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-[#0a0a0a] flex items-center justify-center border border-emerald-500/30 relative nutanix-glow">
                <DiamondIcon className="w-6 h-6 text-emerald-500" />
             </div>
             <span className="text-2xl font-black tracking-tighter text-white uppercase italic">Costloci</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-bold font-semibold text-slate-400 hover:text-emerald-400 transition-colors">Solutions</a>
            <a href="#trust" className="text-sm font-bold font-semibold text-slate-400 hover:text-emerald-400 transition-colors">Trust</a>
            <a href="#pricing" className="text-sm font-bold font-semibold text-slate-400 hover:text-emerald-400 transition-colors">Pricing</a>
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
              <Zap className="w-3 h-3 animate-pulse" /> Now with Automated Compliance Monitoring
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white leading-tight tracking-tighter mb-6 max-w-5xl mx-auto">
              Intelligence Contract Governance & <br />
              <span className="text-emerald-500 italic drop-shadow-[0_0_30px_rgba(16,185,129,0.4)]">Regional Compliance</span>
            </h1>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed mb-10 font-medium">
              The Professional Intelligence Standard for identifying contract risks, streamlining KDPA & POPIA compliance, and maximizing enterprise vendor ROI. Built for MSPs and Global 2000 DPOs.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link href="/auth">
                <Button size="lg" className="h-16 px-10 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-lg rounded-2xl nutanix-glow group uppercase italic transition-all active:scale-95 border-0">
                   Start Free Audit <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/auth">
                <Button size="lg" variant="outline" className="h-16 px-10 border-white/10 text-white font-bold text-lg rounded-2xl hover:bg-white/5 backdrop-blur-sm uppercase italic transition-all">
                  Schedule Demo
                </Button>
              </Link>
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
                <span className="text-[8px] font-medium text-slate-600 font-semibold">{badge.region}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features/Solutions */}
      <section id="features" className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-4">The Professional Intelligence Standard</h2>
            <p className="text-slate-400 font-medium max-w-2xl mx-auto">Unlike legacy CLMs, Costloci correlates contract reality with cybersecurity risk and regional regulatory mandates.</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {[
              {
                title: "Insurance Alignment",
                description: "Most contract tools miss the liability-to-premium gap. We automatically correlate your cyber insurance limits with vendor indemnity clauses.",
                icon: ShieldCheck,
                features: ["Liability Gap Analysis", "Indemnity Benchmarking", "Premium Optimization"]
              },
              {
                title: "Regional Drift Guard",
                description: "Automated monitoring for jurisdictional changes. If the Kenya ODPC or EU GDPR standards shift, your contract flags update in real-time.",
                icon: Globe,
                features: ["KDPA/POPIA/GDPR Sync", "Automated Policy Updates", "Drift Alerting"]
              },
              {
                title: "Remediation Engine",
                description: "Don't just identify risks—fix them. Generate legally enforceable DPA amendments and redlines ready for SignNow execution.",
                icon: Zap,
                features: ["Automated Redlining", "SignNow Integration", "Remediation Tracking"]
              }
            ].map((feature, i) => (
              <Card key={i} className="nutanix-card p-8 rounded-[2rem] hover:border-emerald-500/40 transition-all group overflow-hidden relative prism-border">
                <div className="absolute -right-8 -top-8 w-24 h-24 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-colors" />
                <CardContent className="p-0">
                  <div className="w-16 h-16 rounded-2xl bg-[#0a0a0a] border border-emerald-500/20 flex items-center justify-center mb-6 nutanix-glow text-emerald-500">
                    <feature.icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-2xl font-black text-white mb-4 italic uppercase tracking-tighter">{feature.title}</h3>
                  <p className="text-slate-500 mb-8 font-bold leading-relaxed text-sm">
                    {feature.description}
                  </p>
                  <ul className="space-y-3">
                    {feature.features.map((f, j) => (
                      <li key={j} className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-600 group-hover:text-slate-300 transition-colors">
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

      {/* Innovative Use Cases Section */}
      <section className="py-24 bg-emerald-500/5 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-8 leading-tight">
                Designed for the <br />
                <span className="text-emerald-500">Modern Risk Officer</span>
              </h2>
              <div className="space-y-12">
                {[
                  {
                    title: "The DPO Evidence Pack",
                    desc: "Instantly generate a consolidated PDF evidence pack for regulatory audits (KDPA/POPIA). Show exactly where every vendor stands on data sovereignty.",
                    metric: "90% Faster Audit Prep"
                  },
                  {
                    title: "The Procurement ROI Engine",
                    desc: "Correlate spend with compliance. Identify vendors that are high-cost but low-compliance to drive aggressive contract renegotiations.",
                    metric: "15% Average Savings"
                  },
                  {
                    title: "M&A Due Diligence Hub",
                    desc: "Acquiring a new firm? Ingest their entire contract database to find hidden liabilities, missing privacy clauses, and upcoming renewal traps in hours, not weeks.",
                    metric: "Automated Due Diligence"
                  }
                ].map((useCase, i) => (
                  <div key={i} className="flex gap-6 group">
                    <div className="w-1 h-20 bg-emerald-500/20 group-hover:bg-emerald-500 transition-colors" />
                    <div>
                      <h4 className="text-xl font-bold text-white mb-2">{useCase.title}</h4>
                      <p className="text-slate-400 text-sm mb-4 leading-relaxed">{useCase.desc}</p>
                      <span className="text-[10px] font-black uppercase text-emerald-400 tracking-widest">{useCase.metric}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500/20 blur-[100px] rounded-full" />
              <Card className="bg-slate-950 border-white/10 p-1 rounded-[3rem] relative z-10 shadow-2xl">
                <div className="p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">regulatory_drift_engine.v1</span>
                  </div>
                  <div className="space-y-4 font-mono text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Analyzing: Cloud_Agreement_04.pdf</span>
                      <span className="text-emerald-500">SCAN COMPLETE</span>
                    </div>
                    <div className="p-4 bg-slate-900/50 rounded-xl border border-white/5">
                      <p className="text-red-400 mb-2">! MISSING: KDPA Section 25 (Data Processing)</p>
                      <p className="text-slate-500">Recommendation: Inject Standard Data Transfer Clause v2.1</p>
                    </div>
                    <div className="p-4 bg-slate-900/50 rounded-xl border border-white/5">
                      <p className="text-emerald-400 mb-2">✓ ALIGNED: Cyber Insurance Liability Cap</p>
                      <p className="text-slate-500">Current: $5.0M | Required: $2.5M</p>
                    </div>
                    <div className="pt-4 flex justify-end">
                      <Button size="sm" className="bg-emerald-500 text-slate-950 font-bold h-8 text-[10px] uppercase">Generate Remediation</Button>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-32 bg-slate-900/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-4">The Compliance Pipeline</h2>
            <p className="text-slate-400 font-medium max-w-2xl mx-auto">Three steps to achieving enterprise-grade contract intelligence and regulatory peace of mind.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 relative">
             <div className="hidden md:block absolute top-12 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
             {[
               { step: "01", title: "Ingest & Scan", desc: "Upload your vendor contracts. Our Intelligence immediately scans for missing KDPA clauses and liability caps." },
               { step: "02", title: "Analyze & Redline", desc: "Correlate your cybersecurity insurance requirements with contract reality. Intelligence identifies critical gaps." },
               { step: "03", title: "Remediate & Comply", desc: "Generate evidence packs and DPA amendments ready for electronic signature with one click." }
             ].map((s, i) => (
               <div key={i} className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-24 h-24 rounded-full bg-slate-950 border border-emerald-500/20 flex items-center justify-center mb-8 shadow-2xl relative group">
                    <div className="absolute inset-0 rounded-full bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-colors" />
                    <span className="text-3xl font-black text-emerald-500 italic relative">{s.step}</span>
                  </div>
                  <h4 className="text-xl font-black text-white mb-4 uppercase italic tracking-tighter">{s.title}</h4>
                  <p className="text-sm text-slate-500 font-semibold leading-relaxed max-w-xs">{s.desc}</p>
               </div>
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
              { name: "Starter", price: "99", desc: "For boutique MSPs and small DPO teams.", features: ["20 Contracts", "Intelligence Clause Audit", "KDPA/POPIA Sync"] },
              { name: "Professional", price: "299", desc: "Our most popular tier for active SecOps.", features: ["Risk Mapping", "Multi-tenant Support", "Full ROI Benchmarking", "Managed Compliance"], popular: true },
              { name: "Enterprise", price: "999", desc: "Global intelligence for the elite.", features: ["Unlimited Contracts", "Automated Governance", "White-label Portal", "Direct API Integrations", "24/7 Professional Support"] }
            ].map((tier, i) => (
              <div key={i} className={`p-8 rounded-[2.5rem] border ${tier.popular ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-slate-900/40 border-white/5'} flex flex-col`}>
                <div className="mb-8">
                  <span className="text-xs font-black font-semibold">{tier.name}</span>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-4xl font-black text-white">$</span>
                    <span className="text-5xl font-black text-white leading-none tracking-tighter">{tier.price}</span>
                    <span className="text-slate-500 text-sm font-bold">/mo</span>
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
                {tier.price === 'Custom' ? (
                  <a href="mailto:onboarding@costloci.com" className="w-full">
                    <Button className={`w-full h-14 rounded-2xl font-black uppercase italic ${tier.popular ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950' : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'}`}>
                      Let's Talk
                    </Button>
                  </a>
                ) : (
                  <Link href="/auth" className="w-full">
                    <Button className={`w-full h-14 rounded-2xl font-black uppercase italic ${tier.popular ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950' : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'}`}>
                      Deploy Instance
                    </Button>
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-5 gap-12">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center border border-emerald-500/30 relative shadow-lg shadow-emerald-500/10">
                 <DiamondIcon className="w-5 h-5" />
              </div>
              <span className="text-xl font-black tracking-tighter text-white uppercase italic">Costloci</span>
            </div>
            <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-sm">
              The Professional Intelligence Standard for the modern regulated enterprise. Engineered for DPOs, MSPs, and Cybersecurity Professionals.
            </p>
          </div>
          <div>
             <h4 className="text-white font-black font-semibold text-xs mb-6 italic">Company</h4>
             <ul className="space-y-4">
                <li><a href="#trust" className="text-slate-500 hover:text-emerald-400 text-xs font-bold uppercase transition-colors">Privacy & Trust</a></li>
                <li><a href="#features" className="text-slate-500 hover:text-emerald-400 text-xs font-bold uppercase transition-colors">Compliance</a></li>
                <li><a href="#pricing" className="text-slate-500 hover:text-emerald-400 text-xs font-bold uppercase transition-colors">ROI & Pricing</a></li>
             </ul>
          </div>
          <div>
             <h4 className="text-white font-black font-semibold text-xs mb-6 italic">Portal</h4>
             <ul className="space-y-4">
                <li><Link href="/auth" className="text-slate-500 hover:text-emerald-400 text-xs font-bold font-semibold">Sign In</Link></li>
                <li><Link href="/auth" className="text-slate-500 hover:text-emerald-400 text-xs font-bold font-semibold">Secure Register</Link></li>
             </ul>
          </div>
          <div>
             <h4 className="text-white font-black font-semibold text-xs mb-6 italic">Connect</h4>
             <ul className="space-y-4 mb-6">
                <li className="flex items-start gap-3 text-slate-500">
                  <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-xs font-bold leading-relaxed">Nairobi, Kenya<br/>10100</span>
                </li>
             </ul>
              <div className="flex items-center gap-4">
                <a href="https://twitter.com/costloci" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-emerald-500/20 hover:scale-110 text-slate-500 hover:text-emerald-400 transition-all">
                  <Twitter className="w-4 h-4" />
                </a>
                <a href="https://linkedin.com/company/costloci" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-emerald-500/20 hover:scale-110 text-slate-500 hover:text-emerald-400 transition-all">
                  <Linkedin className="w-4 h-4" />
                </a>

             </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-20 pt-10 border-t border-white/5 flex flex-col md:row items-center justify-between gap-6">
           <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] italic">© 2026 Costloci Intelligence Inc. Automated Monitoring Active.</p>
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
