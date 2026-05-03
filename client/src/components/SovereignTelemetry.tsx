import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Cpu, Server, Zap, Globe, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";

interface HealthMetrics {
  status: string;
  pulseCount: number;
  postgresLatency: string;
  resourceUsage: {
    cpuLoad: number;
    memoryUsed: string;
    aiWorkerLoad: number;
    dbPoolSaturation: number;
  };
  version: string;
}

export function SovereignTelemetry() {
  const { data: metrics, isLoading } = useQuery<HealthMetrics>({
    queryKey: ["/api/health"],
    queryFn: async () => {
      const res = await fetch("/api/health");
      if (!res.ok) throw new Error("Telemetry failure");
      return res.json();
    },
    refetchInterval: 5000, // Refresh every 5 seconds for "live" feel
  });

  if (isLoading || !metrics) return null;

  return (
    <Card className="nutanix-card bg-[#0a0a0a] border-slate-800/50 shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
        <Activity className="w-32 h-32 text-primary" />
      </div>
      
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
            <Zap className="w-3 h-3 text-primary animate-pulse" />
            Sovereign Engine Telemetry
          </CardTitle>
          <div className="flex items-center gap-2 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[8px] font-black text-emerald-400 uppercase italic">Live Posture</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6 pt-4">
        {/* Metric Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                <Cpu className="w-2.5 h-2.5" /> CPU_LOAD
              </span>
              <span className="text-xs font-mono font-bold text-white">{metrics.resourceUsage.cpuLoad}%</span>
            </div>
            <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${metrics.resourceUsage.cpuLoad}%` }}
                className="h-full bg-primary"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                <Server className="w-2.5 h-2.5" /> DB_SATURATION
              </span>
              <span className="text-xs font-mono font-bold text-white">{metrics.resourceUsage.dbPoolSaturation}%</span>
            </div>
            <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${metrics.resourceUsage.dbPoolSaturation}%` }}
                className="h-full bg-blue-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                <BrainCircuit className="w-2.5 h-2.5" /> AI_WORKER_LOAD
              </span>
              <span className="text-xs font-mono font-bold text-white">{metrics.resourceUsage.aiWorkerLoad}%</span>
            </div>
            <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${metrics.resourceUsage.aiWorkerLoad}%` }}
                className="h-full bg-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                <Globe className="w-2.5 h-2.5" /> LATENCY
              </span>
              <span className="text-xs font-mono font-bold text-white">{metrics.postgresLatency}</span>
            </div>
            <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: "40%" }} // Fixed visualization for latency
                className="h-full bg-cyan-500"
              />
            </div>
          </div>
        </div>

        {/* Footer Meta */}
        <div className="pt-4 border-t border-slate-800/50 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3 h-3 text-primary/50" />
            <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">
              Engine Pulse: {metrics.pulseCount.toString().padStart(6, '0')}
            </span>
          </div>
          <span className="text-[8px] font-mono text-slate-700">{metrics.version}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function BrainCircuit({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .52 8.105 3 3 0 1 0 5.132-2.132A3 3 0 1 0 12 5Z"/>
      <path d="M9 13a4.5 4.5 0 0 0 3-4"/>
      <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5"/>
      <path d="M3.477 10.896a4 4 0 0 1 .52 8.105"/>
      <path d="M6.003 5.125a4 4 0 0 1-2.526 5.77"/>
      <path d="M9 18.105a3 3 0 1 1 5.132-2.132"/>
      <path d="M12 5a3 3 0 1 1 5.132 2.132"/>
      <path d="M15 13a4.5 4.5 0 0 1-3-4"/>
      <path d="M17.997 5.125a3 3 0 0 1-.398 1.375"/>
      <path d="M20.523 10.896a4 4 0 0 0-.52 8.105"/>
      <path d="M17.997 5.125a4 4 0 0 0 2.526 5.77"/>
    </svg>
  );
}
