import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, ShieldCheck, Zap, BarChart3, Globe, Star, ArrowRight, Twitter, Linkedin, Github, MapPin } from "lucide-react";
import { DiamondIcon } from "@/components/DiamondIcon";
import { SEO } from "@/components/SEO";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-cyan-500/30">
      <SEO title="CyberOptimize | AI Cybersecurity Contract Management" description="CyberOptimize provides AI-driven contract governance, automated compliance (KDPA, GDPR, ISO27001), and cost optimization for cybersecurity teams." />

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center border border-cyan-500/30 relative shadow-lg shadow-cyan-500/10">
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
             </div>
             <span className="text-xl font-bold tracking-tight text-white">CyberOptimize</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-semibold text-slate-400 hover:text-cyan-400 transition-colors">Features</a>
            <a href="#compliance" className="text-sm font-semibold text-slate-400 hover:text-cyan-400 transition-colors">Compliance</a>
            <a href="#pricing" className="text-sm font-semibold text-slate-400 hover:text-cyan-400 transition-colors">Pricing</a>
            <Link href="/auth">
              <Button variant="outline" className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-semibold tracking-wide mb-8">
              <Zap className="w-4 h-4 animate-pulse" /> AI-Powered Contract Intelligence
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight tracking-tight mb-6 max-w-5xl mx-auto">
              Transform Cybersecurity <br />
              <span className="text-cyan-500 drop-shadow-[0_0_30px_rgba(6,182,212,0.4)]">Contract Management</span>
            </h1>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed mb-10 font-medium">
              Accelerate contract workflows, automatically map compliance to ISO 27001, GDPR, and KDPA, and reduce risk exposure with intelligent risk scoring.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link href="/auth">
                <Button size="lg" className="h-16 px-10 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-lg rounded-xl shadow-[0_10px_30px_rgba(6,182,212,0.3)] group transition-all active:scale-95">
                  Get Started Free <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="h-16 px-10 border-white/10 text-white font-bold text-lg rounded-xl hover:bg-white/5 backdrop-blur-sm transition-all">
                Book a Demo
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust Grid */}
      <section id="compliance" className="py-24 border-y border-white/5 bg-slate-900/20">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-sm font-semibold text-slate-500 uppercase tracking-widest mb-12">Automated Compliance Mapping For</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {[
              { name: "KDPA", region: "Data Protection", color: "text-cyan-500" },
              { name: "GDPR", region: "EU Standard", color: "text-blue-500" },
              { name: "ISO 27001", region: "Security standard", color: "text-emerald-500" },
              { name: "CBK", region: "Financial standard", color: "text-amber-500" },
            ].map((badge, i) => (
              <div key={i} className="flex flex-col items-center justify-center grayscale hover:grayscale-0 transition-all opacity-60 hover:opacity-100 cursor-pointer">
                <ShieldCheck className={`w-10 h-10 mb-3 ${badge.color}`} />
                <span className="text-lg font-bold tracking-tight">{badge.name}</span>
                <span className="text-xs text-slate-500 font-medium mt-1">{badge.region}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features/Solutions */}
      <section id="features" className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {[
              {
                title: "AI Contract Analysis",
                description: "Extract dates, SLAs, liability limits, and automatically assess cybersecurity provisions across your vendor portfolio.",
                icon: Zap,
                features: ["Automated Data Extraction", "SLA Monitoring", "Clause Benchmarking"]
              },
              {
                title: "Risk Intelligence",
                description: "Identify compliance gaps, predict risk scores, and mitigate vulnerabilities before they become liabilities.",
                icon: ShieldCheck,
                features: ["Granular Risk Matrix", "Financial Exposure Est.", "Remediation Playbooks"]
              },
              {
                title: "Cost Optimization",
                description: "Automatically discover savings opportunities, vendor redundancies, and compare pricing against market benchmarks.",
                icon: BarChart3,
                features: ["Vendor Consolidation", "License Optimization", "Market Benchmarking"]
              }
            ].map((feature, i) => (
              <Card key={i} className="bg-slate-900/50 border-white/10 p-8 rounded-2xl hover:border-cyan-500/30 transition-all group overflow-hidden relative">
                <div className="absolute -right-10 -top-10 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl group-hover:bg-cyan-500/20 transition-colors" />
                <CardContent className="p-0 relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-slate-950 border border-cyan-500/30 flex items-center justify-center mb-6 text-cyan-400">
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-slate-400 mb-8 font-medium leading-relaxed text-sm">
                    {feature.description}
                  </p>
                  <ul className="space-y-3">
                    {feature.features.map((f, j) => (
                      <li key={j} className="flex items-center gap-3 text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
                        <CheckCircle2 className="w-4 h-4 text-cyan-500" /> {f}
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
      <section id="pricing" className="py-32 bg-slate-900/20 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Transparent Pricing</h2>
            <p className="text-slate-400 font-medium max-w-2xl mx-auto">Scale your compliance and optimization effortlessly.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { name: "Starter", price: "99", desc: "Up to 50 active contracts.", features: ["AI Contract Review", "Compliance Mapping", "Risk Dashboard"] },
              { name: "Professional", price: "299", desc: "Up to 200 contracts with full features.", features: ["Cost Optimization", "Vendor Benchmarking", "Custom Reporting"], popular: true },
              { name: "Enterprise", price: "999", desc: "Unlimited contracts & custom rules.", features: ["API Access", "White-label Portal", "Dedicated Account Manager"] }
            ].map((tier, i) => (
              <div key={i} className={`p-8 rounded-2xl border ${tier.popular ? 'bg-cyan-950/30 border-cyan-500/50 relative shadow-2xl shadow-cyan-900/20' : 'bg-slate-900/40 border-white/10'} flex flex-col`}>
                {tier.popular && <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-cyan-500 text-slate-950 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Most Popular</div>}
                <div className="mb-8 mt-2">
                  <span className="text-lg font-semibold text-slate-200">{tier.name}</span>
                  <div className="flex items-baseline gap-1 mt-3">
                    <span className="text-3xl font-bold text-white">$</span>
                    <span className="text-5xl font-bold text-white leading-none">{tier.price}</span>
                    <span className="text-slate-400 font-medium">/mo</span>
                  </div>
                  <p className="text-sm text-slate-400 mt-4 font-medium">{tier.desc}</p>
                </div>
                <div className="space-y-4 mb-10 flex-1">
                  {tier.features.map((f, j) => (
                    <div key={j} className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-cyan-500" />
                      <span className="text-sm font-medium text-slate-300">{f}</span>
                    </div>
                  ))}
                </div>
                {tier.name === 'Enterprise' ? (
                  <a href="mailto:sales@cyberoptimize.ai" className="w-full">
                    <Button className={`w-full h-12 rounded-xl font-bold ${tier.popular ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950' : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'}`}>
                      Let's Talk
                    </Button>
                  </a>
                ) : (
                  <Link href="/auth" className="w-full">
                    <Button className={`w-full h-12 rounded-xl font-bold ${tier.popular ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950' : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'}`}>
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
      <footer className="py-16 border-t border-white/5 bg-slate-950">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <ShieldCheck className="w-6 h-6 text-cyan-400" />
              <span className="text-xl font-bold text-white">CyberOptimize</span>
            </div>
            <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-sm">
              Empowering organizations to securely manage cybersecurity contracts, ensure continuous compliance, and mitigate risks with AI intelligence.
            </p>
          </div>
          <div>
             <h4 className="text-white font-semibold text-sm mb-6">Product</h4>
             <ul className="space-y-4">
                <li><a href="#features" className="text-slate-400 hover:text-cyan-400 text-sm font-medium transition-colors">Features</a></li>
                <li><a href="#compliance" className="text-slate-400 hover:text-cyan-400 text-sm font-medium transition-colors">Compliance</a></li>
                <li><a href="#pricing" className="text-slate-400 hover:text-cyan-400 text-sm font-medium transition-colors">Pricing</a></li>
             </ul>
          </div>
          <div>
             <h4 className="text-white font-semibold text-sm mb-6">Company</h4>
             <ul className="space-y-4">
                <li><Link href="/auth" className="text-slate-400 hover:text-cyan-400 text-sm font-medium">Access Portal</Link></li>
                <li><a href="mailto:sales@cyberoptimize.ai" className="text-slate-400 hover:text-cyan-400 text-sm font-medium">Contact Sales</a></li>
             </ul>
          </div>
          <div>
             <h4 className="text-white font-semibold text-sm mb-6">Connect</h4>
             <ul className="space-y-4 mb-6">
                <li className="flex items-start gap-3 text-slate-400">
                  <MapPin className="w-5 h-5 text-cyan-500 shrink-0" />
                  <span className="text-sm font-medium leading-relaxed">123 Security Blvd<br/>Cyber City, CC 10010</span>
                </li>
             </ul>
             <div className="flex items-center gap-4">
                <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-cyan-500/20 hover:scale-110 text-slate-400 hover:text-cyan-400 transition-all">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-cyan-500/20 hover:scale-110 text-slate-400 hover:text-cyan-400 transition-all">
                  <Linkedin className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-cyan-500/20 hover:scale-110 text-slate-400 hover:text-cyan-400 transition-all">
                  <Github className="w-5 h-5" />
                </a>
             </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
           <p className="text-xs font-medium text-slate-500">© 2026 CyberOptimize AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
