import { Layout } from "@/components/Layout";
import { useDashboardStats } from "@/hooks/use-dashboard";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, PieChart, Pie } from "recharts";
import { motion } from "framer-motion";
import { DollarSign, ShieldCheck, FileCheck, Zap, Activity, Users, Clock, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { SEO } from "@/components/SEO";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function Dashboard() {
  const { t } = useTranslation();
  const { data: stats, isLoading } = useDashboardStats();

  if (isLoading) return <Layout><div className="text-center py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></Layout>;

  return (
    <Layout header={
      <div className="flex w-full items-center justify-between">
         <h1 className="text-2xl font-bold tracking-tight text-white">{t("dashboard.title")}</h1>
         <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Button 
              className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 rounded-xl font-black uppercase text-[10px] tracking-widest h-10 px-6 gap-2"
              onClick={() => window.location.href = "/api/reports/strategic-pack"}
            >
              <Package className="w-4 h-4" />
              {t("dashboard.strategic_pack")}
            </Button>
         </div>
      </div>
    }>
      <SEO title="Enterprise Dashboard" description="Monitor your cybersecurity posture and contract ROI." />

      <div className="space-y-8 pb-12 pt-4">
        {/* Top Level KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard label={t("dashboard.annual_spend")} value={`$${(stats?.totalAnnualCost || 0).toLocaleString()}`} icon={DollarSign} color="text-emerald-400" />
          <MetricCard label={t("dashboard.missing_renewals")} value={stats?.upcomingRenewals?.length || 0} icon={Clock} color="text-amber-400" />
          <MetricCard label={t("dashboard.analyzed_contracts")} value={stats?.totalContracts || 0} icon={FileCheck} color="text-blue-400" />
          <MetricCard label={t("dashboard.critical_risks")} value={stats?.criticalRisks || 0} icon={ShieldCheck} color="text-rose-400" />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto min-h-[350px]">
          <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-sm overflow-hidden flex flex-col">
            <h3 className="text-sm font-semibold tracking-wider uppercase text-slate-400 mb-6">Spend vs Vendors</h3>
            <div className="flex-1 w-full min-h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.costByVendor || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="vendor" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", borderRadius: "8px" }}
                    itemStyle={{ color: "#f8fafc" }}
                    cursor={{ fill: "#1e293b" }}
                  />
                  <Bar dataKey="cost" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40}>
                    {stats?.costByVendor?.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#10b981" : "#059669"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col">
            <h3 className="text-sm font-semibold tracking-wider uppercase text-slate-400 mb-6">Risk Categories</h3>
            <div className="flex-1 w-full min-h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.riskHeatmap?.length ? stats.riskHeatmap : [{ category: "No Data", count: 1 }]}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="category"
                  >
                    {stats?.riskHeatmap?.map((entry: any, i: number) => (
                      <Cell key={i} fill={["#10b981", "#3b82f6", "#64748b", "#f43f5e"][i % 4]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", borderRadius: "8px" }}
                    itemStyle={{ color: "#f8fafc" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent Contracts / Upcoming Renewals */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold tracking-tight mb-4 flex items-center gap-2 text-white">
             <Clock className="w-4 h-4 text-emerald-400" /> {t("dashboard.upcoming_renewals")}
          </h2>
          <Card className="bg-slate-900/50 border-slate-800 shadow-sm rounded-xl overflow-hidden">
            <CardContent className="p-0">
              <div className="divide-y divide-slate-800/60">
                {stats?.upcomingRenewals?.length === 0 && <p className="text-slate-500 p-6 text-sm">{t("dashboard.no_renewals")}</p>}
                {stats?.upcomingRenewals?.map((contract: any) => (
                  <div key={contract.id} className="flex items-center justify-between p-5 hover:bg-slate-800/30 transition-colors">
                    <div>
                      <p className="font-semibold text-slate-200 text-sm">{contract.vendorName}</p>
                      <p className="text-xs text-slate-500 mt-1">{contract.category}</p>
                    </div>
                    <div className="text-right flex flex-col items-end">
                       <Badge variant="outline" className="mb-2 text-slate-300 border-slate-700 font-normal">
                          {contract.renewalDate || "Unknown"}
                       </Badge>
                       <Link href={`/contracts/${contract.id}`} className="text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
                          {t("dashboard.review_contract")}
                       </Link>
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
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative bg-slate-900/40 backdrop-blur-md border border-white/5 p-6 rounded-2xl shadow-xl hover:border-emerald-500/20 transition-all group overflow-hidden"
    >
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-colors" />
      <div className="flex justify-between items-start relative z-10">
        <div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">{label}</p>
          <h3 className="text-3xl font-black tracking-tighter text-white italic">
            {value}
          </h3>
        </div>
        <div className={`p-3 rounded-xl bg-slate-950 border border-white/10 shadow-inner group-hover:scale-110 transition-transform ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </motion.div>
  );
}
