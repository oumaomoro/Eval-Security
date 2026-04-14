import { Layout } from "@/components/Layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Zap, CheckCircle2, AlertCircle, TrendingUp, DollarSign, Shield, Crown, Rocket, Loader2, History as HistoryIcon } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: 99,
    description: "Ideal for growing teams with foundational compliance needs.",
    features: ["Up to 10 Contracts", "Standard Analytics", "Jurisdictional Monitoring (KDPA)", "Email Support"],
    icon: Rocket,
    color: "from-blue-600/20 to-blue-400/10"
  },
  {
    id: "pro",
    name: "Business Pro",
    price: 299,
    description: "Advanced intelligence for established legal & IT departments.",
    features: ["Up to 100 Contracts", "Deep AI Redlining", "Risk Mapping (POPIA/GDPR)", "Priority Webhooks", "Dedicated Support"],
    icon: Zap,
    color: "from-primary/30 to-primary/10",
    popular: true
  },
  {
    id: "enterprise",
    name: "Enterprise Gold",
    price: 999,
    description: "Ultimate autonomic resilience for global organizations.",
    features: ["Unlimited Contracts", "Full Autonomic Self-Healing", "Strategy ROI Auditing", "Custom ML Training", "24/7 Concierge"],
    icon: Crown,
    color: "from-emerald-600/20 to-emerald-400/10"
  }
];

