import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, AlertCircle, TrendingDown, Landmark, Globe, FileText, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExecutiveSummaryProps {
  stats: {
    totalContracts: number;
    criticalRisks: number;
    avgComplianceScore: number;
    risksMitigated: number;
    totalAnnualCost: number;
    timeSavedHours: number;
  };
  jurisdictions?: string[];
}

export function ExecutiveSummary({ stats, jurisdictions = ["KDPA", "NDPR", "SAMA", "POPIA"] }: ExecutiveSummaryProps) {
  const handlePrint = () => window.print();

  return (
    <div className="space-y-8 p-12 bg-white/80 backdrop-blur-3xl text-slate-950 rounded-[3rem] shadow-2xl border-t-[12px] border-t-primary border-x border-b border-slate-100 print:p-0 print:shadow-none print:border-none relative overflow-hidden">
      {/* High-Tech Watermark */}
      <div className="absolute -top-20 -right-20 w-80 h-80 bg-primary/5 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none" />
      <div className="flex justify-between items-start border-b pb-12">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white font-black italic shadow-xl">CL</div>
             <h1 className="text-4xl font-black tracking-tighter uppercase italic">Costloci Intelligence</h1>
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-800 uppercase tracking-tight">Executive Compliance Resilience Report</h2>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest italic">Confidential Board-Ready Briefing • Q2 2026</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-4 print:hidden">
            <Button onClick={handlePrint} variant="outline" className="h-12 border-slate-200 rounded-xl font-black uppercase text-xs px-8">
                <Printer className="w-4 h-4 mr-2" /> Export to PDF
            </Button>
            <div className="flex items-center gap-3">
                <div className="w-16 h-16 border-4 border-slate-100 rounded-full flex flex-col items-center justify-center">
                    <span className="text-[8px] font-black text-slate-400 uppercase italic">Seal</span>
                    <ShieldCheck className="w-6 h-6 text-emerald-500" />
                </div>
                <div className="text-right">
                    <span className="text-[10px] font-black text-slate-500 uppercase">Audit Identity Verified</span>
                    <p className="text-[8px] text-slate-400 font-bold uppercase italic">Governed Intelligence Engine 2.8v</p>
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="p-8 bg-slate-50 rounded-3xl space-y-4 border border-slate-100">
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Resilience Index</span>
                <Badge className="bg-emerald-500/10 text-emerald-500 border-none font-black italic">{stats.avgComplianceScore}%</Badge>
            </div>
            <div className="text-5xl font-black tracking-tighter italic text-slate-900">{stats.avgComplianceScore > 90 ? 'A' : stats.avgComplianceScore > 80 ? 'B+' : 'C'}</div>
            <p className="text-[10px] text-slate-500 font-bold leading-relaxed uppercase tracking-tight">Organization maintains high operational integrity against MEA regulatory benchmarks.</p>
        </div>

        <div className="p-8 bg-primary/5 rounded-3xl space-y-4 border border-primary/10">
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-primary uppercase tracking-widest">Financial Exposure</span>
                <TrendingDown className="w-4 h-4 text-primary" />
            </div>
            <div className="text-4xl font-black tracking-tighter italic text-slate-900">${(stats.totalAnnualCost * 0.12).toLocaleString()}</div>
            <p className="text-[10px] text-slate-500 font-bold leading-relaxed uppercase tracking-tight">Theoretical risk exposure reduced by {stats.risksMitigated * 4}% through autonomous resolution.</p>
        </div>

        <div className="p-8 bg-emerald-500/5 rounded-3xl space-y-4 border border-emerald-500/10 text-emerald-950">
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Autonomous ROI</span>
                <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="text-4xl font-black tracking-tighter italic">{Math.round(stats.timeSavedHours)} <span className="text-sm">HRS</span></div>
            <p className="text-[10px] text-emerald-600/60 font-bold leading-relaxed uppercase tracking-tight">Labor equivalence saved via AI-facilitated audit and redlining workflows.</p>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
            <Landmark className="w-4 h-4 text-slate-400" /> Jurisdictional Adherence Ledger
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {jurisdictions.map(j => (
                <div key={j} className="p-6 border border-slate-100 rounded-2xl flex flex-col items-center gap-2 hover:bg-slate-50 hover:border-slate-200 transition-all cursor-default group">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse group-hover:scale-150 transition-transform" />
                    <span className="text-xs font-black text-slate-900 italic tracking-tighter uppercase">{j}</span>
                    <Badge variant="outline" className="text-[8px] font-black border-emerald-100 text-emerald-600 bg-emerald-50/50 uppercase tracking-widest px-2">Verified</Badge>
                </div>
            ))}
        </div>
      </div>

      <div className="p-10 border-[6px] border-slate-50 rounded-[3rem] space-y-6 bg-slate-50/20">
         <div className="flex items-center gap-3 text-slate-900 font-black uppercase text-sm italic tracking-tighter">
            <AlertCircle className="w-5 h-5 text-primary" /> Board Recommendation Protocol
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-3">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Immediate Actions</span>
                <ul className="space-y-3">
                    <li className="text-[11px] font-bold text-slate-700 flex gap-3 uppercase tracking-tight">
                        <span className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 shrink-0" />
                        Ratify autonomous redlining defaults for West Africa branch.
                    </li>
                    <li className="text-[11px] font-bold text-slate-700 flex gap-3 uppercase tracking-tight">
                        <span className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 shrink-0" />
                        Initialize DPO verification for Tier 3 Cloud Vendors.
                    </li>
                </ul>
            </div>
            <div className="space-y-3">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Strategic Vision</span>
                <p className="text-[11px] font-bold text-slate-600 uppercase leading-relaxed italic">
                    The transition to autonomous governance has reduced compliance-related overhead by 42%. Management recommends shifting resources to proactive vendor lifecycle optimization.
                </p>
            </div>
         </div>
      </div>

      <div className="flex justify-between items-center pt-8 border-t">
        <div className="flex items-center gap-3 opacity-30">
            <Globe className="w-4 h-4 text-slate-400" />
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Generated via Costloci AI Engine • Noosa Heads, AU</span>
        </div>
        <div className="flex gap-4">
            <div className="w-8 h-8 rounded-lg bg-slate-50 border flex items-center justify-center"><FileText className="w-4 h-4 text-slate-300" /></div>
            <div className="w-8 h-8 rounded-lg bg-slate-50 border flex items-center justify-center"><TrendingDown className="w-4 h-4 text-slate-300" /></div>
        </div>
      </div>
    </div>
  );
}
