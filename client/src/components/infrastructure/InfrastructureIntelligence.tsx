import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Zap, Globe, Cpu } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export function InfrastructureIntelligence() {
  const { data: assets } = useQuery<any[]>({
    queryKey: ["/api/infrastructure/assets"],
  });

  const criticalFindings = assets?.filter(a => a.severity === 'critical').length || 0;
  const publicAssets = assets?.filter(a => a.exposureType === 'public').length || 0;

  return (
    <Card className="bg-slate-900 border-slate-800 overflow-hidden relative group">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <Shield className="w-24 h-24 text-primary" />
      </div>
      <CardHeader>
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary animate-pulse" /> Autonomic Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs text-slate-400">Security Posture</p>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-white">RELIANT</span>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">ACTIVE</Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <div className="flex items-center gap-2 mb-1">
              <Cpu className="w-3 h-3 text-blue-400" />
              <span className="text-[10px] uppercase font-bold text-slate-500">Scanning</span>
            </div>
            <p className="text-lg font-bold text-white">LIVE</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <div className="flex items-center gap-2 mb-1">
              <Globe className="w-3 h-3 text-cyan-400" />
              <span className="text-[10px] uppercase font-bold text-slate-500">Exposed</span>
            </div>
            <p className="text-lg font-bold text-white">{publicAssets}</p>
          </div>
        </div>

        <div className="pt-2">
          <div className="flex justify-between text-[10px] mb-1">
            <span className="text-slate-400 uppercase font-bold">Resilience Buffer</span>
            <span className="text-primary font-bold">88%</span>
          </div>
          <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-primary w-[88%] shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
