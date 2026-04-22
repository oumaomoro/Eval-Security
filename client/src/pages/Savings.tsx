import { Layout } from "@/components/Layout";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { DollarSign, TrendingDown, Target, Zap, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import { Loader2 } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export default function Savings() {
  const { data: savings, isLoading } = useQuery<any[]>({
    queryKey: ["/api/savings"],
  });

  if (isLoading) return <Layout><div className="text-center py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></Layout>;

  const totalIdentified = (savings || []).reduce((sum, s) => sum + (s.estimatedSavings || 0), 0);
  const totalRealized = 0; // In a future phase we would track realization

  return (
    <Layout header={
      <div className="flex w-full items-center justify-between">
         <h1 className="text-2xl font-black tracking-tight text-white uppercase italic">Cost Optimization Center</h1>
         <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-emerald-500/10 border-emerald-500/20 text-emerald-400">
                INDUSTRIAL GRADE 4.0
            </Badge>
         </div>
      </div>
    }>
      <SEO title="Cost Optimization" description="Review identified savings and ROI opportunities." />

      <div className="space-y-8 pb-12 pt-4">
        {/* KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard 
            label="Identified Savings" 
            value={`$${totalIdentified.toLocaleString()}`} 
            icon={DollarSign} 
            color="text-emerald-400" 
            description="Potential annual cost reduction"
          />
          <MetricCard 
            label="ROI Multiplier" 
            value="12.4x" 
            icon={TrendingDown} 
            color="text-blue-400" 
            description="Projected return on license spend"
          />
          <MetricCard 
            label="Active Opportunities" 
            value={(savings || []).length} 
            icon={Zap} 
            color="text-amber-400" 
            description="Strategies ready for implementation"
          />
        </div>

        {/* Savings Over Time Simulation */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -z-10" />
          <h3 className="text-sm font-black tracking-[0.2em] uppercase text-slate-500 mb-8 flex items-center gap-3 italic">
            <Target className="w-4 h-4 text-emerald-400" /> Projected Savings Trajectory
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={simulationData}>
                <defs>
                  <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="month" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v/1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", borderRadius: "12px" }}
                  itemStyle={{ color: "#f8fafc" }}
                />
                <Area type="monotone" dataKey="savings" stroke="#10b981" fillOpacity={1} fill="url(#colorSavings)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Opportunity List */}
        <div className="grid grid-cols-1 gap-6">
           <h2 className="text-lg font-black tracking-tight text-white uppercase italic border-l-4 border-emerald-500 pl-4">
              Identified Savings Opportunities
           </h2>
           {(savings || []).length === 0 ? (
             <Card className="bg-slate-900/40 border-slate-800 rounded-2xl p-12 text-center text-slate-500 italic">
                No cost optimization opportunities detected yet. Try running a portfolio benchmark.
             </Card>
           ) : (
             <div className="space-y-4">
                {(savings || []).map((opp: any) => (
                  <motion.div
                    key={opp.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-slate-950/50 border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between hover:border-emerald-500/30 transition-all group"
                  >
                    <div className="flex-1">
                       <div className="flex items-center gap-3 mb-2">
                          <Badge className="bg-slate-900 text-[10px] font-black uppercase text-emerald-400 border-white/10 italic">
                             {opp.type.replace(/_/g, ' ')}
                          </Badge>
                          <span className="text-xs text-slate-500 font-bold">Contract #{opp.contractId}</span>
                       </div>
                       <h4 className="text-lg font-bold text-slate-200 mb-1 group-hover:text-emerald-400 transition-colors tracking-tight italic">
                          {opp.description}
                       </h4>
                    </div>
                    <div className="flex items-center gap-6 mt-4 md:mt-0 w-full md:w-auto border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
                       <div className="text-right">
                          <p className="text-[10px] font-semibold text-slate-500 mb-1">Est. Annual Savings</p>
                          <p className="text-2xl font-black text-emerald-400 italic">${(opp.estimatedSavings || 0).toLocaleString()}</p>
                       </div>
                       <Button variant="outline" size="sm" className="bg-slate-900/50 border-white/10 hover:bg-emerald-500/10 hover:text-emerald-400 transition-all rounded-xl">
                          Review <ArrowRight className="w-4 h-4 ml-2" />
                       </Button>
                    </div>
                  </motion.div>
                ))}
             </div>
           )}
        </div>
      </div>
    </Layout>
  );
}

function MetricCard({ label, value, icon: Icon, color, description }: any) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="bg-slate-900/40 backdrop-blur-xl border border-white/5 p-6 rounded-3xl shadow-2xl relative overflow-hidden group"
    >
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/5 rounded-full blur-3xl group-hover:bg-primary/5 transition-colors" />
      <div className="flex justify-between items-start relative z-10 mb-4">
        <div className={`p-3 rounded-2xl bg-slate-950 border border-white/10 shadow-inner group-hover:bg-slate-900 transition-colors ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <Badge variant="outline" className="border-white/5 text-slate-500 bg-white/5 text-[9px] font-bold">LIVE METRIC</Badge>
      </div>
      <div className="relative z-10">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">{label}</p>
        <h3 className="text-3xl font-black tracking-tighter text-white italic mb-2">
          {value}
        </h3>
        <p className="text-xs text-slate-400 font-medium">{description}</p>
      </div>
    </motion.div>
  );
}

const simulationData = [
  { month: "Jan", savings: 1200 },
  { month: "Feb", savings: 4500 },
  { month: "Mar", savings: 3200 },
  { month: "Apr", savings: 8700 },
  { month: "May", savings: 15400 },
  { month: "Jun", savings: 19800 },
  { month: "Jul", savings: 24500 },
];
