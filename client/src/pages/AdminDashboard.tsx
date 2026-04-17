import { useQuery } from "@tanstack/react-query";
import { 
  LayoutDashboard, 
  ShieldAlert, 
  TrendingUp, 
  Zap, 
  Database,
  Activity
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from "recharts";

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery<any>({
    queryKey: ["/api/admin/stats"],
  });

  if (isLoading) return <div className="p-8">Loading Sovereignty Metrics...</div>;

  return (
    <div className="p-8 space-y-8 bg-slate-950 min-h-screen text-slate-100">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sovereignty Console</h1>
          <p className="text-slate-400">Governance & Infrastructure Monitoring (Costloci Enterprise)</p>
        </div>
        <div className="flex gap-4">
           <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg flex items-center gap-2">
             <Activity className="w-4 h-4" />
             Nodes: Operational
           </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Global Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats?.revenue?.toLocaleString() || "0"}</div>
            <p className="text-xs text-slate-500">+12% from last node sync</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Webhooks</CardTitle>
            <ShieldAlert className="h-4 w-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.failedWebhooks || 0}</div>
            <p className="text-xs text-amber-500/70">Potential revenue leakage</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Token Overages</CardTitle>
            <Zap className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.overages || 0}</div>
            <p className="text-xs text-blue-500/70">Metered billing active</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Compute Load</CardTitle>
            <Database className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Safe</div>
            <p className="text-xs text-slate-500">Regional isolation active</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle>Global Traffic & Compliance Pulses</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={stats?.trafficData || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }}
                  itemStyle={{ color: '#3b82f6' }}
                />
                <Line type="monotone" dataKey="requests" stroke="#3b82f6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-3 bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle>Resource Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={stats?.allocationData || []}>
                 <XAxis dataKey="name" stroke="#64748b" />
                 <YAxis stroke="#64748b" />
                 <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }}
                />
                 <Bar dataKey="value" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
