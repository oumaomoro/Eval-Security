import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, AlertTriangle, ShieldCheck, Zap, Activity } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";

// Mocking the real-time fetch for this component for demonstration, 
// in production this would pull from /api/regulatory-alerts/live
export function AutonomicJurisdictionSync() {
  const { data: syncData, isLoading } = useQuery({
    queryKey: ['/api/regulatory-alerts/live'],
    refetchInterval: 5000,
    queryFn: async () => {
      // Simulating the dynamic data fetch based on Costloci's innovative edge
      return {
        overallHealth: 98.2,
        activeRegions: [
          { region: "East Africa (KDPA/CBK)", status: "optimal", drift: 0 },
          { region: "EU (GDPR)", status: "monitoring", drift: 2.1 },
          { region: "US (CCPA)", status: "optimal", drift: 0 }
        ],
        recentShifts: [
          { time: new Date().toISOString(), law: "KDPA Art. 21", resolution: "Autonomically Aligned" }
        ]
      };
    }
  });

  if (isLoading) return <div className="animate-pulse bg-slate-900 rounded-2xl h-48"></div>;

  return (
    <Card className="bg-slate-950 border-slate-800 shadow-2xl relative overflow-hidden group">
      <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
      <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl group-hover:bg-primary/30 transition-colors" />
      
      <CardHeader className="border-b border-primary/20 bg-slate-950/50 backdrop-blur z-10 relative">
        <div className="flex justify-between items-center">
          <CardTitle className="text-sm font-black text-slate-100 uppercase flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            Autonomic Jurisdictional Sync
          </CardTitle>
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
            <Activity className="w-3 h-3 mr-1 animate-pulse" /> LIVE
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Global Governance Resonance</p>
                <div className="text-4xl font-mono font-black text-slate-100 flex items-baseline gap-1 mt-1">
                  {syncData?.overallHealth} <span className="text-sm text-primary">%</span>
                </div>
              </div>
              <ShieldCheck className="w-8 h-8 text-primary/50" />
            </div>
            
            <div className="space-y-3 pt-2">
              {syncData?.activeRegions.map((region, i) => (
                <div key={i} className="flex justify-between items-center text-xs">
                  <span className="text-slate-300 font-medium">{region.region}</span>
                  <div className="flex items-center gap-2">
                    {region.drift > 0 ? (
                      <span className="text-[10px] text-amber-500">+{region.drift}% Drift</span>
                    ) : (
                      <span className="text-[10px] text-emerald-500 flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Synced</span>
                    )}
                    <div className={`w-2 h-2 rounded-full ${region.drift > 0 ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
            <div>
               <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-1 mb-2">
                 <Zap className="w-3 h-3 text-cyan-500" /> Autonomic Resolutions
               </p>
               {syncData?.recentShifts.map((shift, i) => (
                 <div key={i} className="bg-slate-950 p-2 rounded border border-cyan-500/20 text-xs">
                   <p className="text-cyan-500 font-mono mb-1">{shift.law}</p>
                   <p className="text-slate-400 font-bold">{shift.resolution}</p>
                 </div>
               ))}
               {!syncData?.recentShifts.length && (
                  <p className="text-xs text-slate-500 italic mt-4 text-center">Monitoring continuous shift vectors...</p>
               )}
            </div>
            <p className="text-[9px] text-slate-600 mt-4 leading-tight italic">
              Costloci's LLM fabric actively rescans global regulatory endpoints to prevent compliance decay.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
