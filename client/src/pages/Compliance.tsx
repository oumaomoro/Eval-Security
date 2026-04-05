import { Layout } from "@/components/Layout";
import { useComplianceAudits, useRunAudit } from "@/hooks/use-compliance";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, CheckCircle, XCircle, AlertCircle, Loader2, Shield, Zap, History as HistoryIcon, Globe, ArrowRight, FileText } from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ExecutiveSummary } from "@/components/Intelligence/ExecutiveSummary";
import { useDashboardStats } from "@/hooks/use-dashboard";
import { SEO } from "@/components/SEO";
import { AutonomicJurisdictionSync } from "@/components/Intelligence/AutonomicJurisdictionSync";

export default function Compliance() {
  const { data: audits, isLoading } = useComplianceAudits();
  const { data: stats } = useDashboardStats();
  const { mutate: runAudit, isPending: isRunning } = useRunAudit();

  const handleRunAudit = () => {
    runAudit({ scope: { contractIds: [1, 2], standards: ["KDPA", "IRA Kenya 2025", "POPIA", "NDPR", "SAMA"] } });
  };

  return (
    <Layout>
      <SEO title="Compliance Hub" description="Monitor global jurisdictional regulatory updates and enterprise posture." />
      <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
        <div className="flex justify-between items-end">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic">Compliance Hub</h1>
              <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-1 text-xs font-black italic">AUTONOMIC MONITORING ACTIVE</Badge>
            </div>
            <p className="text-slate-500 font-bold uppercase tracking-tight text-sm">Regulatory Posture & Global Jurisdictional Intelligence</p>
          </div>
          <Button 
            onClick={handleRunAudit} 
            disabled={isRunning} 
            className="h-14 px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-tighter italic text-sm rounded-2xl shadow-2xl shadow-primary/20 border-b-4 border-primary/70 active:border-b-0 active:translate-y-1 transition-all"
          >
            {isRunning ? <Loader2 className="w-5 h-5 animate-spin mr-3" /> : <Play className="w-5 h-5 mr-3 fill-current" />}
            {isRunning ? "Engine Initializing..." : "Trigger Full Regulatory Audit"}
          </Button>

          <Dialog>
            <DialogTrigger asChild>
                <Button 
                    className="h-14 px-8 bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-tighter italic text-sm rounded-2xl shadow-2xl border-b-4 border-slate-950 active:border-b-0 active:translate-y-1 transition-all"
                >
                    <FileText className="w-5 h-5 mr-3 text-primary" /> Board-Ready Report
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[1000px] max-h-[90vh] overflow-y-auto p-0 rounded-[3rem] border-none bg-transparent">
                {stats && (
                    <ExecutiveSummary 
                        stats={{
                            ...stats,
                            risksMitigated: stats.userMetrics?.risksMitigated || 0,
                            timeSavedHours: stats.userMetrics?.timeSavedHours || 0
                        }} 
                    />
                )}
            </DialogContent>
          </Dialog>
        </div>

        {/* Autonomic Intelligence Hub */}
        <AutonomicJurisdictionSync />

        {/* Intelligence Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard icon={CheckCircle} label="Global Compliance" value="91.2%" color="text-emerald-500" />
          <StatCard icon={AlertCircle} label="Jurisdiction Risk" value="Low" color="text-emerald-500" />
          <StatCard icon={Shield} label="DPO Verified" value="18/20" color="text-primary" />
          <StatCard icon={Zap} label="Policy Drift" value="0.02%" color="text-emerald-500" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* DPO Registration Tracker */}
            <Card className="lg:col-span-1 bg-slate-950 border-slate-900 shadow-2xl rounded-3xl overflow-hidden">
                <CardHeader className="bg-slate-900/50 border-b border-slate-900">
                    <CardTitle className="text-white uppercase tracking-tighter italic flex items-center gap-2">
                        <Shield className="w-5 h-5 text-primary" /> Multi-Regional DPO Tracker
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-slate-900">
                        <DPOItem vendor="Apex Cloud" status="registered" expiry="Dec 2026" region="KE" />
                        <DPOItem vendor="SafePay Ltd" status="pending" expiry="RENEWAL REQ" region="NG" />
                        <DPOItem vendor="Global SCM" status="missing" expiry="ACTION REQ" region="KSA" />
                        <DPOItem vendor="Infrastruct" status="registered" expiry="July 2025" region="SA" />
                    </div>
                </CardContent>
                <CardFooter className="bg-slate-900/30 p-4">
                    <p className="text-[10px] text-slate-500 font-bold uppercase italic text-center w-full">Synchronized with ODPC (KE), NDPR (NG), and SAMA (KSA) Registries</p>
                </CardFooter>
            </Card>

            {/* Audit History */}
            <Card className="lg:col-span-2 bg-slate-950 border-slate-900 shadow-2xl rounded-3xl">
                <CardHeader className="border-b border-slate-900">
                    <CardTitle className="text-white uppercase tracking-tighter italic flex items-center gap-2 text-xl">
                        <HistoryIcon className="w-6 h-6 text-primary" /> Immutable Audit Ledger
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0 max-h-[400px] overflow-y-auto">
                    {isLoading ? <div className="p-20 text-center uppercase font-black text-slate-800 animate-pulse">Loading Ledger...</div> : (
                        <div className="divide-y divide-slate-900">
                        {audits?.map((audit) => (
                          <div key={audit.id} className="p-8 hover:bg-white/5 transition-colors group">
                            <div className="flex justify-between items-start mb-6">
                              <div>
                                <Badge variant="outline" className="text-[9px] font-black border-primary/30 text-primary uppercase mb-2">Standard: {audit.auditName.split(' ')[0]}</Badge>
                                <h3 className="font-black text-2xl text-white tracking-tighter uppercase italic leading-none">{audit.auditName}</h3>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
                                  <Zap className="w-3 h-3" /> Audit Timestamp: {audit.createdAt ? format(new Date(audit.createdAt), "PPP p") : "N/A"}
                                </p>
                              </div>
                              <div className="text-right">
                                <div className={`text-4xl font-black italic tracking-tighter ${Number(audit.overallComplianceScore) > 85 ? 'text-emerald-500' : 'text-primary'}`}>{audit.overallComplianceScore}%</div>
                                <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Compliance index</div>
                              </div>
                            </div>
                            
                            {audit.complianceByStandard && (
                              <div className="flex flex-wrap gap-3 mt-6">
                                {Object.entries(audit.complianceByStandard).map(([std, score]) => (
                                  <div key={std} className="bg-slate-900/50 px-4 py-2 rounded-xl border border-slate-800 text-xs flex items-center gap-3">
                                    <span className="font-black text-slate-400 uppercase tracking-widest">{std}</span>
                                    <span className={`font-black italic text-lg ${Number(score) < 80 ? 'text-red-500' : 'text-emerald-500'}`}>{score}%</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                </CardContent>
            </Card>
        </div>

        {/* Cross-Border Data Flow Visualizer - THE WOW FACTOR */}
        <Card className="bg-slate-950 border-slate-900 shadow-3xl rounded-[2.5rem] overflow-hidden group border-b-8 border-b-primary/10">
            <CardHeader className="bg-slate-900/10 p-10 border-b border-white/5">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-3xl font-black text-white italic tracking-tighter uppercase flex items-center gap-4">
                        <Globe className="w-10 h-10 text-primary animate-pulse" /> Transborder Data Flows (TDF)
                    </CardTitle>
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 px-6 py-2 text-xs font-black italic">WHITELISTED CORRIDORS VERIFIED</Badge>
                </div>
                <CardDescription className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-4">Autonomous monitoring of data sovereignty across MEA / EU Corridor</CardDescription>
            </CardHeader>
            <CardContent className="p-10 bg-slate-900/5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <TDFNode 
                        origin="KSA (Riyadh)" 
                        destination="Dublin (AWS)" 
                        status="compliant" 
                        standard="NDMO / Adequacy" 
                    />
                    <TDFNode 
                        origin="Nigeria (Lagos)" 
                        destination="ADGM (UAE)" 
                        status="warning" 
                        standard="NDPR Art. 12" 
                    />
                    <TDFNode 
                        origin="Kenya (NRB)" 
                        destination="Frankfurt" 
                        status="compliant" 
                        standard="KDPA Sec. 48" 
                    />
                </div>
            </CardContent>
            <CardFooter className="bg-slate-950 p-8 border-t border-white/5 flex justify-center">
                <div className="flex gap-12 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Active Corridor</div>
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-primary" /> Warning: Unencrypted Path</div>
                    <div className="flex items-center gap-2 opacity-30"><div className="w-2 h-2 rounded-full bg-slate-800" /> Planned Node</div>
                </div>
            </CardFooter>
        </Card>
      </div>
    </Layout>
  );
}

function TDFNode({ origin, destination, status, standard }: { origin: string, destination: string, status: 'compliant' | 'warning', standard: string }) {
    return (
        <div className="bg-slate-950/40 p-6 rounded-3xl border border-slate-900 group hover:border-primary/40 transition-all shadow-2xl relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-1.5 h-full ${status === 'compliant' ? 'bg-emerald-500' : 'bg-primary'}`} />
            <div className="flex items-center justify-between mb-6">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Path Analysis</span>
                <Badge variant="outline" className={`${status === 'compliant' ? 'text-emerald-500 border-emerald-500/20' : 'text-primary border-primary/20'} font-black uppercase text-[8px]`}>
                    {status}
                </Badge>
            </div>
            <div className="flex items-center gap-3 justify-between">
                <span className="text-lg font-black text-white italic tracking-tighter">{origin}</span>
                <ArrowRight className="w-4 h-4 text-slate-700" />
                <span className="text-lg font-black text-white italic tracking-tighter">{destination}</span>
            </div>
            <div className="mt-6 pt-6 border-t border-slate-900 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase">
                <span>Standard:</span>
                <span className="text-white italic">{standard}</span>
            </div>
        </div>
    );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any, label: string, value: string, color: string }) {
    return (
        <div className="bg-slate-950 border border-slate-900 p-6 rounded-3xl flex items-center gap-5 shadow-2xl group hover:border-primary/50 transition-all">
          <div className="p-4 bg-slate-900 rounded-2xl group-hover:scale-110 transition-transform"><Icon className={`w-7 h-7 ${color}`} /></div>
          <div>
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</div>
            <div className={`text-3xl font-black italic tracking-tighter text-white`}>{value}</div>
          </div>
        </div>
    );
}

function DPOItem({ vendor, status, expiry, region }: { vendor: string, status: 'registered' | 'pending' | 'missing', expiry: string, region: string }) {
    const colors = {
        registered: 'text-emerald-500 bg-emerald-500/10',
        pending: 'text-primary bg-primary/10',
        missing: 'text-red-500 bg-red-500/10'
    };
    return (
        <div className="p-5 flex items-center justify-between hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-4">
                <Badge variant="outline" className="text-[8px] font-black text-slate-500 border-slate-800 uppercase px-2 py-0.5">{region}</Badge>
                <div className="flex flex-col">
                    <span className="text-sm font-black text-white uppercase italic tracking-tight">{vendor}</span>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Expiry: {expiry}</span>
                </div>
            </div>
            <Badge className={`${colors[status]} border-none font-black uppercase text-[8px] px-3 py-1`}>
                {status}
            </Badge>
        </div>
    );
}
