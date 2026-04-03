import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { Layout } from "@/components/Layout";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
    Users, TrendingUp, TrendingDown, AlertTriangle, Shield, 
    ArrowUpRight, DollarSign, Activity, Globe, Loader2 
} from "lucide-react";
import { RiskHeatmap } from "@/components/Intelligence/RiskHeatmap";

export default function Vendors() {
    const { data: benchmarks, isLoading: loadingBenchmarks } = useQuery({
        queryKey: [api.vendors.benchmarks.path],
        queryFn: async () => {
            const res = await fetch(api.vendors.benchmarks.path);
            if (!res.ok) throw new Error("Failed to fetch benchmarks");
            return res.json();
        }
    });

    const { data: scorecards, isLoading: loadingScorecards } = useQuery({
        queryKey: [api.vendors.scorecards.list.path],
        queryFn: async () => {
            const res = await fetch(api.vendors.scorecards.list.path);
            if (!res.ok) throw new Error("Failed to fetch scorecards");
            return res.json();
        }
    });

    if (loadingBenchmarks || loadingScorecards) {
        return <Layout><div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></Layout>;
    }

    // Heatmap data mapping from benchmarks
    const heatmapData = benchmarks?.map((b: any) => ({
        name: b.vendor,
        compliance: b.avgCompliance,
        risk: b.riskScore,
        impact: Math.floor(b.avgCost / 1000)
    })) || [];

    return (
        <Layout header={<h1 className="text-2xl font-bold flex items-center gap-2"><Users className="w-6 h-6 text-primary" /> Vendor Governance Hub</h1>}>
            <div className="space-y-8 pb-12">
                
                {/* Strategic Overview Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <RiskHeatmap data={heatmapData} />
                    
                    <Card className="bg-slate-950 border-slate-800 shadow-2xl relative overflow-hidden group">
                        <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2"><Shield className="w-5 h-5 text-primary" /> Governance Intelligence</CardTitle>
                            <CardDescription>AI-driven cross-vendor compliance and cost benchmarking insights.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 relative z-10">
                            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Global Risk Exposure</span>
                                    <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Elevated</Badge>
                                </div>
                                <p className="text-lg font-black text-slate-100 font-mono">42.5 / 100</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800">
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Cost Variance</p>
                                    <div className="flex items-center gap-2">
                                        <TrendingDown className="w-4 h-4 text-emerald-500" />
                                        <span className="text-sm font-bold text-emerald-500">-8.4% YoY</span>
                                    </div>
                                </div>
                                <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800">
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Compliance Drift</p>
                                    <div className="flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4 text-red-500" />
                                        <span className="text-sm font-bold text-red-500">+4.2%</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Vendor Benchmarking Grid */}
                <div>
                    <h2 className="text-xl font-black mb-4 flex items-center gap-2 text-slate-100 uppercase tracking-tighter"><Activity className="w-5 h-5 text-primary" /> Real-time Vendor Benchmarking</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {benchmarks?.map((b: any) => (
                            <Card key={b.vendor} className="bg-slate-950 border-slate-800 hover:border-primary/50 transition-all duration-300 group">
                                <CardHeader className="pb-4">
                                    <div className="flex justify-between items-start">
                                        <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center group-hover:border-primary/30 transition-colors">
                                            <Globe className="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors" />
                                        </div>
                                        <Badge variant={b.avgCompliance > 85 ? "default" : "destructive"} className={b.avgCompliance > 85 ? "bg-emerald-500 text-white" : ""}>
                                            {b.avgCompliance}%
                                        </Badge>
                                    </div>
                                    <CardTitle className="mt-4 text-lg text-slate-100">{b.vendor}</CardTitle>
                                    <CardDescription className="text-[10px] uppercase font-black tracking-widest text-slate-500 mt-1">Enterprise Service Provider</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800">
                                                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Risk Score</p>
                                                <p className={`text-sm font-black font-mono ${b.riskScore > 40 ? 'text-amber-500' : 'text-emerald-500'}`}>{b.riskScore}/100</p>
                                            </div>
                                            <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800">
                                                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Avg Spend</p>
                                                <div className="flex items-center gap-1">
                                                    <DollarSign className="w-3.5 h-3.5 text-slate-500" />
                                                    <p className="text-sm font-black text-slate-100 font-mono">${Math.floor(b.avgCost / 1000)}k</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="pt-4 border-t border-slate-900 flex justify-between items-center text-xs">
                                            <span className="text-slate-500 font-bold uppercase tracking-tighter">Performance Level</span>
                                            <Badge variant="outline" className="bg-slate-900 border-emerald-500/20 text-emerald-500 text-[9px] font-black tracking-widest">OPTIMIZED</Badge>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Historical Ledger Card */}
                <Card className="bg-slate-950 border-slate-800 shadow-2xl">
                    <CardHeader className="border-b border-slate-900 pb-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle className="text-lg">Immutable Governance Ledger</CardTitle>
                                <CardDescription>Traceable history of all vendor assessments and strategic grade shifts.</CardDescription>
                            </div>
                            <Button variant="outline" size="sm" className="h-8 border-slate-800 text-[10px] font-black uppercase tracking-widest">
                                Manage Scores
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-slate-900/50">
                                <TableRow className="border-slate-800 hover:bg-transparent">
                                    <TableHead className="text-[10px] font-black uppercase text-slate-500 py-4">Vendor Entity</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase text-slate-500">Last Assessment</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase text-slate-500">Grade Index</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase text-slate-500">SLA Performance</TableHead>
                                    <TableHead className="text-right text-[10px] font-black uppercase text-slate-500 py-4 pr-6">Posture Trend</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {scorecards?.map((s: any) => (
                                    <TableRow key={s.id} className="border-slate-900 hover:bg-slate-900/30 transition-colors group">
                                        <TableCell className="py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-[10px] font-black text-slate-400">
                                                    {s.vendorName.charAt(0)}
                                                </div>
                                                <span className="text-xs font-black text-slate-100">{s.vendorName}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-xs text-slate-400 font-medium">
                                            {new Date(s.lastAssessmentDate).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={`h-6 w-12 justify-center font-black ${
                                                s.overallGrade === 'A' ? 'bg-emerald-500' :
                                                s.overallGrade === 'B' ? 'bg-cyan-500' : 'bg-red-500'
                                            }`}>
                                                {s.overallGrade}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-xs font-black font-mono text-slate-200">
                                            {s.slaPerformance}%
                                        </TableCell>
                                        <TableCell className="text-right py-4 pr-6">
                                            <div className={`flex items-center justify-end gap-1 text-[11px] font-black uppercase ${
                                                s.riskTrend === 'improving' ? 'text-emerald-500' : 
                                                s.riskTrend === 'worsening' ? 'text-red-500' : 'text-slate-500'
                                            }`}>
                                                {s.riskTrend || 'STABLE'}
                                                <ArrowUpRight className={`w-3.5 h-3.5 ${s.riskTrend === 'worsening' ? 'rotate-0' : s.riskTrend === 'improving' ? 'rotate-90' : 'rotate-45'}`} />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {scorecards?.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="py-20 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <AlertTriangle className="w-8 h-8 text-slate-700" />
                                                <p className="text-xs font-black text-slate-600 uppercase tracking-widest">No Historical Governance Data</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
}
