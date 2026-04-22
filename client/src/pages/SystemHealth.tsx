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
    Database, Cpu, Globe, RefreshCcw, TrendingUp, DollarSign 
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { useToast } from "@/hooks/use-toast";
import { useDashboardStats } from "@/hooks/use-dashboard";
import { useInfrastructureLogs, useHealInfrastructure } from "@/hooks/use-infrastructure";
import { useBillingTelemetry } from "@/hooks/use-billing";

export default function SystemHealth() {
    const { toast } = useToast();
    
    const { data: stats, isLoading: loadingStats } = useDashboardStats();
    const { data: infraLogs, isLoading: loadingLogs } = useInfrastructureLogs();
    const { data: billing, isLoading: loadingBilling } = useBillingTelemetry();
    const heal = useHealInfrastructure();

    if (loadingStats || loadingLogs || loadingBilling) {
        return <Layout><div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></Layout>;
    }

    const technical = stats?.technicalMetrics || { apiResponseTimeAvgMs: 0, aiAccuracyRate: 0, systemUptime: 0 };
    const tier = stats?.subscriptionTier || "starter";
    const limit = tier === 'enterprise' ? 'Unlimited' : tier === 'pro' ? '250' : '20';
    const usage = stats?.contractsCount || 0;
    const usagePercent = limit === 'Unlimited' ? 0 : Math.min((usage / parseInt(limit)) * 100, 100);

    return (
        <Layout header={<h1 className="text-2xl font-bold flex items-center gap-2"><Server className="w-6 h-6 text-primary" /> Global Infrastructure Console</h1>}>
            <div className="space-y-8 pb-12">
                
                {/* Real-time Health Matrix */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <HealthCard label="API Latency" value={`${technical.apiResponseTimeAvgMs}ms`} icon={Zap} trend="-12ms" color="text-cyan-500" />
                    <HealthCard label="AI Precision" value={`${technical.aiAccuracyRate}%`} icon={Cpu} trend="+0.2%" color="text-purple-500" />
                    <HealthCard label="Global Uptime" value={`${technical.systemUptime}%`} icon={Globe} trend="Stable" color="text-emerald-500" />
                    <HealthCard label="Error Rate" value={`${stats?.technicalMetrics?.errorRate || 0.1}%`} icon={AlertCircle} trend="Low" color="text-blue-500" />
                </div>

                {/* Infrastructure & Remediation */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <Card className="lg:col-span-2 bg-slate-950 border-slate-800 shadow-2xl">
                        <CardHeader className="border-b border-slate-900 pb-4">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-lg flex items-center gap-2"><Activity className="w-5 h-5 text-primary" /> Autonomous Operations Ledger</CardTitle>
                                <Button variant="outline" size="sm" className="h-8 border-slate-800 text-xs" onClick={() => queryClient.invalidateQueries({ queryKey: [api.infrastructure.logs.path] })}>
                                    <RefreshCcw className="w-3 h-3 mr-2" /> Sync
                                </Button>
                            </div>
                            <CardDescription>Real-time monitoring and self-healing events across the Costloci grid.</CardDescription>
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
                                <CardTitle className="text-lg flex items-center gap-2"><Database className="w-5 h-5 text-primary" /> Resource & Plan Saturation</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <ResourceMetric label={`Contract Capacity (${tier})`} value={Math.round(usagePercent)} />
                                <ResourceMetric label="CPU Usage (Vector Engine)" value={45} />
                                <ResourceMetric label="Memory Consumption" value={62} />
                                <ResourceMetric label="Database Connection Pool" value={28} />
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center font-black text-primary">ROI</div>
                                    <div>
                                        <h4 className="text-sm font-black uppercase tracking-tighter text-slate-100">AI Efficiency Factor</h4>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">Performance Intelligence</p>
                                    </div>
                                </div>
                                <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[10px] font-black text-slate-500 uppercase">Cost per Intelligence Run</span>
                                        <span className="text-lg font-black text-emerald-500 font-mono">$0.42</span>
                                    </div>
                                    <Progress value={85} className="h-1.5 mt-3" />
                                    <p className="text-[9px] text-slate-500 font-bold font-semibold mt-3">Target Efficiency: 95%</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Billing & Telemetry Heatmap Section */}
                <Card className="bg-slate-950 border-slate-800">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle className="text-lg flex items-center gap-2"><DollarSign className="w-5 h-5 text-emerald-500" /> Usage Telemetry & Operational Costs</CardTitle>
                                <CardDescription>Correlating platform intelligence usage with financial overhead in real-time.</CardDescription>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-cyan-500" /><span className="text-[10px] font-black text-slate-400 uppercase">Usage</span></div>
                                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500" /><span className="text-[10px] font-black text-slate-400 uppercase">Cost</span></div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={billing?.slice(0, 15).reverse().map((b: any) => ({ 
                                    time: new Date(b.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 
                                    usage: b.value, 
                                    cost: b.cost 
                                })) || []}>
                                    <defs>
                                        <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                    <XAxis dataKey="time" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '12px' }}
                                        labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
                                    />
                                    <Area type="monotone" dataKey="usage" stroke="#06b6d4" fillOpacity={1} fill="url(#colorUsage)" strokeWidth={2} />
                                    <Area type="monotone" dataKey="cost" stroke="#10b981" fillOpacity={1} fill="url(#colorCost)" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
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
                        <Badge variant="secondary" className="text-[9px] font-black font-semibold bg-slate-900 text-slate-400">
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
