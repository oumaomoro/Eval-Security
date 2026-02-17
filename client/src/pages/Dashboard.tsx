import { Layout } from "@/components/Layout";
import { useDashboardStats } from "@/hooks/use-dashboard";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, PieChart, Pie } from "recharts";
import { motion } from "framer-motion";
import { AlertCircle, DollarSign, ShieldCheck, FileCheck } from "lucide-react";

export default function Dashboard() {
  const { data: stats, isLoading } = useDashboardStats();

  if (isLoading) return <Layout><div className="text-center py-20">Loading dashboard...</div></Layout>;

  const statCards = [
    { label: "Total Contracts", value: stats?.totalContracts, icon: FileCheck, color: "text-blue-500" },
    { label: "Annual Spend", value: `$${(stats?.totalAnnualCost || 0).toLocaleString()}`, icon: DollarSign, color: "text-emerald-500" },
    { label: "Avg Compliance", value: `${Math.round(stats?.avgComplianceScore || 0)}%`, icon: ShieldCheck, color: "text-cyan-500" },
    { label: "Critical Risks", value: stats?.criticalRisks, icon: AlertCircle, color: "text-red-500" },
  ];

  return (
    <Layout header={<h1 className="text-2xl font-bold">Executive Dashboard</h1>}>
      <div className="grid gap-6">
        
        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-card border border-border p-6 rounded-2xl shadow-lg hover:border-primary/50 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <h3 className="text-3xl font-bold mt-2 font-mono">{stat.value}</h3>
                </div>
                <div className={`p-3 rounded-xl bg-background/50 border border-border ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-96">
          <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-lg">
            <h3 className="text-lg font-bold mb-6">Spend by Vendor</h3>
            <ResponsiveContainer width="100%" height="85%">
              <BarChart data={stats?.costByVendor || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="vendor" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v/1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", borderRadius: "8px" }}
                  itemStyle={{ color: "#f8fafc" }}
                  cursor={{ fill: "#1e293b" }}
                />
                <Bar dataKey="cost" fill="#06b6d4" radius={[4, 4, 0, 0]} maxBarSize={50}>
                  {stats?.costByVendor?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#06b6d4" : "#0891b2"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 shadow-lg">
            <h3 className="text-lg font-bold mb-6">Risk Overview</h3>
            <div className="h-full flex items-center justify-center -mt-8">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Critical', value: stats?.criticalRisks || 0 },
                      { name: 'Safe', value: (stats?.totalContracts || 1) - (stats?.criticalRisks || 0) }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    <Cell fill="#ef4444" />
                    <Cell fill="#10b981" />
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", borderRadius: "8px" }}
                    itemStyle={{ color: "#f8fafc" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span>Critical Risks</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span>Compliant</span>
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Renewals */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-lg">
          <h3 className="text-lg font-bold mb-4">Upcoming Renewals</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-background/50 border-b border-border">
                <tr>
                  <th className="px-6 py-3">Vendor</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Renewal Date</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {stats?.upcomingRenewals?.map((contract) => (
                  <tr key={contract.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">{contract.vendorName}</td>
                    <td className="px-6 py-4 text-muted-foreground">{contract.category}</td>
                    <td className="px-6 py-4 font-mono">{contract.renewalDate}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-full bg-orange-500/10 text-orange-500 text-xs font-bold border border-orange-500/20">
                        Renewal Soon
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-medium">
                      ${contract.annualCost?.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
