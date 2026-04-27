import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import React from "react";
import { MetricCard } from "@/components/MetricCard";
import { 
  ShieldAlert, 
  Map, 
  Activity, 
  ClipboardCheck, 
  ChevronRight,
  Briefcase,
  Zap,
  TrendingUp,
  ShieldCheck,
  Brain,
  CheckCircle2,
  Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { motion } from "framer-motion";
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
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Cell,
  CartesianGrid
} from "recharts";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";

type RemediationTask = {
  id: number;
  title: string;
  severity: string;
  status: string;
  contractId: number;
};

type DPOMetrics = {
  complianceScore: number;
  readinessScore: number;
  dpasReviewed: number;
  openFindings: number;
  remediationTasks: RemediationTask[];
  remediationStats: { total: number; accepted: number; pending: number; rejected: number; acceptanceRate: number };
  trendAnalysis: { date: string; score: number; redlines: number }[];
  heatmap: { standard: string; score: number; color: string }[];
  readinessData: { subject: string; A: number; fullMark: number }[];
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 }
};

export default function DPODashboard() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: metrics, isLoading } = useQuery<DPOMetrics>({
    queryKey: ["/api/dpo/metrics"]
  });

  const remediateMutation = useMutation({
    mutationFn: async (taskId: number) => {
      const res = await apiRequest("PATCH", `/api/remediation-tasks/${taskId}`, { status: "in_progress" });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dpo/metrics"] });
      toast({ title: "Task Activated", description: "Remediation task moved to in-progress." });
    },
    onError: () => toast({ title: "Error", description: "Could not update task.", variant: "destructive" })
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-500/30">
      <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-end border-b border-slate-800/60 pb-8"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-2 w-8 bg-blue-600 rounded-full animate-pulse" />
              <span className="text-blue-500 font-bold tracking-widest text-xs uppercase">{t("dpo.regulatory_sentinel")}</span>
            </div>
            <h1 className="text-5xl font-black tracking-tight flex items-center gap-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-500">
               {t("dpo.title")}
            </h1>
            <p className="text-slate-400 mt-3 text-lg font-medium max-w-2xl">
              {t("dpo.subtitle")}
            </p>
          </div>
          <div className="flex gap-4 pb-1">
             <Button variant="outline" className="border-slate-800 bg-slate-900/40 backdrop-blur-md hover:bg-slate-800/60 transition-all duration-300">
               <Activity className="mr-2 h-4 w-4 text-emerald-400" /> {t("dpo.live_monitoring")}
             </Button>
             <Button className="bg-blue-600 hover:bg-blue-500 text-white shadow-2xl shadow-blue-500/20 px-8 font-bold border-t border-blue-400/30 transition-all duration-300 hover:scale-105 active:scale-95">
               <Zap className="mr-2 h-4 w-4 fill-white" /> {t("dpo.run_audit")}
             </Button>
          </div>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-4 gap-6"
        >
          <MetricCard 
            variants={itemVariants}
            icon={<ShieldAlert className="text-rose-500" />} 
            label={t("dpo.compliance_risk")} 
            value={metrics?.openFindings && metrics.openFindings > 5 ? "High" : "Moderate"} 
            subValue={`${metrics?.openFindings || 0} Critical Gaps`}
            trend="Attention Required"
            trendColor="text-rose-500"
          />
          <MetricCard 
            variants={itemVariants}
            icon={<Activity className="text-emerald-400" />} 
            label={t("dpo.avg_compliance")} 
            value={`${metrics?.complianceScore || 0}%`} 
            subValue="+4.2% vs Last Audit"
            trend="Improving"
            trendColor="text-emerald-400"
          />
          <MetricCard 
            variants={itemVariants}
            icon={<Briefcase className="text-blue-400" />} 
            label={t("dpo.dpas_reviewed")} 
            value={String(metrics?.dpasReviewed || 0)} 
            subValue="Audit Trail Synchronized"
            trend="Live"
            trendColor="text-blue-400"
          />
          <MetricCard 
            variants={itemVariants}
            icon={<ShieldCheck className="text-indigo-400" />} 
            label={t("dpo.readiness_score")} 
            value={`${metrics?.readinessScore || 0}%`} 
            subValue="Infrastructure Readiness"
            trend="Stable"
            trendColor="text-indigo-400"
          />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Compliance Heatmap */}
          <motion.div variants={itemVariants} initial="hidden" animate="show">
            <Card className="bg-slate-900/40 border-slate-800/60 backdrop-blur-3xl shadow-2xl overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                <Map className="h-32 w-32" />
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl font-bold flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                    <Map className="h-5 w-5 text-indigo-400" />
                  </div>
                  {t("dpo.heatmap_title")}
                </CardTitle>
                <CardDescription className="text-slate-400">{t("dpo.heatmap_desc")}</CardDescription>
              </CardHeader>
              <CardContent className="h-[350px] pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics?.heatmap} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis dataKey="standard" type="category" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} width={80} fontWeight={600} />
                    <RechartsTooltip 
                      cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-slate-950/90 backdrop-blur border border-slate-800 p-3 rounded-lg shadow-2xl text-xs">
                              <p className="font-black text-slate-100 uppercase mb-1 tracking-widest">{payload[0].payload.standard}</p>
                              <div className="h-1 w-full bg-slate-800 rounded-full mb-2">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${payload[0].value}%` }} />
                              </div>
                              <p className="text-blue-400 font-bold">POSTURE: {payload[0].value}%</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="score" radius={[0, 8, 8, 0]} barSize={28}>
                      {metrics?.heatmap.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.7} className="transition-all duration-500 hover:opacity-100" />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Breach Readiness radar */}
          <motion.div variants={itemVariants} initial="hidden" animate="show">
            <Card className="bg-slate-900/40 border-slate-800/60 backdrop-blur-3xl shadow-2xl overflow-hidden group">
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl font-bold flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <Zap className="h-5 w-5 text-amber-400 fill-amber-400/20" />
                  </div>
                  {t("dpo.breach_title")}
                </CardTitle>
                <CardDescription className="text-slate-400">{t("dpo.breach_desc")}</CardDescription>
              </CardHeader>
              <CardContent className="h-[350px] flex items-center justify-center">
                 <ResponsiveContainer width="100%" height="100%">
                   <RadarChart cx="50%" cy="50%" outerRadius="80%" data={metrics?.readinessData}>
                     <PolarGrid stroke="#1e293b" />
                     <PolarAngleAxis dataKey="subject" stroke="#64748b" fontSize={11} fontWeight={600} />
                     <PolarRadiusAxis angle={30} domain={[0, 100]} hide />
                     <Radar
                       name="Capability"
                       dataKey="A"
                       stroke="#3b82f6"
                       fill="url(#radarGradient)"
                       fillOpacity={0.6}
                     />
                     <defs>
                        <linearGradient id="radarGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#2563eb" stopOpacity={0.2}/>
                        </linearGradient>
                     </defs>
                   </RadarChart>
                 </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          <Card className="lg:col-span-2 bg-slate-900/40 border-slate-800/60 backdrop-blur-3xl shadow-xl">
             <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800/50 pb-6">
                <div>
                  <CardTitle className="text-2xl font-bold text-slate-100">{t("dpo.remediation_tasks")}</CardTitle>
                  <CardDescription className="text-slate-400">{t("dpo.remediation_desc")}</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10">
                  <Link href="/compliance" className="flex items-center">
                    {t("dpo.view_all")} <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
             </CardHeader>
             <CardContent className="pt-6">
                <ScrollArea className="h-[320px] w-full pr-4">
                  <div className="space-y-4">
                     {metrics?.remediationTasks && metrics.remediationTasks.length > 0 ? (
                       metrics.remediationTasks.map((task, i) => (
                         <motion.div 
                           key={task.id} 
                           initial={{ opacity: 0, x: -10 }}
                           animate={{ opacity: 1, x: 0 }}
                           transition={{ delay: i * 0.1 }}
                           className="flex items-center justify-between p-5 rounded-xl bg-slate-950/40 border border-slate-800/50 hover:border-blue-500/40 hover:bg-slate-900/40 transition-all duration-300 group"
                         >
                            <div className="flex gap-5 items-center">
                               <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                                  <ClipboardCheck className="h-6 w-6" />
                               </div>
                               <div>
                                  <p className="font-bold text-slate-100 text-lg leading-tight">{task.title}</p>
                                  <div className="flex items-center gap-3 mt-2">
                                    <Badge variant="outline" className={`text-[10px] uppercase font-black px-2 py-0 border-none ${task.severity === 'critical' ? 'bg-rose-500/20 text-rose-500' : 'bg-amber-500/20 text-amber-500'}`}>
                                      {task.severity}
                                    </Badge>
                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                      Contract ID: {task.contractId}
                                    </span>
                                  </div>
                               </div>
                            </div>
                             <Button
                               size="sm"
                               variant="outline"
                               disabled={task.status === 'in_progress' || remediateMutation.isPending}
                               onClick={() => remediateMutation.mutate(task.id)}
                               className="border-slate-800 bg-slate-950/40 hover:bg-blue-600 hover:text-white hover:border-blue-500 transition-all min-w-[100px]"
                             >
                               {task.status === 'in_progress' ? <><Clock className="h-3 w-3 mr-1" />Active</> : 'Remediate'}
                             </Button>
                         </motion.div>
                       ))
                     ) : (
                       <div className="flex flex-col items-center justify-center h-[200px] text-slate-500">
                          <ShieldCheck className="h-12 w-12 opacity-20 mb-4" />
                          <p className="font-bold uppercase tracking-widest text-xs">No Pending Critical Remediations</p>
                       </div>
                     )}
                  </div>
                </ScrollArea>
             </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-900/30 to-blue-900/30 border-blue-500/30 backdrop-blur-3xl overflow-hidden relative group border-t-2 border-t-blue-400/40">
             <div className="absolute -top-12 -right-12 p-8 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-700">
                <ShieldAlert className="h-64 w-64 text-blue-100" />
             </div>
             <CardHeader className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-2 w-2 rounded-full bg-blue-400 animate-ping" />
                  <CardTitle className="text-blue-300 uppercase tracking-[0.2em] text-[10px] font-black">{t("dpo.regulatory_sentinel")}</CardTitle>
                </div>
             </CardHeader>
             <CardContent className="space-y-8 relative z-10 pt-4">
                <div className="space-y-4">
                   <div className="flex items-center gap-3">
                      <h3 className="text-3xl font-black text-white leading-tight">GDPR Amendment 2026</h3>
                      <Badge className="bg-rose-500/80 hover:bg-rose-500 text-white border-none text-[10px] font-black">CRITICAL</Badge>
                   </div>
                   <p className="text-slate-300 text-base leading-relaxed font-medium">
                     New requirements for cross-border data transfers to AI providers detected. 12 active contracts require immediate amendment.
                   </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-slate-950/40 p-4 rounded-xl border border-white/5">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Exposure</p>
                      <p className="text-xl font-black text-white">$450K</p>
                   </div>
                   <div className="bg-slate-950/40 p-4 rounded-xl border border-white/5">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Impact</p>
                      <p className="text-xl font-black text-white">Major</p>
                   </div>
                </div>

                <div className="pt-4">
                   <Button className="w-full bg-white text-blue-950 hover:bg-slate-200 h-14 text-lg font-black shadow-2xl shadow-blue-500/40 transition-all hover:scale-[1.02] active:scale-[0.98]">
                      {t("dpo.analyze_impact")}
                   </Button>
                </div>
             </CardContent>
          </Card>
        </motion.div>

        {/* ── Compliance Trajectory + Redline Intelligence ───────────────── */}
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Trend Line Chart */}
          <Card className="lg:col-span-2 bg-slate-900/40 border-slate-800/60 backdrop-blur-3xl shadow-xl overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl font-bold flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-emerald-400" />
                </div>
                Compliance Trajectory
              </CardTitle>
              <CardDescription className="text-slate-400">Audit score trend with Intelligence review activity overlay</CardDescription>
            </CardHeader>
            <CardContent className="h-[260px] pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics?.trendAnalysis}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} domain={[50, 100]} />
                  <RechartsTooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div className="bg-slate-950/90 border border-slate-800 p-3 rounded-lg text-xs shadow-2xl">
                          <p className="font-black text-slate-100 uppercase tracking-widest mb-2">{label}</p>
                          <p className="text-blue-400">Score: <span className="font-bold">{payload[0]?.value}%</span></p>
                          {payload[1] && <p className="text-emerald-400">Redlines: <span className="font-bold">{payload[1]?.value}</span></p>}
                        </div>
                      );
                    }}
                  />
                  <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2.5} dot={{ fill: '#3b82f6', r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="redlines" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" dot={{ fill: '#10b981', r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Neural Redline Efficiency Panel */}
          <Card className="bg-gradient-to-br from-slate-900/60 to-indigo-900/20 border-indigo-500/20 backdrop-blur-3xl shadow-xl overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl font-bold flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                  <Brain className="h-5 w-5 text-indigo-400" />
                </div>
                Smart Clause Review
              </CardTitle>
              <CardDescription className="text-slate-400">Intelligence clause remediation efficiency</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-4">
              {/* Acceptance Rate Ring */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950/40 border border-slate-800/50">
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Acceptance Rate</p>
                  <p className="text-4xl font-black text-indigo-300 mt-1">{metrics?.remediationStats?.acceptanceRate ?? 0}%</p>
                </div>
                <CheckCircle2 className="h-12 w-12 text-indigo-400/30" />
              </div>
              {/* Stats Grid */}
              {[
                { label: "Total Redlines", value: metrics?.remediationStats?.total ?? 0, color: "text-slate-100" },
                { label: "Accepted", value: metrics?.remediationStats?.accepted ?? 0, color: "text-emerald-400" },
                { label: "Pending Review", value: metrics?.remediationStats?.pending ?? 0, color: "text-amber-400" },
                { label: "Rejected", value: metrics?.remediationStats?.rejected ?? 0, color: "text-rose-400" },
              ].map(stat => (
                <div key={stat.label} className="flex justify-between items-center py-2 border-b border-slate-800/40 last:border-0">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</span>
                  <span className={`text-lg font-black ${stat.color}`}>{stat.value}</span>
                </div>
              ))}
              <Button asChild variant="outline" className="w-full border-indigo-500/30 bg-indigo-500/5 hover:bg-indigo-500/20 text-indigo-300 mt-2">
                <a href="/redline-studio">Open Review Studio <ChevronRight className="ml-1 h-4 w-4" /></a>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

// Removed local MetricCard implementation

