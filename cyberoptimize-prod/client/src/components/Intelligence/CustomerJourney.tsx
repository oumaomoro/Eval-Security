import { motion } from "framer-motion";
import { CheckCircle2, Circle, ArrowRight, Database, BrainCircuit, ShieldAlert, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
  { id: "ingestion", label: "Data Ingestion", icon: Database, status: "complete", description: "Contract telemetry synchronized." },
  { id: "intelligence", label: "AI Intelligence", icon: BrainCircuit, status: "complete", description: "Regional risk mappings extracted." },
  { id: "governance", label: "Governance Drift", icon: ShieldAlert, status: "current", description: "Live monitoring for KDPA/POPIA." },
  { id: "autonomic", label: "Autonomic Health", icon: Zap, status: "upcoming", description: "Predictive self-healing active." },
];

export function CustomerJourney() {
  return (
    <div className="w-full bg-slate-950/50 border border-slate-800 rounded-[2.5rem] p-8 relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-50" />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative z-10">
        <div>
          <h3 className="text-lg font-black text-white italic uppercase tracking-tighter flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary animate-pulse" />
            ENTERPRISE MATURITY JOURNEY
          </h3>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Real-time status of your sovereign compliance lifecycle</p>
        </div>

        <div className="flex-1 flex items-center gap-4 w-full max-w-4xl">
          {steps.map((step, idx) => (
            <div key={step.id} className="flex-1 flex items-center gap-4 group/step">
              <div className="flex flex-col items-center gap-2 relative">
                <div className={cn(
                  "w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-xl",
                  step.status === "complete" ? "bg-emerald-500/20 shadow-emerald-500/10 border border-emerald-500/30 text-emerald-500" :
                  step.status === "current" ? "bg-primary/20 shadow-primary/10 border border-primary/50 text-primary animate-ring-pulse" :
                  "bg-slate-900 border border-slate-800 text-slate-600"
                )}>
                  <step.icon className="w-5 h-5" />
                </div>
                
                <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-32 text-center">
                  <p className={cn(
                    "text-[10px] font-black uppercase tracking-tighter transition-colors",
                    step.status === "upcoming" ? "text-slate-600" : "text-slate-200"
                  )}>{step.label}</p>
                  <p className="text-[8px] text-slate-500 leading-none mt-1 font-medium">{step.description}</p>
                </div>
              </div>

              {idx < steps.length - 1 && (
                <div className="flex-1 h-0.5 bg-slate-900 relative rounded-full overflow-hidden">
                  {step.status === "complete" && (
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      className="h-full bg-emerald-500/50"
                    />
                  )}
                  {step.status === "current" && (
                    <motion.div 
                      initial={{ left: "-100%" }}
                      animate={{ left: "100%" }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="absolute top-0 w-1/2 h-full bg-gradient-to-r from-transparent via-primary/50 to-transparent"
                    />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      <div className="mt-16 pt-6 border-t border-white/5 flex justify-between items-center relative z-10">
        <div className="flex items-center gap-4">
           <div className="flex -space-x-2">
              {[1,2,3].map(i => (
                <div key={i} className="w-6 h-6 rounded-full bg-slate-800 border-2 border-slate-950 flex items-center justify-center text-[8px] font-black">{i}</div>
              ))}
           </div>
           <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">3 Autonomic agents active in this jurisdiction</p>
        </div>
        <button className="text-[9px] font-black text-primary uppercase tracking-widest flex items-center gap-2 hover:translate-x-1 transition-transform">
          View Detail Logic <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
