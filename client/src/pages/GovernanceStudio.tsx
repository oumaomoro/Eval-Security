import { Layout } from "@/components/Layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ShieldCheck, 
  Activity, 
  FileText, 
  RefreshCw, 
  Zap, 
  ShieldAlert,
  ArrowUpRight,
  Target,
  BarChart3
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";

export default function GovernanceStudio() {
  const { data: report, isLoading } = useQuery<any>({
    queryKey: ["/api/governance/health-report"],
  });

  const scanMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/governance/scan", {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/governance/health-report"] });
      toast({ title: "Scan Complete", description: "All contracts and infrastructure assets have been audited." });
    }
  });

  if (isLoading) return <Layout>Loading Governance Studio...</Layout>;

  return (
    <Layout header={<h1 className="text-2xl font-bold flex items-center gap-2">Governance Control Room</h1>}>
      <div className="space-y-6 pb-10">
        
        {/* Orchestration Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 p-6 rounded-xl border border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <ShieldCheck className="w-32 h-32 text-cyan-400" />
          </div>
          <div className="relative z-10">
            <h2 className="text-xl font-bold text-white mb-1">Autonomous Governance Status</h2>
            <p className="text-sm text-slate-400">Continuous monitoring of 12 active endpoints across 2 cloud regions.</p>
          </div>
          <Button 
            className="bg-primary hover:bg-primary/90 text-white flex items-center gap-2 relative z-10"
            onClick={() => scanMutation.mutate()}
            disabled={scanMutation.isPending}
          >
            <RefreshCw className={`w-4 h-4 ${scanMutation.isPending ? 'animate-spin' : ''}`} />
            {scanMutation.isPending ? "Executing Scan..." : "Trigger Full Audit"}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Health Score */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <Target className="w-4 h-4 text-cyan-400" /> Sovereign Health Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-white">{report?.summary?.complianceScore}%</span>
                <Badge className="bg-green-500/20 text-green-400 text-[10px]">Optimal</Badge>
              </div>
              <p className="text-[10px] text-slate-500 mt-2">Weighted average across contracts, infrastructure, and privacy drift.</p>
            </CardContent>
          </Card>

          {/* Active Assets */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-400" /> Monitored Assets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-white">{report?.summary?.totalAssets}</span>
                <span className="text-xs text-slate-500">Cloud Resources</span>
              </div>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline" className="text-[9px] border-slate-700">AWS: 8</Badge>
                <Badge variant="outline" className="text-[9px] border-slate-700">Azure: 4</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Critical Risks */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-400" /> Critical Risks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-white">{report?.summary?.criticalRisks}</span>
                <Badge className="bg-red-500/20 text-red-400 text-[10px]">High Priority</Badge>
              </div>
              <p className="text-[10px] text-slate-500 mt-2">Direct impact on SOC 2 and KDPA compliance status.</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Executive Recommendations */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-md font-bold flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" /> Smart Recommendations
              </CardTitle>
              <CardDescription className="text-xs">AI-prioritized actions to harden your posture.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {report?.recommendations?.map((rec: string, i: number) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-slate-950 border border-slate-800 group hover:border-primary/50 transition-colors cursor-pointer">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <p className="text-xs text-slate-300 leading-relaxed">{rec}</p>
                  <ArrowUpRight className="w-3 h-3 text-slate-600 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Governance Trends */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-md font-bold flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-purple-400" /> Governance Trends
              </CardTitle>
              <CardDescription className="text-xs">Compliance and risk delta over the last 30 days.</CardDescription>
            </CardHeader>
            <CardContent className="h-[250px] flex items-center justify-center border-t border-slate-800 mt-4">
              <div className="text-center space-y-2">
                <div className="p-3 bg-slate-800 rounded-full inline-block">
                  <FileText className="w-8 h-8 text-slate-500" />
                </div>
                <p className="text-xs text-slate-500">History visualization in development...</p>
                <Button variant="ghost" size="sm" className="text-primary text-[10px]">
                  View Detailed Logs
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </Layout>
  );
}
