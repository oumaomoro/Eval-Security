import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { queryClient } from "@/lib/queryClient";
import { Layout } from "@/components/Layout";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
    Activity, ShieldCheck, Zap, AlertCircle, Loader2, Server, 
    Database, Cpu, Globe, RefreshCcw, TrendingUp, DollarSign,
    PieChart, SignalHigh, ShieldAlert, Lock as LockIcon, Fingerprint
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, PieChart as RePieChart, Pie, Cell } from "recharts";
import { useToast } from "@/hooks/use-toast";
import { useDashboardStats } from "@/hooks/use-dashboard";
import { useInfrastructureLogs, useHealInfrastructure, useAdminStats } from "@/hooks/use-infrastructure";
import { useBillingTelemetry } from "@/hooks/use-billing";

export default function SystemHealth() {
    const { toast } = useToast();
    
    const { data: stats, isLoading: loadingStats } = useDashboardStats();
    const { data: infraLogs, isLoading: loadingLogs } = useInfrastructureLogs();
    const { data: adminStats, isLoading: loadingAdmin } = useAdminStats();
    const heal = useHealInfrastructure();

    if (loadingStats || loadingLogs || loadingAdmin) {
        return <Layout><div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></Layout>;
    }

    const technical = stats?.technicalMetrics || { apiResponseTimeAvgMs: 0, aiAccuracyRate: 0, systemUptime: 0 };
    const tier = stats?.subscriptionTier || "starter";
    const limit = tier === 'enterprise' ? 'Unlimited' : tier === 'pro' ? '250' : '20';
    const usage = stats?.contractsCount || 0;
    const usagePercent = limit === 'Unlimited' ? 0 : Math.min((usage / parseInt(limit)) * 100, 100);

    const revenue = adminStats?.revenue || 0;
    const failedWebhooks = adminStats?.failedWebhooks || 0;

    return (
        <Layout header={<h1 className="text-2xl font-bold flex items-center gap-2"><Server className="w-6 h-6 text-primary" /> Global Sovereignty Console</h1>}>
            <div className="space-y-8 pb-12">
                
                {/* High-Fidelity Health Matrix */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <HealthCard label="API Latency" value={`${technical.apiResponseTimeAvgMs}ms`} icon={Zap} trend="-12ms" color="text-cyan-500" />
                    <HealthCard label="Platform MRR" value={`$${revenue.toLocaleString()}`} icon={DollarSign} trend="Live" color="text-emerald-500" />
                    <HealthCard label="Global Uptime" value={`${technical.systemUptime}%`} icon={Globe} trend="Stable" color="text-primary" />
                    <HealthCard label="Failed Hooks" value={failedWebhooks.toString()} icon={SignalHigh} trend={failedWebhooks > 0 ? "Critical" : "Stable"} color={failedWebhooks > 0 ? "text-red-500" : "text-blue-500"} />
                </div>

                {/* Infrastructure & Intelligence Health */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <Card className="lg:col-span-2 bg-slate-950 border-slate-800 shadow-2xl">
                        <CardHeader className="border-b border-slate-900 pb-4">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-lg flex items-center gap-2"><Activity className="w-5 h-5 text-primary" /> Autonomous Operations Ledger</CardTitle>
                                <Button variant="outline" size="sm" className="h-8 border-slate-800 text-xs" onClick={() => queryClient.invalidateQueries({ queryKey: [api.infrastructure.logs.path] })}>
                                    <RefreshCcw className="w-3 h-3 mr-2" /> Sync Grid
                                </Button>
                            </div>
                            <CardDescription>Real-time monitoring and self-healing events across the Cyber-Optimize sovereign grid.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="space-y-4">
                                {infraLogs?.map((log: any) => (
                                    <div key={log.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-primary/30 transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                                log.status === 'healed' ? 'bg-emerald-500/10 text-emerald-500' : 
                                                log.status === 'resolving' ? 'bg-blue-500/10 text-blue-500' : 'bg-amber-500/10 text-amber-500'
                                            }`}>
                                                {log.status === 'healed' ? <ShieldCheck className="w-5 h-5" /> : <Activity className="w-5 h-5 animate-pulse" />}
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-slate-100">{log.event}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge variant="outline" className="text-[10px] uppercase tracking-tighter bg-slate-950 border-slate-800">{log.component}</Badge>
                                                    <span className="text-[10px] text-slate-500 font-mono">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                                </div>
                                                {log.actionTaken && <p className="text-[10px] text-cyan-500 mt-1 italic font-medium">↳ {log.actionTaken}</p>}
                                            </div>
                                        </div>
                                        <div>
                                            {log.status === 'detected' && (
                                                <Button 
                                                    size="sm" 
                                                    className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-[10px] px-4 h-8 rounded-xl"
                                                    onClick={() => heal.mutate(log.id)}
                                                    disabled={heal.isPending}
                                                >
                                                    {heal.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Initiate Healing"}
                                                </Button>
                                            )}
                                            {log.status === 'healed' && <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Secured</Badge>}
                                        </div>
                                    </div>
                                ))}
                                {infraLogs?.length === 0 && <p className="text-center text-slate-500 py-10 italic text-sm">No infrastructure events detected. System health is optimal.</p>}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="space-y-6">
                        <Card className="bg-slate-950 border-slate-800">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2"><Database className="w-5 h-5 text-primary" /> Saturation & Load</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <ResourceMetric label={`Contract Capacity (${tier})`} value={Math.round(usagePercent)} />
                                <ResourceMetric label="Intelligence Inference Load" value={45} />
                                <ResourceMetric label="Vector Memory Index" value={62} />
                                <ResourceMetric label="Database Connection Pool" value={28} />
                            </CardContent>
                        </Card>

                        <Card className="bg-slate-950 border-slate-800">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2"><PieChart className="w-5 h-5 text-primary" /> Resource Allocation</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[180px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RePieChart>
                                            <Pie
                                                data={adminStats?.allocationData || []}
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {adminStats?.allocationData?.map((entry: any, index: number) => (
                                                    <Cell key={`cell-${index}`} fill={index === 0 ? '#06b6d4' : index === 1 ? '#3b82f6' : '#10b981'} />
                                                ))}
                                            </Pie>
                                            <Tooltip 
                                                contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '8px' }}
                                            />
                                        </RePieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="flex justify-center gap-4 mt-2">
                                    {adminStats?.allocationData?.map((entry: any, index: number) => (
                                        <div key={entry.name} className="flex items-center gap-1.5">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: index === 0 ? '#06b6d4' : index === 1 ? '#3b82f6' : '#10b981' }} />
                                            <span className="text-[10px] font-black text-slate-500 uppercase">{entry.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Traffic Intelligence Chart */}
                <Card className="bg-slate-950 border-slate-800">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle className="text-lg flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary" /> Platform Traffic Intelligence</CardTitle>
                                <CardDescription>Global request volume across all enterprise tenants.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={adminStats?.trafficData || []}>
                                    <defs>
                                        <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
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
                                    <Area type="monotone" dataKey="requests" stroke="#3b82f6" fillOpacity={1} fill="url(#colorTraffic)" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Administrative Command Center */}
                <Card className="bg-slate-950 border-slate-800 shadow-2xl relative overflow-hidden group">
                    <div className="absolute -right-20 -top-20 w-64 h-64 bg-red-500/5 rounded-full blur-3xl group-hover:bg-red-500/10 transition-colors" />
                    <CardHeader>
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                              <ShieldAlert className="w-5 h-5 text-red-500" />
                           </div>
                           <div>
                              <CardTitle className="text-lg font-black uppercase italic tracking-tighter">Sovereign Control Panel</CardTitle>
                              <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Privileged Administrative Directives</CardDescription>
                           </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Button 
                                variant="outline" 
                                className="h-16 rounded-2xl bg-slate-950 border-slate-800 hover:bg-primary/10 hover:border-primary/40 group transition-all"
                                onClick={async () => {
                                    const res = await fetch("/api/admin/system/resync", { method: "POST" });
                                    if (res.ok) alert("Global infrastructure re-sync triggered.");
                                }}
                            >
                                <div className="flex items-center gap-4 text-left w-full">
                                    <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center group-hover:rotate-180 transition-transform duration-700">
                                        <Activity className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black uppercase text-slate-200">Force Re-sync</p>
                                        <p className="text-[9px] font-medium text-slate-500 uppercase">Refresh all telemetry nodes</p>
                                    </div>
                                </div>
                            </Button>

                            <Button 
                                variant="outline" 
                                className="h-16 rounded-2xl bg-slate-950 border-slate-800 hover:bg-red-500/10 hover:border-red-500/40 group transition-all"
                                onClick={async () => {
                                    if (confirm("CRITICAL: Are you sure you want to initiate a platform-wide emergency shutdown?")) {
                                        const res = await fetch("/api/admin/system/shutdown", { method: "POST" });
                                        if (res.ok) alert("Shutdown protocol initiated.");
                                    }
                                }}
                            >
                                <div className="flex items-center gap-4 text-left w-full">
                                    <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
                                        <LockIcon className="w-5 h-5 text-red-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black uppercase text-slate-200">Emergency Shutdown</p>
                                        <p className="text-[9px] font-medium text-slate-500 uppercase">Immediate platform isolation</p>
                                    </div>
                                </div>
                            </Button>
                        </div>
                        
                        <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800">
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                                    <Fingerprint className="w-4 h-4 text-slate-500" />
                                </div>
                                <p className="text-[10px] font-medium text-slate-500 leading-relaxed uppercase tracking-wider italic">
                                    "Administrative actions performed via this console are cryptographically signed and logged in the immutable SOC-2 ledger. Unauthorized execution will trigger an automatic security lock of the operator's credentials."
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

            </div>
        </Layout>
    );
}

function HealthCard({ label, value, icon: Icon, trend, color }: any) {
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

function ResourceMetric({ label, value }: { label: string, value: number }) {
    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center text-[10px] font-black font-semibold text-slate-400">
                <span>{label}</span>
                <span className={value > 80 ? "text-red-500" : "text-primary"}>{value}%</span>
            </div>
            <Progress value={value} className="h-1.5" />
        </div>
    );
}
