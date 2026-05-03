import { Layout } from "@/components/Layout";
import { useDashboardStats } from "@/hooks/use-dashboard";
import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, PieChart, Pie } from "recharts";
import { DollarSign, ShieldCheck, FileCheck, Zap, Activity, Users, Clock, Package, Server } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { SEO } from "@/components/SEO";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { MetricCard } from "@/components/MetricCard";
import { OnboardingChecklist } from "@/components/OnboardingChecklist";
import { useClients } from "@/hooks/use-clients";
import { useComplianceAudits } from "@/hooks/use-compliance";
import { SovereignTelemetry } from "@/components/SovereignTelemetry";

interface RegionalSharding {
  region: string;
  count: number;
}

interface CostByVendor {
  vendor: string;
  cost: number;
}

interface RiskHeatmapEntry {
  category: string;
  count: number;
}

interface DashboardStats {
  totalAnnualCost: number;
  totalContracts: number;
  criticalRisks: number;
  upcomingRenewals: any[];
  intelligenceEfficiency: {
    totalCached: number;
    totalSavedUsd: number;
  };
  regionalDistribution: RegionalSharding[];
  collaborativeMetrics: {
    activeCollaborators: number;
  };
  costByVendor: CostByVendor[];
  riskHeatmap: RiskHeatmapEntry[];
  activePipelinesCount?: number;
}