export default function Billing() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const { data: telemetry, isLoading: loadingTelemetry } = useQuery<any[]>({
    queryKey: ["/api/billing/telemetry"],
  });

  const subscribeMutation = useMutation({
    mutationFn: async (planType: string) => {
      const res = await fetch("/api/billing/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planType }),
      });
      if (!res.ok) throw new Error("Subscription failed");
      return res.json();
    },
    onSuccess: (data) => {
      if (data.approvalUrl) {
        window.location.href = data.approvalUrl;
      }
    },
    onError: () => {
      toast({
        title: "Checkout Error",
        description: "Failed to initialize PayPal session. Please try again later.",
        variant: "destructive"
      });
    }
  });

  const totalSpend = telemetry?.reduce((sum, item) => sum + (item.cost || 0), 0) || 0;
  const currentTier = (user as any)?.subscriptionTier || 'starter';
  const contractsUsed = (user as any)?.contractsCount || 0;
  const limits: Record<string, number> = { starter: 10, pro: 100, enterprise: 1000000 };
  const currentLimit = limits[currentTier] || 10;
  const usagePercent = Math.min((contractsUsed / currentLimit) * 100, 100);

  return (
    <Layout>
      <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic">Billing Hub</h1>
            <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 px-4 py-1 text-xs font-black italic">LIVE MONETIZATION ACTIVE</Badge>
          </div>
          <p className="text-slate-500 font-bold uppercase tracking-tight text-sm">Autonomous Consumption Telemetry & Lifecycle Management</p>
        </div>

        {/* Plan Selection Section */}
        <div>
          <h2 className="text-2xl font-black text-white mb-8 tracking-tighter uppercase italic flex items-center gap-3">
            <Shield className="w-6 h-6 text-primary" /> Tier Selection
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {PLANS.map((plan) => (
              <motion.div
                key={plan.id}
                whileHover={{ y: -8 }}
                className={`relative group h-full`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                    <Badge className="bg-primary text-black font-black uppercase tracking-widest text-[10px] px-4 py-1.5 shadow-xl">Most Strategic</Badge>
                  </div>
                )}
                <Card className={`h-full bg-slate-950 border-slate-900 shadow-2xl relative overflow-hidden flex flex-col ${plan.id === currentTier ? 'border-primary shadow-primary/10' : ''}`}>
                  <div className={`absolute inset-0 bg-gradient-to-br ${plan.color} opacity-40 group-hover:opacity-60 transition-opacity`} />
                  <CardHeader className="relative z-10">
                    <div className="flex items-center justify-between mb-2">
                      <plan.icon className={`w-8 h-8 ${plan.id === currentTier ? 'text-primary' : 'text-slate-400'}`} />
                      {plan.id === currentTier && (
                        <Badge variant="outline" className="text-[10px] font-black border-primary text-primary bg-primary/5 uppercase">Current Active Tier</Badge>
                      )}
                    </div>
                    <CardTitle className="text-3xl font-black text-white italic tracking-tighter leading-none">{plan.name}</CardTitle>
                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="text-4xl font-black text-white italic tracking-tighter">${plan.price}</span>
                      <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">/ Month</span>
                    </div>
                    <CardDescription className="text-xs font-medium text-slate-400 uppercase mt-4 leading-relaxed line-clamp-2">
                      {plan.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="relative z-10 flex-grow pt-4">
                    <ul className="space-y-3">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-[10px] font-bold text-slate-300 uppercase tracking-tight">
                          <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" /> {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter className="relative z-10 pt-6">
                    <Button 
                      className={`w-full h-12 rounded-xl font-black uppercase tracking-tighter italic text-xs transition-all ${plan.id === currentTier ? 'bg-slate-900 text-slate-500 cursor-not-allowed' : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xl shadow-primary/20'}`}
                      disabled={plan.id === currentTier || subscribeMutation.isPending}
                      onClick={() => subscribeMutation.mutate(plan.id)}
                    >
                      {subscribeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : plan.id === currentTier ? 'Active' : `Upgrade to ${plan.name}`}
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Real-time Usage Analytics Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="bg-slate-950 border-slate-900 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Zap className="w-32 h-32 text-primary" />
                </div>
                <CardHeader>
                    <CardTitle className="text-white uppercase tracking-tighter italic flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-primary" /> Consumption Quota
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-4">
                    <div className="flex justify-between items-end">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Contracts Analyzed</span>
                            <span className="text-4xl font-black text-white italic tracking-tighter">{contractsUsed} / {currentTier === 'enterprise' ? '∞' : currentLimit}</span>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] font-black text-primary uppercase tracking-widest">Efficiency index</span>
                            <div className="text-xl font-black text-emerald-500 italic tracking-tight">98.4%</div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-black uppercase text-slate-500">
                            <span>Contract Cap Usage</span>
                            <span>{Math.round(usagePercent)}%</span>
                        </div>
                        <div className="h-2 bg-slate-900 rounded-full overflow-hidden p-0.5">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${usagePercent}%` }}
                                className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full"
                            />
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="bg-slate-900/50 border-t border-slate-900 p-4">
                    <p className="text-[10px] text-slate-500 font-bold uppercase italic flex items-center gap-2">
                        <AlertCircle className="w-3.5 h-3.5" /> Quota resets on {format(new Date(), "MMMM 30, yyyy")}
                    </p>
                </CardFooter>
            </Card>

            <Card className="bg-slate-950 border-slate-900 shadow-2xl">
                <CardHeader>
                    <CardTitle className="text-white uppercase tracking-tighter italic flex items-center gap-2">
                        <HistoryIcon className="w-5 h-5 text-primary" /> Financial Telemetry
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                   <div className="max-h-[180px] overflow-y-auto overflow-x-hidden">
                       <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 bg-slate-950 z-10 border-b border-slate-900">
                                <tr>
                                    <th className="px-6 py-3 text-[9px] font-black text-slate-500 uppercase tracking-widest">Metric</th>
                                    <th className="px-6 py-3 text-[9px] font-black text-slate-500 uppercase tracking-widest">Value</th>
                                    <th className="px-6 py-3 text-[9px] font-black text-slate-500 uppercase tracking-widest">Cost Impact</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loadingTelemetry ? (
                                    [...Array(3)].map((_, i) => <tr key={i} className="animate-pulse h-12 border-b border-slate-900/50"><td colSpan={3} /></tr>)
                                ) : telemetry?.slice(0, 5).map((item, i) => (
                                    <tr key={item.id} className="border-b border-slate-900/30 hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-3 text-[10px] font-bold text-slate-300 uppercase">{item.metricType.replace('_', ' ')}</td>
                                        <td className="px-6 py-3 text-[10px] font-medium text-slate-500">{item.value.toLocaleString()}</td>
                                        <td className="px-6 py-3 text-[10px] font-black text-emerald-500 italic">${item.cost.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                       </table>
                   </div>
                </CardContent>
                <CardFooter className="p-4 border-t border-slate-900">
                    <div className="flex justify-between w-full items-center">
                        <span className="text-[10px] font-black text-slate-500 uppercase">Cycle Expenditure</span>
                        <span className="text-xl font-black text-white italic tracking-tighter">${totalSpend.toFixed(2)}</span>
                    </div>
                </CardFooter>
            </Card>
        </div>

        {/* Global Security Compliance Banner */}
        <div className="bg-gradient-to-r from-slate-950 to-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6 relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                    <Shield className="w-8 h-8 text-primary shadow-2xl" />
                </div>
                <div>
                   <h3 className="text-xl font-black text-white uppercase italic tracking-tighter leading-none">Governed Intelligence Hub</h3>
                   <p className="text-xs text-slate-500 font-bold mt-2 uppercase tracking-tight max-w-md">
                       Your data sovereignty is our priority. Costloci utilizes regional East African nodes for metadata storage and 256-bit AES encryption for all financial telemetry.
                   </p>
                </div>
            </div>
            <div className="flex flex-wrap gap-2 relative z-10 justify-center">
                <Badge variant="outline" className="border-slate-800 text-slate-400 font-black tracking-widest text-[7px] px-3 py-1.5 uppercase italic bg-black/40">PCI-DSS L1</Badge>
                <Badge variant="outline" className="border-slate-800 text-slate-400 font-black tracking-widest text-[7px] px-3 py-1.5 uppercase italic bg-black/40">KDPA (KE)</Badge>
                <Badge variant="outline" className="border-slate-800 text-slate-400 font-black tracking-widest text-[7px] px-3 py-1.5 uppercase italic bg-black/40">POPIA (SA)</Badge>
                <Badge variant="outline" className="border-slate-800 text-slate-400 font-black tracking-widest text-[7px] px-3 py-1.5 uppercase italic bg-black/40">NDPR (NG)</Badge>
                <Badge variant="outline" className="border-slate-800 text-slate-400 font-black tracking-widest text-[7px] px-3 py-1.5 uppercase italic bg-black/40">SAMA (KSA)</Badge>
                <Badge variant="outline" className="border-slate-800 text-slate-400 font-black tracking-widest text-[7px] px-3 py-1.5 uppercase italic bg-black/40">DIFC/ADGM (UAE)</Badge>
                <Badge variant="outline" className="border-slate-800 text-slate-400 font-black tracking-widest text-[7px] px-3 py-1.5 uppercase italic bg-black/40">ISO 27001</Badge>
            </div>
            <div className="absolute -right-12 -top-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        </div>

        {/* Industry Baseline ROI Trust Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
            <div className="p-8 bg-slate-950 border border-slate-900 rounded-3xl relative group">
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-emerald-500/10 rounded-xl">
                        <TrendingUp className="w-6 h-6 text-emerald-500" />
                    </div>
                    <h4 className="text-lg font-black text-white uppercase italic tracking-tighter">Industry Baseline ROI</h4>
                </div>
                <p className="text-sm text-slate-400 font-medium leading-relaxed">
                    Our calculations utilize the **MEA & East African Industry Baseline** of **4.5 - 5.0 hours** saved per automated contract audit. This accounts for manual cross-referencing of KDPA, POPIA, and IRA Kenya guidance notes.
                </p>
                <div className="mt-6 flex items-center gap-2 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                    <CheckCircle2 className="w-4 h-4" /> Professional Benchmark Adjusted
                </div>
            </div>
            <div className="p-8 bg-slate-950 border border-slate-900 rounded-3xl relative group">
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-primary/10 rounded-xl">
                        <Shield className="w-6 h-6 text-primary" />
                    </div>
                    <h4 className="text-lg font-black text-white uppercase italic tracking-tighter">Autonomic Security Shield</h4>
                </div>
                <p className="text-sm text-slate-400 font-medium leading-relaxed">
                    Every transaction generates an entry in the **Immutable Audit Ledger**, ensuring your compliance posture remains auditable for IRA Kenya July 2025 reporting requirements.
                </p>
                <div className="mt-6 flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-widest">
                    <CheckCircle2 className="w-4 h-4" /> Governance Traceability Active
                </div>
            </div>
        </div>
      </div>
    </Layout>
  );
}
