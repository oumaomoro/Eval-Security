import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingDown, TrendingUp, BarChart3, Info, Globe, Target } from "lucide-react";
import { motion } from "framer-motion";

interface MarketBenchmarkProps {
  contractId: number;
}

export function MarketBenchmark({ contractId }: MarketBenchmarkProps) {
  const { data: benchmark, isLoading } = useQuery({
    queryKey: [`/api/contracts/${contractId}/benchmarking`],
    queryFn: async () => {
      const res = await fetch(`/api/contracts/${contractId}/benchmarking`);
      if (!res.ok) throw new Error("Failed to fetch market intelligence");
      return res.json();
    }
  });

  if (isLoading) return <div className="h-64 animate-pulse bg-slate-900/50 rounded-3xl border border-slate-800" />;
  if (!benchmark) return null;

  const isSaving = benchmark.comparison.costPercentile === "below_market";
  const potentialSavings = benchmark.comparison.savingsPotential;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Market Stance Card */}
        <Card className="bg-slate-950 border-slate-800 shadow-2xl relative overflow-hidden group col-span-1 md:col-span-2">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
            <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <Globe className="w-4 h-4 text-primary" />
                        Market Positioning: {benchmark.category}
                    </CardTitle>
                    <Badge variant="outline" className={isSaving ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-amber-500/10 text-amber-500 border-amber-500/20"}>
                        {isSaving ? "Optimal Stance" : "Optimization Required"}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pt-4">
                    <div className="space-y-1">
                        <p className="text-3xl font-black text-slate-100 tracking-tighter">
                            {isSaving ? "Below Market Average" : "Above Market Average"}
                        </p>
                        <p className="text-xs text-slate-400 font-medium italic">
                            Benchmarked against {benchmark.peerCount} peer enterprise agreements in the Costloci Global Hub.
                        </p>
                    </div>
                    
                    {potentialSavings > 0 && (
                        <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-2xl">
                             <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Potential Savings Opportunity</p>
                             <div className="text-2xl font-mono font-bold text-emerald-400">
                                +${potentialSavings.toLocaleString()}<span className="text-sm">/yr</span>
                             </div>
                        </div>
                    )}
                </div>

                <div className="mt-8 space-y-4">
                    <div className="space-y-2">
                        <div className="flex justify-between text-[10px] uppercase font-black text-slate-500 tracking-tighter">
                            <span>Relative Pricing Pressure</span>
                            <span>{isSaving ? "Low" : "High"}</span>
                        </div>
                        <Progress value={isSaving ? 35 : 85} className={`h-1.5 ${isSaving ? 'bg-emerald-500/20' : 'bg-red-500/20'}`} />
                    </div>
                </div>
            </CardContent>
        </Card>

        {/* Peer Network Card */}
        <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden relative">
            <div className="absolute right-0 top-0 p-4 opacity-10">
                <BarChart3 className="w-16 h-16" />
            </div>
            <CardHeader>
                <CardTitle className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Market Logic</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-2">
                <div>
                    <p className="text-xs text-slate-400 font-bold mb-1 uppercase">Avg. Annual Cost</p>
                    <p className="text-2xl font-mono font-black text-primary">${benchmark.marketAverages.annualCost.toLocaleString()}</p>
                </div>
                <div>
                    <p className="text-xs text-slate-400 font-bold mb-1 uppercase">Avg. Contract Term</p>
                    <p className="text-2xl font-mono font-black text-slate-200">{benchmark.marketAverages.termMonths} <span className="text-sm font-sans text-slate-500">Mos</span></p>
                </div>
            </CardContent>
        </Card>
      </div>

      <div className="bg-card/50 border border-border p-6 rounded-3xl flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center shrink-0">
             <Target className="w-5 h-5 text-cyan-500" />
          </div>
          <div>
              <h4 className="text-sm font-bold text-slate-200 mb-1">Market Foresight</h4>
              <p className="text-xs text-slate-400 leading-relaxed italic">
                Costloci's autonomic engine suggests that current market trends for {benchmark.category} are shifting toward {benchmark.marketAverages.termMonths}-month cycles.
                {potentialSavings > 0 
                    ? ` Negotiating toward the market average of $${benchmark.marketAverages.annualCost.toLocaleString()} could realize $${potentialSavings.toLocaleString()} in annual optimization.` 
                    : " Your current agreement holds a premium competitive stance relative to recent industry peer ingestions."}
              </p>
          </div>
      </div>
    </div>
  );
}
