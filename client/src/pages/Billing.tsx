import { Layout } from "@/components/Layout";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CreditCard, Zap, BarChart, History, CheckCircle2, AlertCircle, TrendingUp, DollarSign } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

export default function Billing() {
  const { data: telemetry, isLoading } = useQuery<any[]>({
    queryKey: ["/api/billing/telemetry"],
  });

  const totalSpend = telemetry?.reduce((sum, item) => sum + (item.cost || 0), 0) || 0;
  const apiUsage = telemetry?.filter(t => t.metricType === "api_usage").reduce((sum, t) => sum + t.value, 0) || 0;
  const storageUsage = telemetry?.filter(t => t.metricType === "storage_usage").reduce((sum, t) => sum + t.value, 0) || 0;

  const usageLimit = 1000; // Mock limit

  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">Enterprise Billing Hub</h1>
          <p className="text-slate-500 font-bold uppercase tracking-tight">Usage Telemetry & Subscription Lifecycle Management</p>
        </div>

        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-slate-900 border-slate-800 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <DollarSign className="w-16 h-16 text-primary" />
                </div>
                <CardHeader className="pb-2">
                    <CardTitle className="text-[10px] font-black text-slate-500 uppercase tracking-widest">MTD Consumption</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-black text-white tracking-tighter italic">${totalSpend.toFixed(2)}</div>
                    <div className="flex items-center gap-1.5 mt-1">
                        <TrendingUp className="w-3 h-3 text-emerald-500" />
                        <span className="text-[10px] text-emerald-500 font-black uppercase">Accurate telemetry</span>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800 shadow-2xl">
                <CardHeader className="pb-2">
                    <CardTitle className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Plan</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-black text-primary tracking-tighter uppercase italic flex items-center gap-2">
                        Enterprise <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-tight">Renewal: Oct 2026</p>
                </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800 shadow-2xl">
                <CardHeader className="pb-2">
                    <CardTitle className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Governed Identities</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-black text-white tracking-tighter italic">24 / 50</div>
                    <Progress value={48} className="h-1.5 mt-2 bg-slate-800" />
                </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800 shadow-2xl relative overflow-hidden group">
                <CardHeader className="pb-2">
                    <CardTitle className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Storage Allocation</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-black text-white tracking-tighter italic">{storageUsage.toFixed(1)} GB</div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-tight">Of 10 TB Enterprise Quota</p>
                </CardContent>
            </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Billing Table */}
            <div className="lg:col-span-2 space-y-6">
                <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-md shadow-2xl rounded-2xl overflow-hidden">
                    <CardHeader className="border-b border-slate-800">
                        <CardTitle className="text-white uppercase tracking-tighter italic">Usage Telemetry Stream</CardTitle>
                        <CardDescription className="text-slate-500 font-medium uppercase text-[10px]">Real-time consumption analytics from global gateways</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-800/50 bg-slate-950/20">
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Resource Metric</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Magnitude</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Unit Cost</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Timestamp</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    [...Array(5)].map((_, i) => (
                                        <tr key={i} className="animate-pulse border-b border-slate-800/30">
                                            <td colSpan={4} className="px-6 py-4 h-12 bg-slate-800/10" />
                                        </tr>
                                    ))
                                ) : telemetry?.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-slate-500 font-bold uppercase text-xs">No telemetry detected for current billing cycle.</td>
                                    </tr>
                                ) : telemetry?.map((item, i) => (
                                    <tr key={item.id} className="border-b border-slate-800/30 hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Zap className="w-3 h-3 text-primary" />
                                                <span className="text-[11px] font-black text-slate-200 uppercase">{item.metricType.replace('_', ' ')}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-[11px] font-medium text-slate-400 uppercase tracking-tighter">{item.value.toLocaleString()} Units</td>
                                        <td className="px-6 py-4 text-[11px] font-black text-slate-100 italic">${item.cost.toFixed(4)}</td>
                                        <td className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                                            {format(new Date(item.timestamp), "MMM dd, HH:mm:ss")}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            </div>

            {/* Sidebar Cards */}
            <div className="space-y-6">
                <Card className="bg-slate-900 border-slate-800 shadow-2xl rounded-2xl overflow-hidden border-l-4 border-l-primary">
                    <CardHeader>
                        <CardTitle className="text-white uppercase tracking-tighter italic text-xl">Primary Checkout</CardTitle>
                        <CardDescription className="text-slate-500 font-bold uppercase text-[10px]">Managed Enterprise Payment Gateway</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-xl bg-black/40 border border-slate-800">
                           <div className="flex items-center gap-3">
                               <CreditCard className="w-5 h-5 text-slate-500" />
                                <div className="flex flex-col">
                                    <span className="text-[11px] font-black text-slate-200 uppercase tracking-tight italic">AMEX •••• 9102</span>
                                    <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-0.5 italic">EXPIRES 12 / 29</span>
                                </div>
                           </div>
                           <Button variant="ghost" size="sm" className="text-[10px] text-primary uppercase font-black italic hover:bg-primary/10">Modify</Button>
                        </div>
                        <Button className="w-full bg-slate-100 hover:bg-white text-black font-black uppercase tracking-tighter italic h-12 rounded-xl group">
                            Generate Master Invoice
                        </Button>
                    </CardContent>
                    <CardFooter className="bg-slate-950/40 p-4 border-t border-slate-800">
                        <p className="text-[8px] text-slate-600 font-black uppercase tracking-widest italic flex items-center gap-2">
                           <History className="w-3 h-3" /> PCI DSS COMPLIANCE GUARANTEED
                        </p>
                    </CardFooter>
                </Card>

                <Card className="bg-slate-900 border-slate-800 shadow-2xl rounded-2xl overflow-hidden">
                    <CardHeader className="bg-slate-950/20">
                        <CardTitle className="text-slate-200 uppercase tracking-tighter text-sm italic">Consumption Warnings</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 flex gap-3">
                            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                            <div className="flex flex-col gap-1">
                                <p className="text-[10px] font-black text-amber-500 uppercase tracking-tight">AI Token Efficiency Declining</p>
                                <p className="text-[10px] text-slate-500 font-medium leading-relaxed uppercase">Current OpenAI model consumption is 12% higher than governance threshold.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
      </div>
    </Layout>
  );
}
