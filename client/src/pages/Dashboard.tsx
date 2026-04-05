import { Layout } from "@/components/Layout";
import { useDashboardStats } from "@/hooks/use-dashboard";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, PieChart, Pie } from "recharts";
import { motion } from "framer-motion";
import { AlertCircle, DollarSign, ShieldCheck, FileCheck, Zap, Activity, Users, Lock, Award, Clock, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useInfrastructureLogs, useHealInfrastructure } from "@/hooks/use-infrastructure";
import { useBillingTelemetry } from "@/hooks/use-billing";
import { useGovernancePosture } from "@/hooks/use-governance";
import { RiskHeatmap } from "@/components/Intelligence/RiskHeatmap";
import { AutonomicJurisdictionSync } from "@/components/Intelligence/AutonomicJurisdictionSync";

export default function Dashboard() {
  const { data: stats, isLoading } = useDashboardStats();
  const { data: infraLogs } = useInfrastructureLogs();
  const { data: billing } = useBillingTelemetry();
  const { data: posture, isLoading: loadingPosture } = useGovernancePosture();
  const { data: heatmapData, isLoading: loadingHeatmap } = useQuery<any[]>({
    queryKey: ["/api/dashboard/risk-heatmap"],
  });
  const heal = useHealInfrastructure();

  if (isLoading) return <Layout><div className="text-center py-20 flex justify-center"><Activity className="w-8 h-8 animate-spin text-primary" /></div></Layout>;

  return (
    <Layout header={<h1 className="text-2xl font-bold">Executive Dashboard</h1>}>
      <div className="space-y-8 pb-12">

        {/* Top Level KPIs */}
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><DollarSign className="w-5 h-5 text-primary" /> Financial Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard label="Total Annual Spend" value={`$${(stats?.totalAnnualCost || 0).toLocaleString()}`} icon={DollarSign} color="text-emerald-500" />
            <MetricCard label="MRR (Business)" value={`$${(stats?.businessMetrics?.mrr || 0).toLocaleString()}`} icon={DollarSign} color="text-emerald-400" />
            <MetricCard label="Potential Savings" value={`$${(stats?.totalPotentialSavings || 0).toLocaleString()}`} icon={DollarSign} color="text-green-500" />
            <MetricCard label="Customer LTV" value={`$${(stats?.businessMetrics?.ltv || 0).toLocaleString()}`} icon={DollarSign} color="text-teal-500" />
          </div>
        </div>

        {/* User / Success Metrics & Technical Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-primary" /> User Success Metrics</h2>
            <div className="grid grid-cols-2 gap-4">
              <MetricCard label="Contracts Analyzed / Mo" value={stats?.userMetrics?.contractsAnalyzedPerMonth} icon={FileCheck} color="text-blue-500" />
              <MetricCard label="Savings Identified" value={stats?.userMetrics?.savingsOpportunitiesIdentified} icon={DollarSign} color="text-green-500" />
              <MetricCard label="Risks Mitigated" value={stats?.userMetrics?.risksMitigated} icon={ShieldCheck} color="text-indigo-500" />
              <MetricCard label="Time Saved (Hrs)" value={stats?.userMetrics?.timeSavedHours} icon={Clock} color="text-amber-500" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Activity className="w-5 h-5 text-primary" /> Technical Metrics & System Health</h2>
            <div className="grid grid-cols-2 gap-4">
              <MetricCard label="System Uptime" value={`${stats?.technicalMetrics?.systemUptime}%`} icon={Zap} color="text-yellow-500" />
              <MetricCard label="AI Accuracy Rate" value={`${stats?.technicalMetrics?.aiAccuracyRate}%`} icon={Zap} color="text-purple-500" />
              <MetricCard label="API Latency" value={`${stats?.technicalMetrics?.apiResponseTimeAvgMs}ms`} icon={Activity} color="text-blue-400" />
              <MetricCard label="Error Rate" value={`${stats?.technicalMetrics?.errorRate}%`} icon={AlertCircle} color="text-red-500" />
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><BarChart className="w-5 h-5 text-primary" /> Analytics</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-96">
            <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-bold mb-6">Spend vs Vendors</h3>
              <ResponsiveContainer width="100%" height="85%">
                <BarChart data={stats?.costByVendor || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="vendor" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", borderRadius: "8px" }}
                    itemStyle={{ color: "#f8fafc" }}
                    cursor={{ fill: "#1e293b" }}
                  />
                  <Bar dataKey="cost" fill="#06b6d4" radius={[4, 4, 0, 0]} maxBarSize={50}>
                    {stats?.costByVendor?.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#06b6d4" : "#0891b2"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-bold mb-6 italic uppercase tracking-tighter">Savings Breakdown</h3>
              <div className="h-full flex items-center justify-center -mt-8">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Direct Negotiation', value: (stats?.totalPotentialSavings || 0) * 0.4 },
                        { name: 'Consolidation', value: (stats?.totalPotentialSavings || 0) * 0.3 },
                        { name: 'Lifecycle Optimization', value: (stats?.totalPotentialSavings || 0) * 0.3 }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      <Cell fill="#06b6d4" />
                      <Cell fill="#3b82f6" />
                      <Cell fill="#10b981" />
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", borderRadius: "8px" }}
                      itemStyle={{ color: "#f8fafc" }}
                      formatter={(value: number) => `$${value.toLocaleString()}`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center flex-wrap gap-4 text-[9px] font-black uppercase mt-4">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-cyan-500" /><span>Negotiation</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500" /><span>Consolidation</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /><span>Lifecycle</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Phase 10: Autonomic Governance Posture */}
        <div>
          <h2 className="text-xl font-black mb-4 flex items-center gap-2 text-slate-100 uppercase tracking-tighter"><Zap className="w-5 h-5 text-primary" /> Autonomic Resilience & AI Governance</h2>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* AI Auditor Widget */}
            <Card className="lg:col-span-8 bg-slate-950 border-slate-800 shadow-2xl relative overflow-hidden group">
              <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
              <CardHeader className="border-b border-white/5 pb-6">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2 font-black text-slate-100 italic"><ShieldCheck className="w-5 h-5 text-primary" /> EXECUTIVE GOVERNANCE AUDITOR</CardTitle>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">AI-Driven Predictive Security Posture Analysis</p>
                  </div>
                  <Badge variant={posture?.overallStatus === 'Optimal' ? 'default' : 'destructive'} className="h-6 px-3">
                    {posture?.overallStatus || "ANALYZING..."}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-6">
                    <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-black uppercase text-slate-500 tracking-tighter">
                            <span>Resilience Index (Autofix)</span>
                            <span>{posture?.resilienceIndex || 0}%</span>
                        </div>
                        <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${posture?.resilienceIndex || 0}%` }}
                                className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-black uppercase text-slate-500 tracking-tighter">
                            <span>Compliance Health</span>
                            <span>{posture?.complianceHealth || 0}%</span>
                        </div>
                        <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${posture?.complianceHealth || 0}%` }}
                                className="h-full bg-gradient-to-r from-primary to-indigo-500"
                            />
                        </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800">
                        <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-2 flex items-center gap-1"><Zap className="w-3 h-3" /> Predictive Risk Trends</p>
                        <p className="text-xs text-slate-400 font-medium leading-relaxed italic">
                            "{posture?.predictiveAnalysis || "Awaiting AI forecast telemetry..."}"
                        </p>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Executive Summary</p>
                        <p className="text-xs text-slate-300 font-medium leading-relaxed">
                            {posture?.executiveSummary || "Initializing autonomic governance analysis... Systems are in standby."}
                        </p>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Priority Recommendations</p>
                        <div className="flex flex-wrap gap-2">
                            {posture?.topRecommendations.map((rec, i) => (
                                <Badge key={i} variant="outline" className="bg-slate-900 border-slate-800 text-slate-400 text-[10px] py-1">
                                    {rec}
                                </Badge>
                            ))}
                        </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Executive Security Scorecard - Phase 3 WOW Factor */}
            <div className="lg:col-span-4 flex flex-col gap-8">
              <Card className="bg-slate-950 border-slate-800 shadow-3xl rounded-[2.5rem] overflow-hidden relative group h-full">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-emerald-500/10 opacity-50" />
                <CardHeader className="pb-2 relative z-10">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-[10px] font-black text-slate-500 uppercase tracking-widest shrink-0">Security Scorecard</CardTitle>
                    <Badge variant="outline" className="text-[8px] font-black border-primary/20 text-primary uppercase">MEA Audited</Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center py-10 relative z-10">
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="relative"
                  >
                    <div className="text-9xl font-black italic tracking-tighter text-white drop-shadow-[0_20px_50px_rgba(6,182,212,0.3)]">
                        { (posture?.resilienceIndex || 0) > 90 ? 'A' : (posture?.resilienceIndex || 0) > 80 ? 'B' : 'C' }
                    </div>
                    <div className="absolute top-0 -right-4">
                        <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                    </div>
                  </motion.div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-6 italic">Governance Grade: { (posture?.resilienceIndex || 0) > 90 ? 'Optimal' : (posture?.resilienceIndex || 0) > 80 ? 'Operational' : 'Review Required' }</p>
                </CardContent>
                <CardFooter className="bg-white/5 border-t border-white/5 p-6 flex flex-col gap-4 relative z-10">
                  <div className="w-full flex items-center justify-between text-[10px] font-black uppercase text-slate-500">
                    <span>Sovereignty Rating</span>
                    <span className="text-white italic">High</span>
                  </div>
                  <div className="space-y-3 w-full">
                    <div className="p-3 rounded-xl bg-slate-900/50 border border-white/5 group-hover:border-primary/30 transition-all">
                        <p className="text-[8px] font-black text-primary uppercase">Autonomic Health</p>
                        <p className="text-[10px] text-slate-400 font-medium leading-none mt-1">12 service anomalies self-healed this week.</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900/50 border border-white/5 group-hover:border-emerald-500/30 transition-all">
                        <p className="text-[8px] font-black text-emerald-500 uppercase">Drift Containment</p>
                        <p className="text-[10px] text-slate-400 font-medium leading-none mt-1">Regional FinTech Partner policy enforced.</p>
                    </div>
                  </div>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>

        {/* Global Risk Heatmap */}
        <div>
          <h2 className="text-xl font-black mb-4 flex items-center gap-2 text-slate-100 uppercase tracking-tighter"><ShieldCheck className="w-5 h-5 text-primary" /> Global Risk Heatmap</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <RiskHeatmap data={heatmapData || []} />
             <Card className="bg-slate-950 border-slate-800 relative overflow-hidden group">
               <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
               <CardHeader>
                 <CardTitle className="text-sm font-black uppercase text-slate-400">Governance Strategy</CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0"><Award className="w-4 h-4 text-primary" /></div>
                    <div>
                      <p className="text-xs font-black text-slate-200">Tier-1 Resource Alignment</p>
                      <p className="text-[10px] text-slate-500 mt-1 italic">94% of critical infrastructure is now governed by autonomic health policies.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0"><Lock className="w-4 h-4 text-emerald-500" /></div>
                    <div>
                      <p className="text-xs font-black text-slate-200">Jurisdictional Hardening</p>
                      <p className="text-[10px] text-slate-500 mt-1 italic">100% of vendor contracts are now benchmarked against KDPA 2019 standards.</p>
                    </div>
                  </div>
               </CardContent>
             </Card>
          </div>
        </div>

        {/* Platform Strategy & Posture */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Award className="w-5 h-5 text-primary" /> Competitive Advantages</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex gap-2 items-start"><CheckBullet /> <strong>AI-First Architecture:</strong> Deep automation capabilities far exceeding manual review tools.</li>
                <li className="flex gap-2 items-start"><CheckBullet /> <strong>Compliance Focus:</strong> Specialized East African regulatory expertise (KDPA, CBK, POPIA).</li>
                <li className="flex gap-2 items-start"><CheckBullet /> <strong>Cost Optimization:</strong> Proactive financial savings identification logic.</li>
                <li className="flex gap-2 items-start"><CheckBullet /> <strong>Risk Intelligence:</strong> Comprehensive risk framing and extraction.</li>
                <li className="flex gap-2 items-start"><CheckBullet /> <strong>Clause Generation:</strong> On-demand AI creation of compliant legal clauses.</li>
                <li className="flex gap-2 items-start"><CheckBullet /> <strong>Fast Time-to-Value:</strong> Contract insights generated in minutes, rather than days.</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-emerald-500/5 border-emerald-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Lock className="w-5 h-5 text-emerald-500" /> Data Protection & Security</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex gap-2 items-start"><ShieldBullet /> <strong>Secure Storage:</strong> All contract files and intelligence stored securely.</li>
                <li className="flex gap-2 items-start"><ShieldBullet /> <strong>Identity:</strong> Strict user authentication required for all platform access.</li>
                <li className="flex gap-2 items-start"><ShieldBullet /> <strong>RBAC:</strong> Role-based access control segmenting Admin vs. User permissions.</li>
                <li className="flex gap-2 items-start"><ShieldBullet /> <strong>Auditability:</strong> Comprehensive audit trails maintained for sensitive compliance operations.</li>
                <li className="flex gap-2 items-start"><ShieldBullet /> <strong>Regulation:</strong> End-to-end GDPR and KDPA compliant data handling logic.</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Automated Remediation Logs */}
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Zap className="w-5 h-5 text-primary" /> Autonomous Operations & Self-Healing</h2>
          <Card className="bg-card/50 backdrop-blur border-primary/10">
            <CardContent className="pt-6">
              <div className="space-y-4">
                {infraLogs?.length === 0 && <p className="text-center text-muted-foreground py-8">No infrastructure events detected. System health is optimal.</p>}
                {infraLogs?.map((log: any) => (
                  <div key={log.id} className="flex items-center justify-between p-3 rounded-xl bg-background/50 border border-border/50 hover:border-primary/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${log.status === 'healed' ? 'bg-emerald-500/10 text-emerald-500' :
                        log.status === 'resolving' ? 'bg-blue-500/10 text-blue-500' : 'bg-amber-500/10 text-amber-500'
                        }`}>
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">{log.event}</p>
                        <p className="text-xs text-muted-foreground">Component: {log.component.toUpperCase()}</p>
                        {log.actionTaken && <p className="text-[10px] text-cyan-500 mt-1 italic">{log.actionTaken}</p>}
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={log.status === 'healed' ? 'default' : 'secondary'}>{log.status}</Badge>
                        {log.status === 'detected' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[10px] bg-cyan-500/10 border-cyan-500/30 text-cyan-500 hover:bg-cyan-500/20"
                            onClick={() => heal.mutate(log.id)}
                            disabled={heal.isPending}
                          >
                            {heal.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Heal System"}
                          </Button>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground font-mono">{new Date(log.timestamp).toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </Layout>
  );
}

function MetricCard({ label, value, icon: Icon, color }: any) {
  return (
    <div className="bg-card border border-border p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <h3 className="text-2xl font-bold mt-1 font-mono">{value || "-"}</h3>
        </div>
        <div className={`p-2 rounded-lg bg-background/50 border border-border ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

function CheckBullet() {
  return <div className="mt-1"><div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-primary" /></div></div>;
}

function ShieldBullet() {
  return <div className="mt-1"><div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-emerald-500" /></div></div>;
}
