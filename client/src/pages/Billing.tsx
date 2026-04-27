import { useEffect } from "react";
import { Layout } from "@/components/Layout";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Zap, Crown, Rocket, Loader2, Shield, TrendingUp, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

// Contract limits aligned with server/routes.ts enforcement
const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: 99,
    contractLimit: 20,
    features: ["20 Contracts", "KDPA Monitoring", "Risk Register", "Email Support"],
    icon: Rocket,
  },
  {
    id: "pro",
    name: "Business Pro",
    price: 299,
    contractLimit: 250,
    features: ["250 Contracts", "Intelligence Redlining", "POPIA / GDPR Maps", "Webhooks", "Priority Support"],
    icon: Zap,
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise Gold",
    price: 999,
    contractLimit: Infinity,
    features: ["Unlimited Contracts", "Autonomic Self-Healing", "ROI Auditing", "24/7 Concierge"],
    icon: Crown,
  },
];

export default function Billing() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") {
      toast({
        title: "Payment Successful",
        description: "Your account has been upgraded. It may take a moment for the status to reflect.",
      });
      // Clear the URL parameters
      window.history.replaceState({}, "", window.location.pathname);
    } else if (params.get("canceled") === "true") {
      toast({
        title: "Payment Canceled",
        description: "Your checkout session was canceled.",
        variant: "destructive"
      });
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [toast]);

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
      if (!res.ok) throw new Error((await res.json()).message || "Subscription failed");
      return res.json();
    },
    onSuccess: (data) => {
      if (data.accessCode && (window as any).PaystackPop) {
        const handler = (window as any).PaystackPop.setup({
          key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
          email: user?.email,
          amount: data.amount,
          access_code: data.accessCode,
          onClose: () => {
            toast({ title: "Checkout Closed", description: "You closed the payment window." });
          },
          callback: (response: any) => {
            toast({ title: "Payment Received", description: "Verifying and upgrading your account..." });
            window.location.href = `/billing?success=true&reference=${response.reference}`;
          }
        });
        handler.openIframe();
      } else if (data.approvalUrl) {
        window.location.href = data.approvalUrl;
      }
    },
    onError: (err: any) => {
      toast({
        title: "Checkout Error",
        description: err.message || "Failed to start PayPal session. Please try again.",
        variant: "destructive",
      });
    },
  });

  const currentTier = (user as any)?.subscriptionTier || "starter";
  const contractsUsed = (user as any)?.contractsCount || 0;
  const currentPlan = PLANS.find((p) => p.id === currentTier) || PLANS[0];
  const usagePercent =
    currentPlan.contractLimit === Infinity
      ? 0
      : Math.min((contractsUsed / currentPlan.contractLimit) * 100, 100);
  const nearLimit = usagePercent >= 80;

  const totalSpend = telemetry?.reduce((s, t) => s + (t.cost || 0), 0) || 0;

  return (
    <Layout header={<h1 className="text-2xl font-bold flex items-center gap-2"><Shield className="w-6 h-6 text-primary" /> Billing Hub</h1>}>
      <div className="space-y-8 pb-12">

        {/* Usage Summary */}
        <Card className="bg-slate-950 border-slate-800">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" /> Contract Usage
              </span>
              <Badge variant="outline" className="text-primary border-primary/30 text-xs">
                {currentPlan.name}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">
                {contractsUsed} / {currentPlan.contractLimit === Infinity ? "∞" : currentPlan.contractLimit} contracts
              </span>
              {nearLimit && (
                <span className="flex items-center gap-1 text-amber-400 text-xs font-semibold">
                  <AlertTriangle className="w-3 h-3" /> Approaching limit
                </span>
              )}
            </div>
            {currentPlan.contractLimit !== Infinity && (
              <Progress
                value={usagePercent}
                className={`h-2 ${nearLimit ? "[&>div]:bg-amber-500" : "[&>div]:bg-primary"}`}
              />
            )}
            {loadingTelemetry ? null : (
              <p className="text-xs text-slate-500">Billing cycle spend: <span className="text-white font-semibold">${totalSpend.toFixed(2)}</span></p>
            )}
          </CardContent>
        </Card>

        {/* Plan Grid */}
        <div>
          <h2 className="text-lg font-semibold text-slate-200 mb-5">Choose a Plan</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {PLANS.map((plan) => {
              const Icon = plan.icon;
              const isCurrent = plan.id === currentTier;
              return (
                <Card
                  key={plan.id}
                  className={`bg-slate-950 flex flex-col transition-all ${
                    isCurrent
                      ? "border-primary/60 shadow-lg shadow-primary/10"
                      : "border-slate-800 hover:border-slate-600"
                  } ${plan.popular ? "ring-1 ring-primary/20" : ""}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between mb-3">
                      <Icon className={`w-5 h-5 ${isCurrent ? "text-primary" : "text-slate-500"}`} />
                      {plan.popular && (
                        <Badge className="bg-primary/10 text-primary border-primary/30 text-[10px]">
                          Most Popular
                        </Badge>
                      )}
                      {isCurrent && !plan.popular && (
                        <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                          Active
                        </Badge>
                      )}
                    </div>
                    <div>
                      <p className="text-white font-bold text-lg">{plan.name}</p>
                      <p className="text-slate-400 text-xs mt-0.5">
                        {plan.contractLimit === Infinity ? "Unlimited contracts" : `Up to ${plan.contractLimit} contracts`}
                      </p>
                    </div>
                    <div className="mt-3">
                      <span className="text-3xl font-black text-white">${plan.price}</span>
                      <span className="text-slate-500 text-xs ml-1">/ month</span>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow pt-0">
                    <ul className="space-y-2">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs text-slate-400">
                          <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full"
                      variant={isCurrent ? "outline" : "default"}
                      disabled={isCurrent || subscribeMutation.isPending}
                      onClick={() => subscribeMutation.mutate(plan.id)}
                    >
                      {subscribeMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : isCurrent ? (
                        "Current Plan"
                      ) : (
                        `Upgrade to ${plan.name}`
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Compliance Badges */}
        <div className="flex flex-wrap gap-2 pt-2">
          {["KDPA (KE)", "POPIA (SA)", "NDPR (NG)", "SAMA (KSA)", "ISO 27001", "DIFC/ADGM"].map((b) => (
            <Badge key={b} variant="outline" className="text-slate-500 border-slate-800 text-[10px]">
              {b}
            </Badge>
          ))}
        </div>
      </div>
    </Layout>
  );
}
