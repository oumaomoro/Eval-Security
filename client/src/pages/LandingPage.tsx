import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { 
  CheckCircle2, 
  ShieldCheck, 
  Zap, 
  BarChart3, 
  Globe, 
  Lock, 
  Users, 
  ArrowRight, 
  Star, 
  Twitter, 
  Linkedin, 
  MapPin, 
  DollarSign, 
  Clock, 
  Check, 
  X, 
  ChevronDown, 
  FileText, 
  Sparkles,
  BookOpen
} from "lucide-react";
import { DiamondIcon } from "@/components/DiamondIcon";
import { SEO } from "@/components/SEO";

export default function LandingPage() {
  // ROI Calculator State
  const [annualSpend, setAnnualSpend] = useState<number>(150000);
  const [contractCount, setContractCount] = useState<number>(25);

  const estimatedSavings = Math.round(annualSpend * 0.22);
  const hoursSaved = Math.round(contractCount * 3.5);

  // FAQ State
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Product Tabs State
  const [activeTab, setActiveTab] = useState<"dpo" | "redline" | "savings" | "insurance">("dpo");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500/30">
      <SEO 
        title="AI Cybersecurity Contract Management & Cost Optimization" 
        description="Costloci is the specialized enterprise platform for cybersecurity contract management, KDPA/CBK compliance auditing, and automated vendor cost reduction." 
      />

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center border border-emerald-500/30 relative shadow-lg shadow-emerald-500/10">
              <DiamondIcon className="w-6 h-6 text-emerald-400" />
            </div>
            <span className="text-2xl font-black tracking-tight text-white uppercase italic">Costloci</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#solutions" className="text-sm font-semibold text-slate-400 hover:text-emerald-400 transition-colors">Solutions</a>
            <a href="#calculator" className="text-sm font-semibold text-slate-400 hover:text-emerald-400 transition-colors">ROI Calculator</a>
            <a href="#comparison" className="text-sm font-semibold text-slate-400 hover:text-emerald-400 transition-colors">Why Costloci</a>
            <Link href="/blog" className="text-sm font-semibold text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1">
              Blog
            </Link>
            <a href="#pricing" className="text-sm font-semibold text-slate-400 hover:text-emerald-400 transition-colors">Pricing</a>
            <a href="#faq" className="text-sm font-semibold text-slate-400 hover:text-emerald-400 transition-colors">FAQ</a>
            <Link href="/auth">
              <Button variant="outline" className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300">
                Sign In
              </Button>
            </Link>
            <Link href="/auth">
              <Button className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold">
                Start Free Audit
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-28 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[650px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-8">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Specialized in KDPA 2019, CBK, POPIA, GDPR & ISO 27001
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-tight tracking-tight mb-6 max-w-5xl mx-auto">
              Automate Cybersecurity Contracts. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                Slash 15–30% Off Vendor Spend.
              </span>
            </h1>

            <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed mb-10 font-normal">
              Costloci gives CISOs, DPOs, and procurement leaders instant AI contract intelligence. Correlate insurance liability caps, automate regulatory DPA compliance, and uncover hidden vendor overcharges in minutes.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link href="/auth">
                <Button size="lg" className="h-14 px-8 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-base rounded-xl group transition-all shadow-lg shadow-emerald-500/20">
                  Analyze First Contract Free <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <a href="#calculator">
                <Button size="lg" variant="outline" className="h-14 px-8 border-slate-700 text-slate-200 font-semibold text-base rounded-xl hover:bg-slate-900 transition-all">
                  Calculate Cost Savings
                </Button>
              </a>
            </div>

            {/* Social Proof Badges */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto pt-8 border-t border-slate-800/60">
              <div className="text-center">
                <div className="text-3xl font-extrabold text-white font-mono">$48M+</div>
                <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-medium">Vendor Spend Audited</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-extrabold text-emerald-400 font-mono">22% Avg</div>
                <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-medium">Cost Savings Uncovered</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-extrabold text-white font-mono">80+ Hours</div>
                <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-medium">Saved Per Audit Cycle</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-extrabold text-cyan-400 font-mono">100%</div>
                <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-medium">KDPA & GDPR Alignment</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Interactive ROI Calculator Section */}
      <section id="calculator" className="py-24 bg-slate-900/40 border-y border-slate-800">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              Value Engine
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mt-4">
              Calculate Your Enterprise Cost Savings
            </h2>
            <p className="text-slate-400 text-sm max-w-xl mx-auto mt-2">
              See how much your organization can save on cybersecurity contracts, vendor licenses, and compliance reviews.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-slate-900/90 border border-slate-800 p-8 rounded-3xl shadow-xl">
            {/* Input Sliders */}
            <div className="lg:col-span-7 space-y-8">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-semibold text-slate-300">Annual Software & Cybersecurity Spend</label>
                  <span className="text-lg font-bold text-emerald-400 font-mono">${annualSpend.toLocaleString()}</span>
                </div>
                <Slider 
                  value={[annualSpend]} 
                  onValueChange={(val) => setAnnualSpend(val[0])}
                  min={25000} 
                  max={2000000} 
                  step={25000} 
                  className="py-4"
                />
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>$25,000</span>
                  <span>$1,000,000</span>
                  <span>$2,000,000+</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-semibold text-slate-300">Active Vendor Contracts & DPAs</label>
                  <span className="text-lg font-bold text-cyan-400 font-mono">{contractCount} Agreements</span>
                </div>
                <Slider 
                  value={[contractCount]} 
                  onValueChange={(val) => setContractCount(val[0])}
                  min={5} 
                  max={150} 
                  step={5} 
                  className="py-4"
                />
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>5 Contracts</span>
                  <span>75 Contracts</span>
                  <span>150+ Contracts</span>
                </div>
              </div>
            </div>

            {/* Results Card */}
            <div className="lg:col-span-5 bg-slate-950 border border-emerald-500/30 p-6 rounded-2xl text-center space-y-6">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Projected Annual Cost Reduction
                </span>
                <span className="text-4xl font-extrabold text-emerald-400 font-mono">
                  ${estimatedSavings.toLocaleString()}
                </span>
                <span className="text-xs text-slate-400 block mt-1">Based on benchmark 22% optimization</span>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-around text-center">
                <div>
                  <span className="text-xl font-bold text-white font-mono">{hoursSaved} hrs</span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">Audit Time Saved</span>
                </div>
                <div className="border-l border-slate-800 pl-4">
                  <span className="text-xl font-bold text-cyan-400 font-mono">&lt; 30 Days</span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">Payback Period</span>
                </div>
              </div>

              <Link href="/auth" className="block w-full">
                <Button className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold h-12 rounded-xl">
                  Unlock These Savings Now <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Head-to-Head Competitor Comparison Matrix */}
      <section id="comparison" className="py-28 max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
            Market Differentiation
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mt-4">
            Why Generic CLMs Fail Cybersecurity Teams
          </h2>
          <p className="text-slate-400 text-base max-w-2xl mx-auto mt-3">
            Legacy tools treat contracts like static text. Costloci is purpose-built to correlate compliance mandates, cyber liability caps, and actual cost benchmarks.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border border-slate-800 rounded-2xl overflow-hidden bg-slate-900/60">
            <thead>
              <tr className="bg-slate-900 border-b border-slate-800 text-sm font-semibold">
                <th className="p-5 text-slate-300">Platform Capability</th>
                <th className="p-5 text-emerald-400 font-bold text-base bg-emerald-500/10 border-x border-emerald-500/20">
                  Costloci (Enterprise Intelligence)
                </th>
                <th className="p-5 text-slate-400">Generic CLM (Ironclad / PandaDoc)</th>
                <th className="p-5 text-slate-400">External Legal Counsel</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-sm">
              <tr>
                <td className="p-5 font-semibold text-white">
                  Native KDPA (Kenya) & CBK Guidelines
                  <span className="block text-xs font-normal text-slate-400 mt-1">Cross-border transfer rules, 72-hour breach clauses</span>
                </td>
                <td className="p-5 bg-emerald-500/5 border-x border-emerald-500/20 font-bold text-emerald-400 flex items-center gap-2">
                  <Check className="w-5 h-5 text-emerald-400 shrink-0" /> Native 2026 Direct Rulesets
                </td>
                <td className="p-5 text-slate-400 flex items-center gap-2">
                  <X className="w-5 h-5 text-red-400 shrink-0" /> None (US/EU templates only)
                </td>
                <td className="p-5 text-slate-300">
                  Manual Review ($350 - $600/hr)
                </td>
              </tr>

              <tr>
                <td className="p-5 font-semibold text-white">
                  Cyber Insurance Liability Correlation
                  <span className="block text-xs font-normal text-slate-400 mt-1">Ensures contract indemnity caps match insurance limits</span>
                </td>
                <td className="p-5 bg-emerald-500/5 border-x border-emerald-500/20 font-bold text-emerald-400 flex items-center gap-2">
                  <Check className="w-5 h-5 text-emerald-400 shrink-0" /> Automated Gap Mapping
                </td>
                <td className="p-5 text-slate-400 flex items-center gap-2">
                  <X className="w-5 h-5 text-red-400 shrink-0" /> Unsupported
                </td>
                <td className="p-5 text-slate-300">
                  Requires separate broker audit
                </td>
              </tr>

              <tr>
                <td className="p-5 font-semibold text-white">
                  Autonomous Redlining Studio
                  <span className="block text-xs font-normal text-slate-400 mt-1">Instant legally enforceable amendment generation</span>
                </td>
                <td className="p-5 bg-emerald-500/5 border-x border-emerald-500/20 font-bold text-emerald-400 flex items-center gap-2">
                  <Check className="w-5 h-5 text-emerald-400 shrink-0" /> 1-Click Enforceable Clauses
                </td>
                <td className="p-5 text-slate-400 flex items-center gap-2">
                  <X className="w-5 h-5 text-red-400 shrink-0" /> Manual inline comments only
                </td>
                <td className="p-5 text-slate-300">
                  3–7 Business Days Turnaround
                </td>
              </tr>

              <tr>
                <td className="p-5 font-semibold text-white">
                  Proactive Cost Optimization Engine
                  <span className="block text-xs font-normal text-slate-400 mt-1">Identifies license waste, redundancies, and market overcharges</span>
                </td>
                <td className="p-5 bg-emerald-500/5 border-x border-emerald-500/20 font-bold text-emerald-400 flex items-center gap-2">
                  <Check className="w-5 h-5 text-emerald-400 shrink-0" /> 15–30% Verified Savings
                </td>
                <td className="p-5 text-slate-400 flex items-center gap-2">
                  <X className="w-5 h-5 text-red-400 shrink-0" /> No cost benchmarking
                </td>
                <td className="p-5 text-slate-300">
                  No market pricing data
                </td>
              </tr>

              <tr>
                <td className="p-5 font-semibold text-white">
                  Continuous Regulatory Drift Alerting
                  <span className="block text-xs font-normal text-slate-400 mt-1">Alerts when statutory standards or court precedents change</span>
                </td>
                <td className="p-5 bg-emerald-500/5 border-x border-emerald-500/20 font-bold text-emerald-400 flex items-center gap-2">
                  <Check className="w-5 h-5 text-emerald-400 shrink-0" /> 24/7 Autonomic Monitoring
                </td>
                <td className="p-5 text-slate-400 flex items-center gap-2">
                  <X className="w-5 h-5 text-red-400 shrink-0" /> Static repository
                </td>
                <td className="p-5 text-slate-300">
                  Only when requested
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Solutions / Core Modules */}
      <section id="solutions" className="py-24 bg-slate-900/30 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              Complete Architecture
            </span>
            <h2 className="text-3xl md:text-5xl font-extrabold text-white mt-4">
              Built for High-Stakes Security Governance
            </h2>
            <p className="text-slate-400 text-base max-w-2xl mx-auto mt-3">
              One unified platform providing end-to-end intelligence from the first vendor draft to ongoing audit defense.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-slate-900 border-slate-800 hover:border-emerald-500/40 transition-all p-6 rounded-2xl">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-6 border border-emerald-500/20">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">KDPA & CBK Compliance Sentinel</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Automated auditing for Kenya Data Protection Act 2019 Section 25 & 50 compliance, Central Bank cybersecurity guidelines, and international transfers.
              </p>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Mandatory DPA clause verification</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> 72-hour breach notification checks</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Data localization requirements</li>
              </ul>
            </Card>

            <Card className="bg-slate-900 border-slate-800 hover:border-cyan-500/40 transition-all p-6 rounded-2xl">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-6 border border-cyan-500/20">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Autonomous Redline Studio</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Don't just detect contract flaws—fix them. Instantly inject pre-approved legal language that protects your client liabilities without alienating vendors.
              </p>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> Balanced favorable drafting</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> Standard clause library integration</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> Word / PDF redline exports</li>
              </ul>
            </Card>

            <Card className="bg-slate-900 border-slate-800 hover:border-amber-500/40 transition-all p-6 rounded-2xl">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 mb-6 border border-amber-500/20">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Vendor Spend & Benchmarking</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Compare vendor pricing against regional market rates across East Africa, identifying seat redundancies, duplicate tooling, and renewal traps.
              </p>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-400" /> Automatic renewal date tracking</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-400" /> 15–30% average cost savings</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-400" /> Executive ROI reporting</li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-28 max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            Transparent Pricing
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mt-4">
            Invest in Protection. Earn Positive ROI.
          </h2>
          <p className="text-slate-400 text-base max-w-xl mx-auto mt-3">
            Simple tiers that pay for themselves in your very first renegotiated contract.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Starter Tier */}
          <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Starter</span>
              <div className="flex items-baseline gap-1 mt-4">
                <span className="text-4xl font-extrabold text-white font-mono">$99</span>
                <span className="text-slate-400 text-sm">/month</span>
              </div>
              <p className="text-xs text-slate-400 mt-2">Ideal for growing teams & small DPO departments.</p>

              <ul className="space-y-3 mt-8 text-xs text-slate-300">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Up to 20 Active Contracts</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> KDPA & GDPR Compliance Audit</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Automated Risk Register</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Basic Cost Optimization</li>
              </ul>
            </div>

            <div className="mt-8">
              <Link href="/auth" className="w-full">
                <Button className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold h-12 rounded-xl">
                  Get Started Free
                </Button>
              </Link>
            </div>
          </div>

          {/* Business Pro Tier (Featured) */}
          <div className="p-8 rounded-3xl bg-slate-900 border-2 border-emerald-500 relative flex flex-col justify-between shadow-2xl shadow-emerald-500/10">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-emerald-500 text-slate-950 font-extrabold text-[10px] uppercase tracking-wider px-3 py-1 rounded-full">
              Most Popular
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Professional</span>
              <div className="flex items-baseline gap-1 mt-4">
                <span className="text-5xl font-extrabold text-white font-mono">$299</span>
                <span className="text-slate-400 text-sm">/month</span>
              </div>
              <p className="text-xs text-slate-400 mt-2">For mid-market enterprises, banks, and MSPs.</p>

              <ul className="space-y-3 mt-8 text-xs text-slate-200">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Up to 200 Contracts & DPAs</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Autonomous Redline Studio</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Cyber Insurance Liability Check</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Continuous Regulatory Drift Alerting</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Exportable Audit Evidence Packs</li>
              </ul>
            </div>

            <div className="mt-8">
              <Link href="/auth" className="w-full">
                <Button className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold h-12 rounded-xl shadow-lg shadow-emerald-500/20">
                  Deploy Pro Instance
                </Button>
              </Link>
            </div>
          </div>

          {/* Enterprise Tier */}
          <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Enterprise</span>
              <div className="flex items-baseline gap-1 mt-4">
                <span className="text-4xl font-extrabold text-white font-mono">$999</span>
                <span className="text-slate-400 text-sm">/month</span>
              </div>
              <p className="text-xs text-slate-400 mt-2">Full governance for large financial institutions & telcos.</p>

              <ul className="space-y-3 mt-8 text-xs text-slate-300">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Unlimited Contracts & Workspaces</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Custom Compliance Ruleset Builder</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> REST API & SIEM Webhook Feeds</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Dedicated Legal Engineer & 24/7 SLA</li>
              </ul>
            </div>

            <div className="mt-8">
              <Link href="/auth" className="w-full">
                <Button className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold h-12 rounded-xl">
                  Contact Enterprise Sales
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section id="faq" className="py-24 bg-slate-900/30 border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              Clear Answers
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mt-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "How does Costloci protect the confidential data in our uploaded contracts?",
                a: "All documents uploaded to Costloci are encrypted in-transit (TLS 1.3) and at-rest using AES-256 zero-knowledge encryption. Our AI analysis operates in private enterprise inference mode—your contracts are NEVER used to train models or shared across tenants."
              },
              {
                q: "What makes Costloci different from standard contract management software?",
                a: "General CLMs simply store files and manage signatures. Costloci is an AI security and compliance platform: we parse contracts for specific regulatory liabilities (KDPA 2019, CBK, GDPR, POPIA), verify that your indemnity terms match your actual cyber insurance policy, and detect market overcharges."
              },
              {
                q: "Does Costloci support regional compliance like Kenya's Data Protection Act (KDPA)?",
                a: "Yes. Costloci was built with first-class support for East African and Pan-African regulations, including KDPA Section 25 (processor obligations), Section 50 (cross-border transfers), Central Bank of Kenya (CBK) cybersecurity guidelines, and South Africa's POPIA."
              },
              {
                q: "Can we export reports for our annual regulatory audit or Board meetings?",
                a: "Absolutely. With one click from the DPO Command Center or Reporting Bureau, Costloci generates comprehensive, executive-ready PDF evidence packs showing your complete compliance posture, risk register, and identified cost reductions."
              },
              {
                q: "What payment methods are supported for subscriptions?",
                a: "We support M-Pesa and local card payments via Paystack across East Africa, as well as global PayPal and Stripe card payments in USD."
              }
            ].map((faq, i) => (
              <div 
                key={i} 
                className="border border-slate-800 bg-slate-900/80 rounded-2xl overflow-hidden transition-colors hover:border-slate-700"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full text-left p-6 font-semibold text-white flex justify-between items-center gap-4"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-emerald-400 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="px-6 pb-6 text-sm text-slate-400 leading-relaxed border-t border-slate-800/40 pt-4"
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-slate-800 bg-slate-950">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center border border-emerald-500/30">
                <DiamondIcon className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-xl font-black text-white uppercase italic">Costloci</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              The AI Contract Intelligence standard for regulated enterprises, DPOs, and cybersecurity leaders across Africa and global markets.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Platform</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><a href="#solutions" className="hover:text-emerald-400 transition-colors">KDPA Compliance Audit</a></li>
              <li><a href="#solutions" className="hover:text-emerald-400 transition-colors">Autonomous Redline Studio</a></li>
              <li><a href="#solutions" className="hover:text-emerald-400 transition-colors">Cyber Insurance Gap Check</a></li>
              <li><a href="#calculator" className="hover:text-emerald-400 transition-colors">Cost Optimization Engine</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Resources & Blog</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><Link href="/blog" className="hover:text-emerald-400 transition-colors">Contract Governance Blog</Link></li>
              <li><Link href="/blog/kdpa-compliance-guide" className="hover:text-emerald-400 transition-colors">KDPA 2019 Guide for DPOs</Link></li>
              <li><Link href="/blog/cbk-cybersecurity-guidelines" className="hover:text-emerald-400 transition-colors">CBK Guidelines for FinTechs</Link></li>
              <li><a href="#pricing" className="hover:text-emerald-400 transition-colors">Pricing & ROI</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Contact & Headquarters</h4>
            <div className="space-y-3 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Nairobi, Kenya • East Africa Hub</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-300">Sales:</span>
                <span>sales@costloci.com</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-300">Support:</span>
                <span>support@costloci.com</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 Costloci Intelligence Inc. All rights reserved. Zero-Trust Architecture.</p>
          <div className="flex items-center gap-6">
            <Link href="/auth" className="hover:text-slate-300">Terms of Service</Link>
            <Link href="/auth" className="hover:text-slate-300">Privacy Policy</Link>
            <Link href="/auth" className="hover:text-slate-300">KDPA Compliance Statement</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
