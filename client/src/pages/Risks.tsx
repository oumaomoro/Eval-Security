import { Layout } from "@/components/Layout";
import { useRisks } from "@/hooks/use-risks";
import { RiskMatrix } from "@/components/RiskMatrix";
import { StatusBadge } from "@/components/StatusBadge";
import { 
  ShieldAlert, 
  TrendingDown, 
  Target, 
  Zap, 
  ArrowUpRight, 
  DollarSign,
  Activity,
  Cpu,
  AlertTriangle,
  Lock,
  ChevronRight,
  Fingerprint
} from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { SEO } from "@/components/SEO";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function Risks() {
  const { data: risks, isLoading } = useRisks();

  const totalExposure = risks?.reduce((sum, r) => {
    return sum + (r.financialExposureMax || 0);
  }, 0) || 0;

  return (
    <Layout header={
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-primary" /> Risk <span className="text-primary">Registry</span>
          </h1>
          <p className="text-[10px] font-bold text-slate-500 mt-2 uppercase tracking-[0.2em]">Sovereign Infrastructure Risk Registry & Autonomous Mitigation Tracking</p>
        </div>
        <div className="flex gap-4">
           <div className="px-6 py-3 bg-slate-950 border border-slate-800 rounded-2xl shadow-xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
             <span className="text-[9px] font-black uppercase text-slate-600 block mb-1 tracking-widest">Portfolio Exposure</span>
             <span className="text-2xl font-black text-white italic tracking-tighter">${(totalExposure / 1000000).toFixed(1)}M</span>
           </div>
        </div>
      </div>
    }>
      <SEO title="Enterprise Risk Registry" description="Monitor and mitigate enterprise compliance and cybersecurity risks with Costloci Intelligence." />
      
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <LoaderPulse />
          <p className="text-[10px] font-black uppercase text-slate-600 tracking-widest animate-pulse">Scanning infrastructure for vulnerabilities...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Side: Telemetry & Matrix */}
          <div className="lg:col-span-4 space-y-8">
            <Card className="bg-slate-950 border-slate-800 shadow-2xl rounded-[2.5rem] overflow-hidden group">
              <CardHeader className="p-8 pb-4">
                <CardTitle className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] flex items-center gap-3">
                  <Target className="w-4 h-4 text-primary" /> Neural Risk Matrix
                </CardTitle>
                <CardDescription className="text-[10px] font-bold text-slate-600 uppercase mt-1">Real-time vector distribution</CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-4">
                <div className="p-4 bg-slate-900/50 rounded-3xl border border-slate-800">
                    <ErrorBoundary>
                      <RiskMatrix risks={risks || []} />
                    </ErrorBoundary>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-950 border-slate-800 shadow-2xl rounded-[2.5rem] relative overflow-hidden group">
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-red-500/5 rounded-full blur-3xl group-hover:bg-red-500/10 transition-colors" />
              <CardHeader className="p-8 pb-4">
                 <CardTitle className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Risk Sentiment Matrix</CardTitle>
              </CardHeader>
              <CardContent className="p-8 pt-0 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-red-500/30 transition-all group/stat">
                        <span className="text-[9px] font-black text-slate-500 uppercase block mb-2">Critical</span>
                        <span className="text-3xl font-black text-red-500 italic tracking-tighter">{risks?.filter(r => r.severity === 'critical').length}</span>
                    </div>
                    <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-orange-500/30 transition-all group/stat">
                        <span className="text-[9px] font-black text-slate-500 uppercase block mb-2">High</span>
                        <span className="text-3xl font-black text-orange-500 italic tracking-tighter">{risks?.filter(r => r.severity === 'high').length}</span>
                    </div>
                </div>
                
                <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 relative overflow-hidden">
                    <div className="absolute right-0 top-0 p-4 opacity-5">
                       <TrendingDown className="w-12 h-12 text-primary" />
                    </div>
                    <span className="text-[9px] font-black text-slate-500 uppercase block mb-2">Total Financial Exposure</span>
                    <span className="text-4xl font-black text-primary italic tracking-tighter">${totalExposure.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Side: Risk Feed */}
          <div className="lg:col-span-8 space-y-8">
            <div className="flex items-center justify-between">
              <div>
                 <h2 className="text-xl font-black uppercase tracking-tighter italic text-slate-100 flex items-center gap-3">
                    <Activity className="w-6 h-6 text-primary" /> Intelligence Alerts
                 </h2>
                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Autonomous Detection Feed (v2.4 Sovereign)</p>
              </div>
              <Badge variant="outline" className="bg-slate-900 border-slate-800 text-[10px] font-black uppercase text-primary px-4 py-1 h-8 rounded-xl">
                {risks?.length || 0} VECTORS ACTIVE
              </Badge>
            </div>
            
            <AnimatePresence mode="popLayout">
              {risks?.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-20">
                  <EmptyState 
                    icon={ShieldAlert} 
                    title="Zero Active Risks" 
                    description="Your enterprise compliance posture is currently optimal. No critical vulnerabilities or compliance gaps detected."
                  />
                </motion.div>
              ) : (
                <div className="space-y-6">
                    {risks?.map((risk, index) => (
                      <motion.div 
                        key={risk.id} 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-slate-950 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl hover:border-primary/40 transition-all group relative overflow-hidden"
                      >
                        {/* Status Glow */}
                        <div className={`absolute top-0 right-0 w-24 h-24 blur-[80px] opacity-20 ${
                          risk.severity === 'critical' ? 'bg-red-500' :
                          risk.severity === 'high' ? 'bg-orange-500' :
                          'bg-yellow-500'
                        }`} />

                        <div className="flex flex-col md:flex-row justify-between items-start gap-8 relative z-10">
                          <div className="flex-1 space-y-6">
                            <div className="flex items-start gap-5">
                              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border ${
                                risk.severity === 'critical' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                                risk.severity === 'high' ? 'bg-orange-500/10 border-orange-500/20 text-orange-500' :
                                'bg-yellow-500/10 border-yellow-500/20 text-yellow-500'
                              }`}>
                                <AlertTriangle className="w-7 h-7" />
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                   <h3 className="font-black text-2xl text-white tracking-tighter leading-none italic uppercase">{risk.riskTitle}</h3>
                                   <Badge variant="outline" className="bg-slate-900/50 text-[8px] border-slate-800 text-slate-500 font-black uppercase tracking-widest h-5">
                                     {risk.intelligenceConfidence || 95}% CONFIDENCE
                                   </Badge>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                        <Cpu className="w-3.5 h-3.5 text-primary" /> {risk.riskCategory} VECTOR
                                    </div>
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                                    <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                        <Fingerprint className="w-3.5 h-3.5 text-slate-400" /> {risk.severity} Severity
                                    </div>
                                </div>
                              </div>
                            </div>
                            
                            <p className="text-slate-400 text-sm leading-relaxed font-medium pl-[4.75rem]">
                              {risk.riskDescription}
                            </p>
                            
                            <div className="flex flex-wrap gap-4 pl-[4.75rem]">
                               <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-slate-900 border border-slate-800">
                                 <DollarSign className="w-4 h-4 text-emerald-500" />
                                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Exposure: <span className="text-slate-100 italic ml-1">${(risk.financialExposureMax || 0).toLocaleString()}</span></span>
                               </div>
                               <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-slate-900 border border-slate-800">
                                 <Target className="w-4 h-4 text-primary" />
                                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Impact: <span className="text-slate-100 italic ml-1 uppercase">{risk.impact || 'High'}</span></span>
                               </div>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-4 min-w-[160px] pt-2">
                            <StatusBadge status={risk.mitigationStatus} type="risk" />
                            <Button className="w-full h-10 rounded-xl bg-slate-900 border-slate-800 hover:bg-primary/10 hover:border-primary/30 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-primary gap-2">
                              MITIGATION PROTOCOL <ChevronRight className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                        
                        {risk.mitigationStrategies && (
                          <div className="mt-8 ml-[4.75rem] bg-slate-900/50 rounded-3xl p-6 border border-slate-800 relative group-hover:border-primary/20 transition-all">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-8 h-8 rounded-lg bg-slate-950 flex items-center justify-center">
                                 <Zap className="w-4 h-4 text-primary" />
                              </div>
                              <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Active Remediation Directive</h4>
                            </div>
                            <p className="text-sm text-slate-200 font-bold italic leading-relaxed">
                              {typeof risk.mitigationStrategies?.[0] === 'string' 
                                ? risk.mitigationStrategies[0] 
                                : (risk.mitigationStrategies?.[0] as any)?.strategy}
                            </p>
                          </div>
                        )}
                      </motion.div>
                    ))}
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </Layout>
  );
}

function LoaderPulse() {
    return (
        <div className="relative w-16 h-16">
            <motion.div 
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 rounded-full bg-primary/20"
            />
            <div className="absolute inset-0 flex items-center justify-center">
                <Zap className="w-8 h-8 text-primary" />
            </div>
        </div>
    );
}
