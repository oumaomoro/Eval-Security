import { useDashboardStats } from "@/hooks/use-dashboard";
import { Layout } from "@/components/Layout";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
    TrendingUp, DollarSign, Zap, ShieldCheck, 
    PieChart, BarChart3, Globe, Briefcase, 
    ChevronRight, Loader2, ArrowUpRight, Target
} from "lucide-react";
import { useVendorBenchmarks } from "@/hooks/use-dashboard";
import { ResponsiveContainer, PieChart as RePieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { SEO } from "@/components/SEO";

export default function ExecutiveROI() {
    const { data: stats, isLoading } = useDashboardStats();
    const { data: benchmarks, isLoading: isBenchLoading } = useVendorBenchmarks();

    if (isLoading || isBenchLoading) {
        return <Layout><div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></Layout>;
    }

    const roi = stats?.roi_details || {
        total_impact: 0,
        efficiency_savings: 0,
        direct_savings: 0,
        hours_saved: 0,
        mitigated_exposure: 0,
        roi_ratio: 0
    };

    const pieData = [
        { name: 'Efficiency', value: roi.efficiency_savings, color: '#06b6d4' },
        { name: 'Direct Savings', value: roi.direct_savings, color: '#10b981' },
        { name: 'Mitigated Risk', value: roi.mitigated_exposure, color: '#8b5cf6' },
    ];

    return (
        <Layout header={<h1 className="text-2xl font-bold flex items-center gap-2 italic uppercase tracking-tighter"><DollarSign className="w-6 h-6 text-emerald-500" /> Economic Impact Hub</h1>}>
            <SEO title="Executive ROI Dashboard | Costloci" description="Real-time financial impact and legal cost savings analysis." />
            
            <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-2 duration-700">
                
                {/* Hero Financial Summary */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <ImpactCard 
                        label="Total Economic Impact" 
                        value={`$${roi.total_impact.toLocaleString()}`} 
                        icon={TrendingUp} 
                        trend="+12.5%" 
                        description="Cumulative fiscal value realized"
                        color="text-emerald-500"
                    />
                    <ImpactCard 
                        label="Direct Cost Avoidance" 
                        value={`$${roi.direct_savings.toLocaleString()}`} 
                        icon={Target} 
                        trend="Active" 
                        description="Intelligence-identified savings opportunities"
                        color="text-cyan-500"
                    />
                    <ImpactCard 
                        label="Operational Velocity" 
                        value={`${roi.hours_saved}h`} 
                        icon={Zap} 
                        trend="Liberated" 
                        description="Legal hours saved through Intelligence"
                        color="text-amber-500"
                    />
                    <ImpactCard 
                        label="Impact Multiplier" 
                        value={`${roi.roi_ratio}x`} 
                        icon={TrendingUp} 
                        trend="CFO KPI" 
                        description="Value realized vs. platform spend"
                        color="text-purple-500"
                    />
                </div>

                {/* Analysis Breakdown & Benchmarking */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Impact Attribution Chart */}
                    <Card className="lg:col-span-2 bg-slate-950 border-slate-800 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                            <PieChart className="w-40 h-40 text-primary" />
                        </div>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2 font-black uppercase tracking-tight italic">
                                <BarChart3 className="w-5 h-5 text-primary" /> Value Attribution Analysis
                            </CardTitle>
                            <CardDescription>Visualizing how the platform compounds financial impact across legal domains.</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[350px]">
                            <div className="flex flex-col md:flex-row h-full items-center">
                                <div className="w-full md:w-1/2 h-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RePieChart>
                                            <Pie
                                                data={pieData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={80}
                                                outerRadius={120}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {pieData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                                ))}
                                            </Pie>
                                            <Tooltip 
                                                contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '12px' }}
                                                itemStyle={{ fontWeight: 'bold' }}
                                            />
                                        </RePieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="w-full md:w-1/2 space-y-6 px-4">
                                    {pieData.map((item) => (
                                        <div key={item.name} className="space-y-2">
                                            <div className="flex justify-between items-center text-[10px] font-black font-semibold text-slate-400">
                                                <span className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                                    {item.name}
                                                </span>
                                                <span className="text-white font-mono">${item.value.toLocaleString()}</span>
                                            </div>
                                            <Progress value={roi.total_impact > 0 ? (item.value / roi.total_impact) * 100 : 0} className="h-1.5" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Sector Benchmarking */}
                    <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm self-start">
                        <CardHeader>
                            <CardTitle className="text-sm font-black font-semibold flex items-center gap-2">
                                <Globe className="w-4 h-4 text-cyan-400" /> Sector Benchmarking
                            </CardTitle>
                            <CardDescription className="text-[10px] uppercase font-bold">Category: All Vendors (Internal Org)</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {(benchmarks || []).slice(0, 4).map((b: any, i: number) => (
                                <BenchmarkItem 
                                    key={i}
                                    label={`${b.vendor} Risk Score`} 
                                    current={`${b.riskScore}`} 
                                    target={`${b.highestRisk}`} 
                                    status={b.riskScore < 30 ? "ahead" : b.riskScore < 60 ? "tracking" : "optimizing"} 
                                />
                            ))}
                            {(benchmarks || []).length === 0 && (
                                <p className="text-[10px] text-slate-500 font-bold uppercase py-4 text-center">No cross-vendor data identified</p>
                            )}
                            <div className="pt-4 border-t border-slate-800">
                                <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                                    <div className="flex items-start gap-3">
                                        <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
                                        <div>
                                            <p className="text-[10px] font-black text-primary uppercase tracking-tight">Analytics Velocity</p>
                                            <p className="text-[11px] text-slate-400 font-medium leading-relaxed mt-1">
                                                Your legal risk posture is currently **{(stats?.technicalMetrics?.aiAccuracyRate || 0) > 95 ? 'OPTIMIZED' : 'STABILIZING'}** across all jurisdictions.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Economic Strategy Ledger */}
                <Card className="bg-slate-950 border-slate-800 shadow-2xl">
                    <CardHeader className="border-b border-slate-900 pb-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle className="text-lg flex items-center gap-2 font-black uppercase tracking-tight italic">
                                    <Briefcase className="w-5 h-5 text-emerald-500" /> Intelligence Impact Ledger
                                </CardTitle>
                                <CardDescription>Direct correlation between Intelligence redlines and budget preservation.</CardDescription>
                            </div>
                            <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-mono tracking-tighter">
                                Real-time DB Sync Active
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                             <StatItem 
                                label="Risk Mitigation" 
                                value={`$${roi.mitigated_exposure.toLocaleString()}`} 
                                color="text-purple-500" 
                                detail="Financial exposure addressed via mitigated risks."
                            />
                             <StatItem 
                                label="Direct Efficiency" 
                                value={`$${roi.efficiency_savings.toLocaleString()}`} 
                                color="text-cyan-500" 
                                detail="Saved hourly costs through autonomic contract review."
                            />
                             <StatItem 
                                label="Net Savings Identified" 
                                value={`$${roi.direct_savings.toLocaleString()}`} 
                                color="text-emerald-500" 
                                detail="Active billing discrepancies and credit opportunities."
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
}

function ImpactCard({ label, value, icon: Icon, trend, description, color }: any) {
    return (
        <Card className="bg-slate-950 border-slate-800 border-l-4 border-l-primary/30 group hover:border-primary/50 transition-all duration-300">
            <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                    <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
                        <Icon className={`w-5 h-5 ${color}`} />
                    </div>
                    <Badge variant="secondary" className="text-[9px] font-black font-semibold bg-slate-900 text-slate-400 group-hover:text-primary transition-colors">
                        {trend}
                    </Badge>
                </div>
                <div className="mt-4">
                    <p className="text-[10px] font-black text-slate-500 font-semibold">{label}</p>
                    <h3 className="text-3xl font-black text-slate-100 mt-1 font-mono tracking-tighter">{value}</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronRight className="w-3 h-3 inline mr-1" /> {description}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}

function BenchmarkItem({ label, current, target, status }: any) {
    return (
        <div className="flex items-center justify-between group">
            <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight">{label}</p>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-white font-mono">{current}</span>
                    <span className="text-[10px] text-slate-600 font-bold">/ {target}</span>
                </div>
            </div>
            <div className={`w-2 h-2 rounded-full ${
                status === 'ahead' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 
                status === 'tracking' ? 'bg-blue-500 shadow-[0_0_8px_#3b82f6]' : 'bg-amber-500'
            }`} />
        </div>
    );
}

function StatItem({ label, value, color, detail }: any) {
    return (
        <div className="p-6 rounded-2xl bg-slate-900/30 border border-slate-900 hover:border-slate-800 transition-all">
            <h4 className="text-[10px] font-black text-slate-500 font-semibold mb-1">{label}</h4>
            <div className={`text-2xl font-black font-mono tracking-tighter ${color}`}>{value}</div>
            <p className="text-[10px] text-slate-500 font-bold uppercase mt-3 leading-relaxed">{detail}</p>
        </div>
    );
}