export default function Dashboard() {
  const { t } = useTranslation();
  const { data: stats, isLoading: statsLoading } = useDashboardStats() as { data: DashboardStats | undefined, isLoading: boolean };
  const { data: clients, isLoading: clientsLoading } = useClients();
  const { data: audits, isLoading: auditsLoading } = useComplianceAudits();

  const isLoading = statsLoading || clientsLoading || auditsLoading;

  if (isLoading) return <Layout><div className="text-center py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary/50" /></div></Layout>;

  return (
    <Layout header={
      <div className="flex w-full items-center justify-between">
         <div>
           <h1 className="text-3xl font-bold tracking-tight gradient-text-nutanix">{t("dashboard.title")}</h1>
           <p className="text-xs text-muted-foreground mt-1">Platform overview and strategic insights.</p>
         </div>
         <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Button 
              variant="outline"
              className="rounded-lg h-9 px-4 gap-2 text-xs font-semibold border-slate-200 dark:border-slate-800"
              onClick={() => window.location.href = "/api/reports/strategic-pack"}
            >
              <Package className="w-4 h-4" />
              {t("dashboard.strategic_pack")}
            </Button>
         </div>
      </div>
    }>
      <SEO title="Dashboard | Costloci" description="Monitor your enterprise posture and contract ROI." />

      <div className="space-y-8 pb-12 pt-4 animate-slide-up">
        {/* Onboarding Wizard */}
        <OnboardingChecklist 
          hasClients={(clients?.length || 0) > 0} 
          hasContracts={(stats?.totalContracts || 0) > 0} 
          hasAudits={(audits?.length || 0) > 0} 
        />

        {/* Top Level KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard label={t("dashboard.annual_spend")} value={`$${(stats?.totalAnnualCost || 0).toLocaleString()}`} icon={<DollarSign className="w-5 h-5 text-emerald-500" />} />
          <MetricCard label={t("dashboard.missing_renewals")} value={stats?.upcomingRenewals?.length || 0} icon={<Clock className="w-5 h-5 text-amber-500" />} />
          <MetricCard label={t("dashboard.analyzed_contracts")} value={stats?.totalContracts || 0} icon={<FileCheck className="w-5 h-5 text-blue-500" />} />
          <MetricCard label={t("dashboard.critical_risks")} value={stats?.criticalRisks || 0} icon={<ShieldCheck className="w-5 h-5 text-rose-500" />} />
          <MetricCard label="Active Pipelines" value={stats?.activePipelinesCount || 0} icon={<Activity className="w-5 h-5 text-indigo-500" />} />
        </div>

        {/* Enterprise Intelligence row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <Card className="nutanix-card bg-gradient-to-br from-blue-900/10 to-indigo-900/10">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                   <CardTitle className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Zap className="w-3 h-3" />
                    Intelligence Efficiency
                  </CardTitle>
                  <Badge variant="outline" className="bg-blue-900/30 border-blue-500/20 text-[8px] text-blue-400 uppercase font-black">Optimized</Badge>
                </div>
              </CardHeader>
              <CardContent>
                 <div className="flex items-end justify-between">
                    <div>
                      <p className="text-3xl font-black text-white italic">
                        {stats?.intelligenceEfficiency?.totalCached || 0}
                      </p>
                      <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Optimized Audit Checks</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-emerald-400 flex items-center gap-1 justify-end italic">
                        +${stats?.intelligenceEfficiency?.totalSavedUsd?.toFixed(2) || "0.00"}
                      </p>
                      <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Efficiency Savings</p>
                    </div>
                 </div>
              </CardContent>
           </Card>

           <Card className="nutanix-card bg-gradient-to-br from-emerald-900/10 to-teal-900/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Activity className="w-3 h-3" />
                  Regional Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                 <div className="flex items-center gap-2">
                    {stats?.regionalDistribution?.map((d: RegionalSharding) => (
                      <div key={d.region} className="flex-1">
                        <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5">
                           <div 
                             className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-1000" 
                             style={{ width: `${(d.count / (stats.totalContracts || 1)) * 100}%` }}
                           />
                        </div>
                        <p className="text-[8px] mt-2 text-slate-500 uppercase font-black tracking-widest">{d.region}</p>
                      </div>
                    ))}
                 </div>
              </CardContent>
           </Card>

           <SovereignTelemetry />
        </div>

        {stats?.totalContracts === 0 ? (
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm border-dashed bg-slate-50/50 dark:bg-slate-900/20 text-center py-20">
            <CardContent>
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <FileCheck className="w-8 h-8 text-blue-500" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground">Welcome to Costloci</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Your enterprise hub is ready. To unlock intelligence, risk detection, and cost optimization, upload your first cybersecurity contract or software license.
                </p>
                <div className="pt-4">
                  <Link href="/contracts">
                    <Button className="rounded-lg gap-2 nutanix-glow bg-indigo-600 hover:bg-indigo-500 text-white border-0" size="lg">
                      <Package className="w-4 h-4" />
                      Add First Contract
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Spend by Vendor</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 w-full min-h-[300px] pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats?.costByVendor || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} className="dark:stroke-slate-800" />
                      <XAxis dataKey="vendor" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                      <Tooltip
                        {...({
                          contentStyle: { backgroundColor: "#ffffff", borderColor: "#f1f5f9", borderRadius: "10px", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" },
                          itemStyle: { fontSize: "12px" },
                          cursor: { fill: "#f8fafc" }
                        } as any)}
                      />
                      <Bar dataKey="cost" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={32}>
                        {stats?.costByVendor?.map((entry: CostByVendor, index: number) => (
                          <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#10b981" : "#059669"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Risk Distribution</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 w-full min-h-[300px] pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats?.riskHeatmap?.length ? stats.riskHeatmap : [{ category: "No Data", count: 1 }]}
                        cx="50%"
                        cy="45%"
                        innerRadius={65}
                        outerRadius={85}
                        paddingAngle={6}
                        dataKey="count"
                        nameKey="category"
                      >
                        {stats?.riskHeatmap?.map((entry: RiskHeatmapEntry, i: number) => (
                          <Cell key={i} fill={["#10b981", "#3b82f6", "#f43f5e", "#f59e0b"][i % 4]} />
                        ))}
                      </Pie>
                      <Tooltip
                        {...({
                          contentStyle: { backgroundColor: "#ffffff", borderColor: "#f1f5f9", borderRadius: "10px" }
                        } as any)}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Recent Contracts / Upcoming Renewals */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <Clock className="w-4 h-4 text-primary" />
                <h2 className="text-lg font-bold tracking-tight text-foreground truncate">
                  {t("dashboard.upcoming_renewals")}
                </h2>
              </div>
              <Card className="border-slate-200 dark:border-slate-800 shadow-sm rounded-xl overflow-hidden">
                <CardContent className="p-0">
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {(!stats?.upcomingRenewals || stats.upcomingRenewals.length === 0) && (
                      <div className="p-12 text-center">
                        <p className="text-slate-400 text-sm">{t("dashboard.no_renewals")}</p>
                      </div>
                    )}
                    {stats?.upcomingRenewals?.map((contract: any) => (
                      <div key={contract.id} className="flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors group">
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{contract.vendorName}</p>
                          <p className="text-xs text-slate-500 mt-1">{contract.category}</p>
                        </div>
                        <div className="text-right flex items-center gap-6">
                           <div className="hidden sm:block">
                             <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Renew Date</p>
                             <p className="text-xs font-mono text-slate-600 dark:text-slate-400">{contract.renewalDate || "—"}</p>
                           </div>
                           <Link href={`/contracts/${contract.id}`}>
                              <Button variant="ghost" size="sm" className="h-8 text-primary hover:text-primary hover:bg-primary/5">
                                {t("dashboard.review_contract")}
                              </Button>
                           </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}

      </div>
    </Layout>
  );
}
