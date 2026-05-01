import { useQuery } from "@tanstack/react-query";
import { 
  ShieldAlert, 
  TrendingUp, 
  Zap, 
  Database,
  Activity,
  Server,
  DollarSign
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, AreaChart, Area
} from "recharts";
import { Layout } from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { useAdminStats } from "@/hooks/use-infrastructure";

export default function AdminDashboard() {
  const { data: stats, isLoading } = useAdminStats();

  if (isLoading) return <Layout><div className="p-8">Loading Sovereignty Metrics...</div></Layout>;

  return (
    <Layout header={
      <div className="flex justify-between items-center w-full">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Server className="w-6 h-6 text-primary" /> Global Sovereignty Dashboard
          </h1>
          <p className="text-xs text-slate-500">Infrastructure Governance & Financial Telemetry</p>
        </div>
        <div className="flex gap-4">
           <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
             <Activity className="w-3 h-3 animate-pulse" />
             Grid: Operational
           </div>
        </div>
      </div>
    }>
      <div className="space-y-8 pb-12">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Platform MRR" value={`$${stats?.revenue?.toLocaleString() || "0"}`} icon={DollarSign} color="text-emerald-500" trend="+12.4%" />
          <StatCard label="Failed Webhooks" value={stats?.failedWebhooks || 0} icon={ShieldAlert} color="text-red-500" trend="Security" />
          <StatCard label="Token Overages" value={stats?.overages || 0} icon={Zap} color="text-blue-500" trend="Metered" />
          <StatCard label="Compute Status" value="Optimal" icon={Database} color="text-primary" trend="Isolated" />
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-7">
          <Card className="lg:col-span-4 bg-slate-950 border-slate-800 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" /> Traffic Intelligence
              </CardTitle>
              <CardDescription>Global request volume across all enterprise tenants.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats?.trafficData || []}>
                    <defs>
                      <linearGradient id="colorTrafficAdmin" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="name" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '12px' }}
                      labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
                    />
                    <Area type="monotone" dataKey="requests" stroke="#3b82f6" fillOpacity={1} fill="url(#colorTrafficAdmin)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-3 bg-slate-950 border-slate-800 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" /> Resource Allocation
              </CardTitle>
              <CardDescription>Grid utilization by service category.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats?.allocationData || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="name" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '12px' }}
                    />
                    <Bar dataKey="value" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

function StatCard({ label, value, icon: Icon, color, trend }: any) {
  return (
    <Card className="bg-slate-950 border-slate-800 border-l-4 border-l-primary/20">
      <CardContent className="pt-6">
        <div className="flex justify-between items-start">
          <div className={`p-3 rounded-2xl bg-slate-900 border border-slate-800 ${color}`}>
            <Icon className="w-5 h-5" />
          </div>
          {trend && (
            <Badge variant="secondary" className="text-[9px] font-black font-semibold bg-slate-900 text-slate-400 uppercase tracking-tighter">
              {trend}
            </Badge>
          )}
        </div>
        <div className="mt-4">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">{label}</p>
          <h3 className="text-2xl font-black text-slate-100 mt-1 font-mono">{value}</h3>
        </div>
      </CardContent>
    </Card>
  );
}
