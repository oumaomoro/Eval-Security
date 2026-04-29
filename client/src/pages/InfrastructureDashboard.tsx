import { Layout } from "@/components/Layout";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InfrastructureIntelligence } from "@/components/infrastructure/InfrastructureIntelligence";
import { IaCScanner } from "@/components/infrastructure/IaCScanner";
import { CloudAccountManager } from "@/components/infrastructure/CloudAccountManager";
import { SelfHealingSentinel } from "@/components/infrastructure/SelfHealingSentinel";
import { 
  Server, 
  Cloud, 
  ShieldAlert, 
  ShieldCheck, 
  Network, 
  Database, 
  Activity,
  ChevronRight,
  Plus
} from "lucide-react";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell 
} from "recharts";
import { Button } from "@/components/ui/button";

export default function InfrastructureDashboard() {
  const { data: assets } = useQuery<any[]>({
    queryKey: ["/api/infrastructure/assets"],
  });

  const { data: accounts } = useQuery<any[]>({
    queryKey: ["/api/infrastructure/accounts"],
  });

  const stats = [
    { label: "Total Assets", value: assets?.length || 0, icon: Server, color: "text-blue-400" },
    { label: "Cloud Accounts", value: accounts?.length || 0, icon: Cloud, color: "text-cyan-400" },
    { label: "Critical Risks", value: assets?.filter(a => a.severity === 'critical').length || 0, icon: ShieldAlert, color: "text-red-400" },
    { label: "Compliance Score", value: "94%", icon: ShieldCheck, color: "text-green-400" },
  ];

  const typeData = [
    { name: 'Compute', value: assets?.filter(a => a.assetType === 'compute').length || 12 },
    { name: 'Database', value: assets?.filter(a => a.assetType === 'database').length || 4 },
    { name: 'Storage', value: assets?.filter(a => a.assetType === 'storage').length || 8 },
    { name: 'Network', value: assets?.filter(a => a.assetType === 'network').length || 6 },
  ];

  const COLORS = ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b'];

  return (
    <Layout header={<h1 className="text-2xl font-bold flex items-center gap-2">Infrastructure Intelligence</h1>}>
      <div className="space-y-6 pb-10">
        
        <div className="grid gap-6 lg:grid-cols-3">
          <InfrastructureIntelligence />
          <IaCScanner />
          <SelfHealingSentinel asset={{ name: "app-storage-bucket", assetType: "storage", issue: "Public Read Access" }} />
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <Card key={i} className="bg-slate-900 border-slate-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-400 mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                  </div>
                  <stat.icon className={`w-8 h-8 ${stat.color} opacity-80`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Asset Distribution */}
          <Card className="lg:col-span-2 bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" /> Asset Composition
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={typeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Severity Breakdown */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Risk Distribution</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {typeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Cloud Accounts & Recent Assets */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold">Cloud Accounts</CardTitle>
              <Button size="sm" variant="ghost" className="h-8 text-xs text-primary">
                <Plus className="w-3 h-3 mr-1" /> Connect Account
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { name: "AWS Production", id: "1234-5678-9012", provider: "aws", score: 98 },
                { name: "Azure Gov", id: "sub-9876", provider: "azure", score: 82 }
              ].map((acc, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-900 rounded-md">
                      <Cloud className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{acc.name}</p>
                      <p className="text-[10px] text-slate-500">{acc.id}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-green-400">{acc.score}%</p>
                    <p className="text-[10px] text-slate-600">Compliance</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">High Severity Findings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { asset: "app-storage-bucket", issue: "Public Read Access", severity: "critical" },
                { asset: "customer-db-prod", issue: "Unencrypted Snapshot", severity: "high" },
                { asset: "web-server-01", issue: "Security Group Drift", severity: "medium" }
              ].map((finding, i) => (
                <div key={i} className="flex items-center justify-between p-2 hover:bg-slate-950 rounded transition-colors group cursor-pointer">
                   <div className="flex items-center gap-3">
                     <Badge variant="outline" className={`
                       text-[10px] uppercase font-black
                       ${finding.severity === 'critical' ? 'text-red-400 border-red-400/30' : 
                         finding.severity === 'high' ? 'text-orange-400 border-orange-400/30' : 'text-amber-400 border-amber-400/30'}
                     `}>
                       {finding.severity}
                     </Badge>
                     <div>
                       <p className="text-xs font-medium text-slate-200">{finding.issue}</p>
                       <p className="text-[10px] text-slate-500">{finding.asset}</p>
                     </div>
                   </div>
                   <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-primary transition-colors" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

      </div>
    </Layout>
  );
}
