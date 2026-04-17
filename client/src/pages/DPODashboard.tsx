import { useQuery } from "@tanstack/react-query";
import { 
  ShieldAlert, 
  Map, 
  Activity, 
  ClipboardCheck, 
  ChevronRight,
  Briefcase,
  Globe,
  Lock,
  Zap
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { 
  ResponsiveContainer, 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Cell
} from "recharts";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";

type DPOMetrics = {
  complianceScore: number;
  readinessScore: number;
  dpasReviewed: number;
  openFindings: number;
  heatmap: { standard: string; score: number; color: string }[];
  readinessData: { subject: string; A: number; fullMark: number }[];
};

export default function DPODashboard() {
  const { t } = useTranslation();
  const { data: metrics } = useQuery<DPOMetrics>({
    queryKey: ["/api/dpo/metrics"]
  });

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-100 flex items-center gap-3">
             <Globe className="h-10 w-10 text-blue-500" />
             {t("dpo.title")}
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            {t("dpo.subtitle")}
          </p>
        </div>
        <div className="flex gap-4">
           <Button variant="outline" className="border-slate-800 bg-slate-900/40 backdrop-blur">
             <Activity className="mr-2 h-4 w-4" /> {t("dpo.live_monitoring")}
           </Button>
           <Button className="bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-500/20">
             <Zap className="mr-2 h-4 w-4" /> {t("dpo.run_audit")}
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard icon={<ShieldAlert className="text-rose-500" />} label={t("dpo.compliance_risk")} value="High" subValue="3 Critical Gaps" />
        <MetricCard icon={<Activity className="text-emerald-500" />} label={t("dpo.avg_compliance")} value={`${metrics?.complianceScore}%`} subValue="+4% vs Last Month" />
        <MetricCard icon={<Briefcase className="text-blue-500" />} label={t("dpo.dpas_reviewed")} value={String(metrics?.dpasReviewed)} subValue="5 Pending Legal" />
        <MetricCard icon={<Lock className="text-amber-500" />} label={t("dpo.readiness_score")} value={`${metrics?.readinessScore}%`} subValue="Optimized" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Compliance Heatmap */}
        <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-xl shadow-2xl">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Map className="h-5 w-5 text-indigo-400" />
              {t("dpo.heatmap_title")}
            </CardTitle>
            <CardDescription>{t("dpo.heatmap_desc")}</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics?.heatmap} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="standard" type="category" stroke="#94a3b8" fontSize={14} tickLine={false} axisLine={false} width={80} />
                <RechartsTooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-950 border border-slate-800 p-2 rounded shadow-2xl text-xs">
                          <p className="font-bold">{payload[0].payload.standard}</p>
                          <p className="text-blue-400">Compliance: {payload[0].value}%</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={24}>
                  {metrics?.heatmap.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Breach Readiness radar */}
        <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-xl shadow-2xl">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-400" />
              {t("dpo.breach_title")}
            </CardTitle>
            <CardDescription>{t("dpo.breach_desc")}</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
             <ResponsiveContainer width="100%" height="100%">
               <RadarChart cx="50%" cy="50%" outerRadius="80%" data={metrics?.readinessData}>
                 <PolarGrid stroke="#334155" />
                 <PolarAngleAxis dataKey="subject" stroke="#94a3b8" fontSize={12} />
                 <PolarRadiusAxis angle={30} domain={[0, 150]} hide />
                 <Radar
                   name="Capability"
                   dataKey="A"
                   stroke="#3b82f6"
                   fill="#3b82f6"
                   fillOpacity={0.5}
                 />
               </RadarChart>
             </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 bg-slate-900/40 border-slate-800 backdrop-blur-xl">
           <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t("dpo.remediation_tasks")}</CardTitle>
                <CardDescription>{t("dpo.remediation_desc")}</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/compliance">{t("dpo.view_all")} <ChevronRight className="ml-1 h-4 w-4" /></Link>
              </Button>
           </CardHeader>
           <CardContent>
              <ScrollArea className="h-[250px] w-full">
                <div className="space-y-4">
                   {[1, 2, 3, 4].map(i => (
                     <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-slate-950/50 border border-slate-800/50 hover:border-blue-500/30 transition-colors">
                        <div className="flex gap-4">
                           <div className="h-10 w-10 rounded bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                              <ClipboardCheck className="h-5 w-5" />
                           </div>
                           <div>
                              <p className="font-semibold text-slate-100">Implement Data Residency Clause</p>
                              <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Microsoft Azure DPA • High Priority</p>
                           </div>
                        </div>
                        <Badge variant="outline" className="text-amber-500 border-amber-500/20">In Progress</Badge>
                     </div>
                   ))}
                </div>
              </ScrollArea>
           </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-900/20 to-blue-900/20 border-blue-500/20 backdrop-blur-xl overflow-hidden relative group">
           <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
              <ShieldAlert className="h-40 w-40" />
           </div>
           <CardHeader>
              <CardTitle className="text-slate-100 uppercase tracking-tighter text-sm">{t("dpo.regulatory_sentinel")}</CardTitle>
           </CardHeader>
           <CardContent className="space-y-6">
              <div className="space-y-2">
                 <h3 className="text-2xl font-bold text-white">GDPR Amendment 2024</h3>
                 <p className="text-slate-400 text-sm">New requirements for cross-border data transfers to AI providers detected.</p>
              </div>
              
              <div className="pt-4">
                 <Button className="w-full bg-slate-100 text-slate-950 hover:bg-slate-200">
                    {t("dpo.analyze_impact")}
                 </Button>
              </div>
           </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, subValue }: any) {
  return (
    <Card className="bg-slate-950 border-slate-800 shadow-xl overflow-hidden relative">
      <div className="absolute top-0 left-0 w-1 h-full bg-blue-600/50" />
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
           <div className="h-12 w-12 rounded-xl bg-slate-900 flex items-center justify-center border border-slate-800">
             {icon}
           </div>
           <div>
              <p className="text-sm font-medium text-muted-foreground">{label}</p>
              <h3 className="text-2xl font-bold text-slate-100 mt-1">{value}</h3>
              <p className="text-xs text-emerald-500 mt-1 font-semibold">{subValue}</p>
           </div>
        </div>
      </CardContent>
    </Card>
  );
}
