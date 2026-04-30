import { Layout } from "@/components/Layout";
import { useRisks } from "@/hooks/use-risks";
import { RiskMatrix } from "@/components/RiskMatrix";
import { StatusBadge } from "@/components/StatusBadge";
import { ShieldAlert, TrendingDown, Target, Zap, ArrowUpRight, DollarSign } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { SEO } from "@/components/SEO";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function Risks() {
  const { data: risks, isLoading } = useRisks();

  const totalExposure = risks?.reduce((sum, r) => {
    return sum + (r.financialExposureMax || 0);
  }, 0) || 0;

  return (
    <Layout header={
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic">Risk <span className="text-primary">Register</span></h1>
          <p className="text-xs text-slate-500 mt-2 font-bold uppercase tracking-[0.2em]">Enterprise risk registry and autonomous mitigation tracking.</p>
        </div>
        <div className="flex gap-3">
           <div className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl">
             <span className="text-[10px] font-black uppercase text-slate-500 block mb-1">Portfolio Exposure</span>
             <span className="text-xl font-black text-white italic">${(totalExposure / 1000000).toFixed(1)}M</span>
           </div>
        </div>
      </div>
    }>
      <SEO title="Enterprise Risk Registry" description="Monitor and mitigate enterprise compliance and cybersecurity risks with Costloci Intelligence." />
      
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Zap className="w-8 h-8 text-primary animate-pulse" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Matrix & Summary */}
          <div className="lg:col-span-4 space-y-8">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-6 rounded-[2rem] shadow-2xl"
            >
              <h3 className="text-xs font-black uppercase text-slate-500 tracking-[0.2em] mb-6 flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                Risk Distribution Matrix
              </h3>
              <ErrorBoundary>
                <RiskMatrix risks={risks || []} />
              </ErrorBoundary>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-[#0f172a]/80 backdrop-blur-xl border border-slate-800/60 p-8 rounded-[2rem] shadow-2xl relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <TrendingDown className="w-24 h-24 text-primary" />
              </div>
              <h3 className="text-xs font-black uppercase text-slate-500 tracking-[0.2em] mb-6">Risk Sentiment</h3>
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-400">Critical Vectors</span>
                  <span className="text-2xl font-black text-red-500 italic">{risks?.filter(r => r.severity === 'critical').length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-400">High Severity</span>
                  <span className="text-2xl font-black text-orange-500 italic">{risks?.filter(r => r.severity === 'high').length}</span>
                </div>
                <div className="h-px bg-slate-800" />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-black uppercase text-white tracking-widest">Total Exposure</span>
                  <span className="text-2xl font-black text-primary italic">${totalExposure.toLocaleString()}</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right: Detailed List */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-black uppercase text-slate-500 tracking-[0.3em]">Active Intelligence Alerts</h2>
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">{risks?.length || 0} RISKS</Badge>
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
                risks?.map((risk, index) => (
                  <motion.div 
                    key={risk.id} 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-[1.5rem] p-6 shadow-xl hover:border-primary/40 transition-all group relative overflow-hidden"
                  >
                    {/* Severity Indicator Bar */}
                    <div className={`absolute top-0 left-0 bottom-0 w-1 ${
                      risk.severity === 'critical' ? 'bg-red-500' :
                      risk.severity === 'high' ? 'bg-orange-500' :
                      'bg-yellow-500'
                    }`} />

                    <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl ${
                            risk.severity === 'critical' ? 'bg-red-500/10 text-red-500' :
                            risk.severity === 'high' ? 'bg-orange-500/10 text-orange-500' :
                            'bg-yellow-500/10 text-yellow-500'
                          }`}>
                            <ShieldAlert className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-black text-xl text-white tracking-tight leading-none italic">{risk.riskTitle}</h3>
                              <Badge variant="outline" className="bg-slate-950/50 text-[9px] border-slate-800 text-slate-500 uppercase tracking-tighter">
                                {risk.intelligenceConfidence || 95}% INTELLIGENCE CONFIDENCE
                              </Badge>
                            </div>
                            <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">{risk.riskCategory} Risk Vector</p>
                          </div>
                        </div>
                        
                        <p className="text-slate-400 text-sm leading-relaxed font-medium">
                          {risk.riskDescription}
                        </p>
                        
                        <div className="flex flex-wrap gap-4 pt-2">
                           <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950/50 border border-slate-800">
                             <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                             <span className="text-xs font-bold text-slate-300">Exposure: <span className="text-emerald-400">${(risk.financialExposureMax || 0).toLocaleString()}</span></span>
                           </div>
                           <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950/50 border border-slate-800">
                             <Target className="w-3.5 h-3.5 text-primary" />
                             <span className="text-xs font-bold text-slate-300">Likelihood: <span className="text-primary uppercase">{risk.likelihood || 'High'}</span></span>
                           </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-3 min-w-[140px]">
                        <StatusBadge status={risk.mitigationStatus} type="risk" />
                        <Button variant="ghost" size="sm" className="h-8 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-primary hover:bg-primary/10 gap-2">
                          Mitigation Details
                          <ArrowUpRight className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    
                    {risk.mitigationStrategies && risk.mitigationStrategies.length > 0 && (
                      <div className="mt-6 bg-slate-950/60 rounded-xl p-5 border border-slate-800/50 group-hover:border-primary/20 transition-colors">
                        <div className="flex items-center gap-2 mb-3">
                          <Zap className="w-3.5 h-3.5 text-primary" />
                          <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Active Mitigation Strategy</h4>
                        </div>
                        <p className="text-sm text-slate-300 font-medium italic">
                          {typeof risk.mitigationStrategies?.[0] === 'string' 
                            ? risk.mitigationStrategies[0] 
                            : (risk.mitigationStrategies?.[0] as any)?.strategy}
                        </p>
                      </div>
                    )}
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </Layout>
  );
}

function Button({ children, className, variant, size, onClick, disabled }: { children: React.ReactNode, className?: string, variant?: 'ghost' | 'outline' | 'primary', size?: 'sm' | 'icon', onClick?: () => void, disabled?: boolean }) {
  const base = "inline-flex items-center justify-center transition-all disabled:opacity-50 disabled:pointer-events-none";
  const variants: any = {
    ghost: "bg-transparent",
    outline: "border",
    primary: "bg-primary text-slate-950"
  };
  const sizes: any = {
    sm: "px-3 py-1.5 rounded-lg",
    icon: "h-8 w-8 p-0"
  };
  return (
    <button disabled={disabled} onClick={onClick} className={`${base} ${variants[variant || 'primary']} ${sizes[size || 'sm']} ${className}`}>
      {children}
    </button>
  );
}
