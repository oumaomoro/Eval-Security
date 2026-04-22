import { Layout } from "@/components/Layout";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { BarChart3, Globe, Shield, Activity, ArrowUpRight, ArrowDownRight, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SEO } from "@/components/SEO";
import { Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as ReTooltip, CartesianGrid, Cell } from "recharts";

export default function Benchmarking() {
  const { data: benchmarks, isLoading } = useQuery<any[]>({
    queryKey: ["/api/benchmarking"],
  });

  if (isLoading) return <Layout><div className="text-center py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></Layout>;

  return (
    <Layout header={
      <div className="flex w-full items-center justify-between">
         <h1 className="text-2xl font-black tracking-tight text-white uppercase italic">Cost Optimization Center</h1>
         <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-emerald-500/10 border-emerald-500/20 text-emerald-400">
                LIVE MARKET INTELLIGENCE
            </Badge>
         </div>
      </div>
    }>
      <SEO title="Market Benchmarking" description="Compare your vendor pricing against localized market averages." />

      <div className="space-y-8 pb-12 pt-4">
        {/* Info Header */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-white/5 rounded-[2rem] p-8 relative overflow-hidden group shadow-2xl">
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
             <div className="w-20 h-20 rounded-3xl bg-slate-950 flex items-center justify-center border border-white/10 shadow-2xl group-hover:scale-110 transition-transform duration-500">
                <BarChart3 className="w-10 h-10 text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
             </div>
             <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl font-black text-white italic tracking-tight mb-2 uppercase">Autonomous Pricing Intelligence</h2>
                <p className="text-slate-400 max-w-2xl text-sm font-medium leading-relaxed">
                   Leveraging AI-driven market research and regional contract telemetry to provide high-fidelity pricing benchmarks. 
                   Continuous, real-time ingestion ensures spend is optimized for the local landscape.
                </p>
             </div>
             <div className="flex items-center gap-6 divide-x divide-white/5 pl-4 overflow-hidden">
                <BenchmarkKPI label="Data Points" value="8.4k" />
                <BenchmarkKPI label="Conf. Score" value="98%" />
             </div>
          </div>
        </div>

        {/* Comparison Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-3xl p-8 shadow-2xl">
            <h3 className="text-xs font-black tracking-[0.2em] uppercase text-slate-500 mb-8 flex items-center gap-2 italic">
               <Activity className="w-4 h-4 text-emerald-400" /> Annual Market Averages (USD)
            </h3>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={benchmarks || []} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                  <XAxis type="number" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v/1000}k`} />
                  <YAxis dataKey="serviceType" type="category" stroke="#94a3b8" fontSize={10} width={150} tickLine={false} axisLine={false} />
                  <ReTooltip 
                    contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", borderRadius: "12px" }}
                    itemStyle={{ color: "#f8fafc" }}
                  />
                  <Bar dataKey="marketAverageAnnual" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20}>
                    {(benchmarks || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#10b981" : "#059669"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-3xl p-8 shadow-2xl flex flex-col justify-center">
             <Shield className="w-12 h-12 text-blue-400 mb-6 mx-auto drop-shadow-[0_0_10px_rgba(59,130,246,0.3)]" />
             <h3 className="text-xl font-black text-white text-center italic mb-4 uppercase">Regional Accuracy</h3>
             <p className="text-slate-500 text-xs text-center leading-relaxed font-medium">
                Our benchmarking engine is specifically tuned for the unique tax, infrastructure, and compliance requirements 
                of East African jurisdictions (KDPA, POPIA, CBK).
             </p>
             <div className="mt-8 space-y-3">
                <StatusItem label="Data Freshness" value="Last 30 Days" />
                <StatusItem label="Sample Clusters" value="Nairobi, Dar, Addis" />
                <StatusItem label="Peer Group" value="Mid-Enterprise" />
             </div>
          </div>
        </div>

        {/* Detailed Table */}
        <div className="bg-slate-900/30 border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl">
          <Table>
            <TableHeader className="bg-slate-900/60 h-16 border-b border-white/5">
              <TableRow className="hover:bg-transparent px-6 border-none">
                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 pl-8">Service Type</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Industry Category</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Market Avg (Annual)</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Regional Data Pool</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 pr-8 text-right">Trend</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(benchmarks || []).map((b) => (
                <TableRow key={b.id} className="border-b border-white/5 hover:bg-white/5 transition-colors h-16">
                  <TableCell className="font-bold text-slate-200 pl-8 italic">{b.serviceType}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[9px] uppercase tracking-tighter bg-slate-900 border-white/10 text-slate-500">
                      {b.serviceCategory.replace(/_/g, ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-black text-white italic">${b.marketAverageAnnual.toLocaleString()}</TableCell>
                  <TableCell className="text-xs text-slate-500 font-bold">{b.sampleSize} Local Vendors</TableCell>
                  <TableCell className="pr-8 text-right">
                    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
                       <ArrowDownRight className="w-3 h-3" /> 2.4%
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </Layout>
  );
}

function BenchmarkKPI({ label, value }: any) {
  return (
    <div className="px-6">
       <p className="text-[9px] font-black text-slate-600 font-semibold mb-1">{label}</p>
       <p className="text-xl font-black text-white italic leading-none truncate">{value}</p>
    </div>
  );
}

function StatusItem({ label, value }: any) {
  return (
    <div className="flex items-center justify-between text-[10px] bg-white/5 p-3 rounded-xl border border-white/5">
       <span className="font-black font-semibold text-slate-500 italic">{label}</span>
       <span className="font-bold text-slate-300">{value}</span>
    </div>
  );
}
