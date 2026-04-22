import { Layout } from "@/components/Layout";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { useVendorScorecards, useVendorBenchmarks } from "@/hooks/use-vendors";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
    Users, TrendingUp, TrendingDown, AlertTriangle, Shield, 
    ArrowUpRight, DollarSign, Activity, Globe, Loader2 
} from "lucide-react";
import { RiskHeatmap } from "@/components/Intelligence/RiskHeatmap";
import { motion } from "framer-motion";
import { SEO } from "@/components/SEO";

export default function Vendors() {
    const { data: benchmarks, isLoading: loadingBenchmarks } = useVendorBenchmarks();
    const { data: scorecards, isLoading: loadingScorecards } = useVendorScorecards();


    if (loadingBenchmarks || loadingScorecards) {
        return <Layout><div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></Layout>;
    }

    // Heatmap data mapping from benchmarks
    const heatmapData = benchmarks?.map((b: any) => ({
        name: b.vendor,
        compliance: b.avgCompliance,
        risk: b.highestRisk,
        impact: Math.min(Math.floor((b.totalCost || 0) / 5000), 100)
    })) || [];

    return (
        <Layout header={
            <div className="flex w-full items-center justify-between">
                <SEO title="Vendor Governance Hub" description="Analyze and benchmark vendor compliance and cost ROI in real-time." />
                <h1 className="text-2xl font-black uppercase tracking-tighter italic drop-shadow-sm flex items-center gap-2">
                    <Users className="w-6 h-6 text-primary" /> Vendor Governance Hub
                </h1>
                <Badge variant="outline" className="bg-slate-900/50 backdrop-blur-md border-primary/20 text-primary py-1 px-3 flex gap-2 items-center text-[10px] font-black font-semibold">
                    <Activity className="w-3 h-3 animate-pulse" /> Real-time Analytics Active
                </Badge>
            </div>
        }>
            <div className="space-y-8 pb-12">
                
                {/* Strategic Overview Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-slate-900/20 backdrop-blur-md rounded-[2.5rem] border border-slate-800/50 p-2 overflow-hidden shadow-2xl">
                        <RiskHeatmap data={heatmapData} />
                    </div>
                    
                    <Card className="bg-slate-950/40 backdrop-blur-xl border-slate-800/60 shadow-3xl relative overflow-hidden group rounded-[2.5rem]">
                        <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
                        <CardHeader>
                            <CardTitle className="text-lg font-black font-semibold flex items-center gap-2 text-slate-100"><Shield className="w-5 h-5 text-primary" /> Governance Intelligence</CardTitle>
                            <CardDescription className="text-xs font-medium text-slate-500 italic">AI-driven cross-vendor compliance and cost benchmarking insights.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 relative z-10">
                            <div className="p-6 rounded-[2rem] bg-slate-900/80 border border-slate-800 shadow-inner group-hover:border-primary/20 transition-all">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[10px] font-black text-slate-500 font-semibold">Global Risk Exposure</span>
                                    <Badge className="bg-red-500/10 text-red-500 border-red-500/20 text-[10px] font-black uppercase tracking-tighter">Elevated Risk</Badge>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <p className="text-4xl font-black text-slate-100 font-mono tracking-tighter">42.5</p>
                                    <span className="text-xs font-bold text-slate-500 italic">/ 100 Risk Index</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-5 rounded-[2rem] bg-slate-900/40 border border-slate-800/50 group-hover:bg-slate-900/60 transition-all">
                                    <p className="text-[9px] font-black text-slate-500 font-semibold mb-1">Cost Variance</p>
                                    <div className="flex items-center gap-2">
                                        <TrendingDown className="w-4 h-4 text-emerald-500" />
                                        <span className="text-base font-black text-emerald-500 tracking-tighter">-8.4% YoY</span>
                                    </div>
                                </div>
                                <div className="p-5 rounded-[2rem] bg-slate-900/40 border border-slate-800/50 group-hover:bg-slate-900/60 transition-all">
                                    <p className="text-[9px] font-black text-slate-500 font-semibold mb-1">Compliance Drift</p>
                                    <div className="flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4 text-red-500" />
                                        <span className="text-base font-black text-red-500 tracking-tighter">+4.2%</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Vendor Benchmarking Grid */}
                <div>
                    <h2 className="text-2xl font-black mb-6 flex items-center gap-2 text-slate-100 uppercase tracking-tighter">
                        <Activity className="w-6 h-6 text-primary" /> Active Vendor Matrix
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {benchmarks?.map((b: any) => (
                            <motion.div key={b.vendor} whileHover={{ y: -8, scale: 1.02 }} className="h-full">
                                <Card className="bg-slate-950/60 backdrop-blur-xl border-slate-800 hover:border-primary/50 transition-all duration-300 group rounded-[2.5rem] overflow-hidden h-full shadow-2xl">
                                    <CardHeader className="pb-4">
                                        <div className="flex justify-between items-start">
                                            <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center group-hover:border-primary/30 transition-colors shadow-inner relative">
                                                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                                                <Globe className="w-7 h-7 text-slate-400 group-hover:text-primary transition-colors relative z-10" />
                                            </div>
                                            <div className="text-right">
                                                <Badge variant={b.avgCompliance > 85 ? "default" : "destructive"} className={b.avgCompliance > 85 ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-black text-[10px]" : "font-black text-[10px]"}>
                                                    {b.avgCompliance}% Health
                                                </Badge>
                                                <p className="text-[9px] font-black text-slate-600 font-semibold mt-1">SLA Compliance</p>
                                            </div>
                                        </div>
                                        <CardTitle className="text-xl font-black mt-6 text-slate-100 tracking-tight leading-none">{b.vendor}</CardTitle>
                                        <CardDescription className="text-xs font-semibold text-slate-500 italic mt-2 uppercase tracking-tighter">Managed Enterprise Asset</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center text-[9px] font-black font-semibold">
                                                <span>Risk Rating</span>
                                                <span className={b.highestRisk > 40 ? 'text-amber-500' : 'text-emerald-500'}>{b.highestRisk}/100</span>
                                            </div>
                                            <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden shadow-inner">
                                                <motion.div 
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${b.avgCompliance}%` }}
                                                    className={`h-full ${b.avgCompliance > 85 ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-amber-500 to-red-500'}`}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center bg-slate-900/60 p-4 rounded-2xl border border-slate-800/40 shadow-inner group-hover:bg-slate-900/80 transition-all">
                                            <div className="flex items-center gap-2 text-slate-500">
                                                <DollarSign className="w-5 h-5 text-primary/70" />
                                                <span className="text-[10px] font-black font-semibold">Annual Spend</span>
                                            </div>
                                            <span className="text-base font-black text-white font-mono tracking-tighter">${(b.totalCost || 0).toLocaleString()}</span>
                                        </div>
                                    </CardContent>
                                    <div className="px-6 pb-6">
                                        <Button variant="outline" className="w-full bg-slate-900/50 border-slate-800 hover:bg-primary hover:text-black hover:border-primary text-[10px] font-black font-semibold rounded-2xl h-12 transition-all">
                                            Execute Performance Audit
                                        </Button>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Historical Ledger Card */}
                <Card className="bg-slate-950/40 backdrop-blur-md border-slate-800 shadow-3xl rounded-[2.5rem] overflow-hidden">
                    <CardHeader className="border-b border-slate-900 pb-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle className="text-lg">Immutable Governance Ledger</CardTitle>
                                <CardDescription>Traceable history of all vendor assessments and strategic grade shifts.</CardDescription>
                            </div>
                            <Button variant="outline" size="sm" className="h-8 border-slate-800 text-[10px] font-black font-semibold">
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
                                                <p className="text-xs font-black text-slate-600 font-semibold">No Historical Governance Data</p>
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
