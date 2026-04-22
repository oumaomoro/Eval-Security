import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Download, Shield, Bell, Brain, Zap, Globe, Lock, User, Save, Fingerprint, Activity, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { startRegistration } from '@simplewebauthn/browser';
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { getApiUrl } from "@/lib/api-config";

export default function Settings() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [downloading, setDownloading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [latencyData, setLatencyData] = useState<any>(null);

  const handleRegisterPasskey = async () => {
    setIsRegistering(true);
    try {
      const res = await fetch(getApiUrl('/api/auth/webauthn/generate-registration'), { 
        method: 'POST',
        credentials: "include"
      });
      if (!res.ok) throw new Error("Failed to generate registration options");
      const options = await res.json();

      const attResp = await startRegistration(options);

      const verifyRes = await fetch(getApiUrl('/api/auth/webauthn/verify-registration'), {
        method: 'POST',
        credentials: "include",
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(attResp),
      });

      const verification = await verifyRes.json();
      if (verification.verified) {
        toast({ title: "Passkey Registered", description: "Biometric security activated successfully." });
      } else {
        throw new Error("Verification failed");
      }
    } catch (err: any) {
      toast({ title: "Registration Failed", description: err.message, variant: "destructive" });
    } finally {
      setIsRegistering(false);
    }
  };

  useEffect(() => {
    fetch(getApiUrl('/api/health/latency'), {
      credentials: "include"
    })
      .then(res => res.json())
      .then(data => setLatencyData(data));
      
    // Handle PayPal Redirect
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
        toast({
            title: "Subscription Activated",
            description: "Your Costloci Enterprise tier has been upgraded successfully. Telemetry unlocked.",
            duration: 8000,
        });
        // Remove query param to prevent loop
        window.history.replaceState({}, document.title, window.location.pathname);
    }
    if (urlParams.get('canceled') === 'true') {
        toast({
            title: "Checkout Canceled",
            description: "The payment process was interrupted. No charges were made.",
            variant: "destructive"
        });
        window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleDownloadPack = () => {
    setDownloading(true);
    // Simulate high-fidelity asset generation
    setTimeout(() => {
      setDownloading(false);
      toast({
        title: "Strategic Pack Generated",
        description: "Costloci Executive Strategic Pack (v1.0) has been dispatched to your local storage.",
      });
      // In a real scenario, this would trigger a window.open or a blob download
    }, 2000);
  };

  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in duration-700">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">Platform Configuration</h1>
          <p className="text-slate-500 font-bold uppercase tracking-tight">Global Governance & Enterprise Intelligence Settings</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: General & Security */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="bg-slate-900/50 border-slate-800 shadow-2xl rounded-2xl overflow-hidden backdrop-blur-sm">
              <CardHeader className="border-b border-slate-800 bg-slate-950/30">
                <CardTitle className="flex items-center gap-3 text-white uppercase tracking-tighter italic text-xl">
                  <User className="w-5 h-5 text-primary" /> Profile Intelligence
                </CardTitle>
                <CardDescription className="text-slate-500 font-medium uppercase text-[10px]">Verify your enterprise identity and access level</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 font-semibold ml-1">Full Name</label>
                    <Input value={`${user?.firstName} ${user?.lastName}`} readOnly className="bg-black/50 border-slate-800 rounded-xl h-11" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 font-semibold ml-1">Enterprise Email</label>
                    <Input value={user?.email || ""} readOnly disabled className="bg-slate-800/30 border-slate-800 rounded-xl h-11 text-slate-500" />
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Lock className="w-5 h-5 text-emerald-500" />
                        <div>
                            <p className="text-xs font-black text-emerald-500 uppercase tracking-tight">Two-Factor Authentication</p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">RSA-4096 Secure Session Active</p>
                        </div>
                    </div>
                    <Switch checked />
                </div>
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between group hover:border-primary/40 transition-all">
                    <div className="flex items-center gap-3">
                        <Fingerprint className="w-6 h-6 text-primary" />
                        <div>
                            <p className="text-xs font-black text-primary uppercase tracking-tight italic">Biometric Passkey (WebAuthn)</p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5 tracking-tight">Harden account with FIDO2 hardware tokens</p>
                        </div>
                    </div>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        disabled={isRegistering}
                        onClick={handleRegisterPasskey}
                        className="bg-primary/10 border-primary/30 text-primary font-black uppercase text-[10px] h-8 px-4 rounded-lg italic"
                    >
                        {isRegistering ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : null}
                        Enroll Token
                    </Button>
                </div>
              </CardContent>
              <CardFooter className="bg-slate-950/30 border-t border-slate-800 p-4">
                 <Button className="ml-auto bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase italic rounded-xl px-6">
                    <Save className="w-4 h-4 mr-2" /> Commit Profile Sync
                 </Button>
              </CardFooter>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800 shadow-2xl rounded-2xl overflow-hidden backdrop-blur-sm">
                <CardHeader className="border-b border-slate-800 bg-slate-950/30">
                    <CardTitle className="flex items-center gap-3 text-white uppercase tracking-tighter italic text-xl">
                        <Zap className="w-5 h-5 text-cyan-500" /> Autonomic Engine Control
                    </CardTitle>
                    <CardDescription className="text-slate-500 font-medium uppercase text-[10px]">Configure predictive healing and real-time monitoring thresholds</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950/50 border border-slate-800 hover:border-slate-700 transition-colors">
                            <div className="flex flex-col">
                                <span className="text-xs font-black text-slate-200 uppercase tracking-tight">Predictive Autofix</span>
                                <span className="text-[10px] text-slate-500 font-bold uppercase">Automatically remediate infrastructure anomalies</span>
                            </div>
                            <Switch checked />
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950/50 border border-slate-800 hover:border-slate-700 transition-colors">
                            <div className="flex flex-col">
                                <span className="text-xs font-black text-slate-200 uppercase tracking-tight">Real-time GRC Sentinel</span>
                                <span className="text-[10px] text-slate-500 font-bold uppercase">Continuous compliance auditing on contract uploads</span>
                            </div>
                            <Switch checked />
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950/50 border border-slate-800 hover:border-slate-700 transition-colors">
                            <div className="flex flex-col">
                                <span className="text-xs font-black text-slate-200 uppercase tracking-tight">Executive Slack Notifications</span>
                                <span className="text-[10px] text-slate-500 font-bold uppercase">Critical risk alerts dispatched to linked channels</span>
                            </div>
                            <Switch />
                        </div>
                    </div>
                </CardContent>
            </Card>
          </div>

          {/* Right Column: Strategic Pack & Integrations */}
          <div className="space-y-8">
            <Card className="bg-gradient-to-br from-primary/20 to-slate-900 border-primary/30 shadow-2xl shadow-primary/10 rounded-2xl overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <Brain className="w-24 h-24 text-primary" />
              </div>
              <CardHeader>
                <CardTitle className="text-white uppercase tracking-tighter italic text-2xl">Strategic Pack</CardTitle>
                <CardDescription className="text-slate-300 font-bold font-semibold opacity-70">Executive Compliance & Risk Toolkit</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-400 font-medium leading-relaxed">
                  Generate a comprehensive enterprise strategic pack containing:
                </p>
                <ul className="space-y-2 text-[10px] text-slate-500 font-black uppercase tracking-tighter">
                  <li className="flex items-center gap-2"><Shield className="w-3 h-3 text-primary" /> Internal Governance Templates</li>
                  <li className="flex items-center gap-2"><Globe className="w-3 h-3 text-primary" /> Regional Privacy Playbooks</li>
                  <li className="flex items-center gap-2"><Brain className="w-3 h-3 text-primary" /> AI Risk Mitigation Framework</li>
                  <li className="flex items-center gap-2"><Lock className="w-3 h-3 text-primary" /> RSA-Certified Security Manual</li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleDownloadPack}
                  disabled={downloading}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-tighter italic h-12 rounded-xl group"
                >
                  {downloading ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                        <Zap className="w-4 h-4 animate-pulse" /> Finalizing Assets...
                    </motion.div>
                  ) : (
                    <>
                        <Download className="w-4 h-4 mr-2 group-hover:translate-y-0.5 transition-transform" /> 
                        Initiate Strategic Download
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800 shadow-2xl rounded-2xl overflow-hidden backdrop-blur-sm">
                <CardHeader className="bg-slate-950/30 border-b border-slate-800">
                    <CardTitle className="text-slate-100 uppercase tracking-tighter text-sm italic">Linked Hub Integrations</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-slate-800">
                        <div className="flex items-center gap-3">
                            <Globe className="w-4 h-4 text-slate-500" />
                            <span className="text-[10px] font-black text-slate-400 uppercase">Cloudflare Gateway</span>
                        </div>
                        <span className="text-[8px] bg-emerald-500 text-emerald-950 font-black px-2 py-0.5 rounded-full font-semibold">Active</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-slate-800">
                        <div className="flex items-center gap-3">
                            <Brain className="w-4 h-4 text-slate-500" />
                            <span className="text-[10px] font-black text-slate-400 uppercase">OpenAI Cortex-4</span>
                        </div>
                        <span className="text-[8px] bg-emerald-500 text-emerald-950 font-black px-2 py-0.5 rounded-full font-semibold">Active</span>
                    </div>
                </CardContent>
            </Card>

            {latencyData && (
              <Card className="bg-slate-900/50 border-slate-800 shadow-2xl rounded-2xl overflow-hidden backdrop-blur-sm">
                <CardHeader className="border-b border-slate-800 bg-slate-950/30">
                  <CardTitle className="flex items-center gap-3 text-white uppercase tracking-tighter italic text-xl">
                    <Activity className="w-5 h-5 text-emerald-500" /> Global Edge Latency
                  </CardTitle>
                  <CardDescription className="text-slate-500 font-medium uppercase text-[10px]">Real-time infrastructure resilience telemetry</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  {Object.entries(latencyData).map(([region, latency]: [string, any]) => (
                      <div key={region} className="space-y-2">
                          <div className="flex justify-between items-center mb-1">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{region}</span>
                              <span className={cn("text-xs font-black italic tracking-tight uppercase", latency < 150 ? "text-emerald-500" : "text-amber-500")}>
                                  {latency}ms
                              </span>
                          </div>
                          <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                              <div 
                                  className={cn("h-full rounded-full transition-all duration-1000", latency < 150 ? "bg-emerald-500" : "bg-amber-500")}
                                  style={{ width: `${(latency / 300) * 100}%` }}
                              />
                          </div>
                      </div>
                  ))}
                </CardContent>
              </Card>
            )}
            {/* End right column */}
          </div>
          {/* End grid */}
        </div>
        {/* End space-y-8 */}
      </div>
    </Layout>
  );
}
