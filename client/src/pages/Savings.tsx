import { Layout } from "@/components/Layout";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  DollarSign, 
  TrendingDown, 
  Target, 
  Zap, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  Activity,
  Cpu,
  BarChart3,
  Layers,
  ArrowUpRight,
  Sparkles
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import { Loader2 } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export default function Savings() {
  const { data: savings, isLoading } = useQuery<any[]>({
    queryKey: ["/api/savings"],
  });

  if (isLoading) return (
    <Layout>
      <div className="flex flex-col items-center justify-center py-40 space-y-6">
        <div className="relative w-20 h-20">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full border-t-2 border-emerald-500/30"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <DollarSign className="w-8 h-8 text-emerald-500 animate-pulse" />
          </div>
        </div>
        <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em]">Calculating optimization potential...</p>
      </div>
    </Layout>
  );

  const totalIdentified = (savings || []).reduce((sum, s) => sum + (s.estimatedSavings || 0), 0);

  return (
    <Layout header={
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 w-full">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-emerald-500" /> Optimization <span className="text-emerald-500">Center</span>
          </h1>
          <p className="text-[10px] font-bold text-slate-500 mt-2 uppercase tracking-[0.2em]">Autonomous Cost Optimization & Strategic Savings Pipeline</p>
        </div>
        <div className="flex items-center gap-4">
           <Badge variant="outline" className="bg-emerald-500/5 border-emerald-500/20 text-emerald-400 text-[10px] font-black py-2 px-4 rounded-xl uppercase tracking-widest">
              SOVEREIGN MODE ACTIVE
           </Badge>
        </div>
      </div>
    }>
      <SEO title="Cost Optimization" description="Review identified savings and ROI opportunities." />

      <div className="space-y-10 pb-12 pt-4">
        {/* Metric Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <MetricCard 
            label="Identified Savings" 
            value={`$${totalIdentified.toLocaleString()}`} 
            icon={DollarSign} 
            color="text-emerald-400" 
            accent="bg-emerald-500/10"
            description="Potential annual cost reduction"
          />
          <MetricCard 
            label="ROI Multiplier" 
            value="12.4x" 
            icon={BarChart3} 
            color="text-blue-400" 
            accent="bg-blue-500/10"
            description="Projected return on platform spend"
          />
          <MetricCard 
            label="Optimization Vectors" 
            value={(savings || []).length} 
            icon={Cpu} 
            color="text-amber-400" 
            accent="bg-amber-500/10"
            description="Active intelligence strategies"
          />
        </div>

        {/* Chart Section */}
        <Card className="bg-slate-950 border-slate-800 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-[100px] -z-10 group-hover:bg-emerald-500/10 transition-colors" />
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-sm font-black tracking-[0.2em] uppercase text-slate-500 flex items-center gap-3 italic">
                <Activity className="w-4 h-4 text-emerald-500" /> Savings Trajectory Matrix
              </h3>
              <p className="text-[10px] font-bold text-slate-600 uppercase mt-1">Projected cumulative fiscal impact</p>
            </div>
            <div className="flex gap-2">
               {['7D', '30D', '90D', '1Y'].map(t => (
                 <button key={t} className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all ${t === '1Y' ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20' : 'bg-slate-900 text-slate-500 hover:text-slate-300 border border-slate-800'}`}>
                    {t}
                 </button>
               ))}
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={simulationData}>
                <defs>
                  <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} opacity={0.5} />
                <XAxis dataKey="month" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} tick={{ fontWeight: 800 }} />
                <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v/1000}k`} tick={{ fontWeight: 800 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#020617", borderColor: "#1e293b", borderRadius: "1.5rem", padding: "1rem", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)" }}
                  itemStyle={{ color: "#10b981", fontWeight: 900, textTransform: 'uppercase', fontSize: '10px' }}
                  labelStyle={{ color: "#94a3b8", fontWeight: 900, marginBottom: '0.5rem', fontSize: '10px' }}
                />
                <Area type="monotone" dataKey="savings" stroke="#10b981" fillOpacity={1} fill="url(#colorSavings)" strokeWidth={4} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Opportunity Feed */}
        <div className="space-y-8">
           <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black tracking-tighter text-white uppercase italic flex items-center gap-3">
                  <Layers className="w-6 h-6 text-emerald-500" /> Optimization Pipeline
                </h2>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Strategic directives identified by Neural Engine</p>
              </div>
              <Badge variant="outline" className="bg-slate-900 border-slate-800 text-[10px] font-black text-emerald-500 px-4 py-1.5 rounded-xl uppercase">
                 {(savings || []).length} Opportunities Detected
              </Badge>
           </div>

           {(savings || []).length === 0 ? (
             <div className="bg-slate-950 border-slate-800 rounded-[2.5rem] p-24 text-center group">
                <div className="flex justify-center mb-6">
                   <div className="w-20 h-20 rounded-3xl bg-slate-900 flex items-center justify-center border border-slate-800 group-hover:border-emerald-500/20 transition-all">
                      <Zap className="w-10 h-10 text-slate-700 group-hover:text-emerald-500 transition-colors" />
                   </div>
                </div>
                <h3 className="text-lg font-black text-white italic mb-2 uppercase tracking-tight">System Baseline Optimized</h3>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest max-w-sm mx-auto leading-relaxed">No significant cost optimization opportunities detected. Your portfolio is currently performing at peak efficiency.</p>
             </div>
           ) : (
             <div className="grid grid-cols-1 gap-6">
                <AnimatePresence mode="popLayout">
                  {(savings || []).map((opp: any, idx: number) => (
                    <motion.div
                      key={opp.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-slate-950 border border-slate-800 rounded-[2rem] p-8 flex flex-col md:flex-row items-start md:items-center justify-between hover:border-emerald-500/40 transition-all group relative overflow-hidden shadow-xl"
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      <div className="flex-1 space-y-4">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                               <TrendingDown className="w-6 h-6" />
                            </div>
                            <div>
                               <div className="flex items-center gap-3 mb-1">
                                  <Badge className="bg-emerald-500 text-[8px] font-black uppercase text-slate-950 border-none italic px-3 py-0.5">
                                     {opp.type.replace(/_/g, ' ')}
                                  </Badge>
                                  <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Target: Contract #{opp.contractId}</span>
                               </div>
                               <h4 className="text-xl font-black text-white group-hover:text-emerald-400 transition-colors tracking-tighter italic uppercase">
                                  {opp.description}
                               </h4>
                            </div>
                         </div>
                      </div>

                      <div className="flex items-center gap-10 mt-6 md:mt-0 w-full md:w-auto border-t md:border-t-0 border-slate-900 pt-6 md:pt-0">
                         <div className="text-right">
                            <p className="text-[9px] font-black text-slate-600 mb-1 uppercase tracking-widest">Projected Impact</p>
                            <p className="text-3xl font-black text-emerald-400 italic tracking-tighter">${(opp.estimatedSavings || 0).toLocaleString()}</p>
                         </div>
                         <Button className="h-12 px-6 rounded-2xl bg-slate-900 border-slate-800 hover:bg-emerald-500 hover:text-slate-950 hover:shadow-lg hover:shadow-emerald-500/20 transition-all text-[10px] font-black uppercase tracking-widest group/btn">
                            Review Directive <ArrowUpRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                         </Button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
             </div>
           )}
        </div>
      </div>
    </Layout>
  );
}

function MetricCard({ label, value, icon: Icon, color, accent, description }: any) {
  return (
    <motion.div 
      whileHover={{ y: -8 }}
      className="bg-slate-950 border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group transition-all hover:border-emerald-500/20"
    >
      <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/5 rounded-full blur-[60px] group-hover:bg-emerald-500/5 transition-colors" />
      <div className="flex justify-between items-start relative z-10 mb-6">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border border-white/5 shadow-2xl group-hover:scale-110 transition-transform ${accent} ${color}`}>
          <Icon className="w-7 h-7" />
        </div>
        <Badge variant="outline" className="border-white/5 text-slate-600 bg-white/5 text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1">REAL-TIME TELEMETRY</Badge>
      </div>
      <div className="relative z-10 space-y-2">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">{label}</p>
        <h3 className="text-4xl font-black tracking-tighter text-white italic">
          {value}
        </h3>
        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{description}</p>
      </div>
    </motion.div>
  );
}

const simulationData = [
  { month: "JAN", savings: 1200 },
  { month: "FEB", savings: 4500 },
  { month: "MAR", savings: 3200 },
  { month: "APR", savings: 8700 },
  { month: "MAY", savings: 15400 },
  { month: "JUN", savings: 19800 },
  { month: "JUL", savings: 24500 },
  { month: "AUG", savings: 31000 },
  { month: "SEP", savings: 42500 },
  { month: "OCT", savings: 56000 },
  { month: "NOV", savings: 68000 },
  { month: "DEC", savings: 85000 },
];
