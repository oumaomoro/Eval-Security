import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ShieldCheck, Lock, Mail, User, ArrowRight, Brain, Globe } from "lucide-react";
import { motion } from "framer-motion";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Login State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Register State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  
  const loginMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Login failed");
      }
      return res.json();
    },
    onSuccess: () => {
      window.location.href = "/";
    },
    onError: (err: any) => {
      toast({ title: "Authentication Failed", description: err.message, variant: "destructive" });
    }
  });

  const registerMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, firstName, lastName })
      });
      if (!res.ok) {
         const err = await res.json();
         throw new Error(err.message || "Registration failed");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Account Created", description: "Seamless enterprise onboarding initiated. Please verify your email." });
      setMode("login");
    },
    onError: (err: any) => {
      toast({ title: "Registration Error", description: err.message, variant: "destructive" });
    }
  });

  const forgotMutation = useMutation({
    mutationFn: async () => {
        const res = await fetch("/api/auth/forgot-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email })
        });
        if (!res.ok) throw new Error("Could not initiate reset");
        return res.json();
    },
    onSuccess: () => {
        toast({ title: "Reset Link Sent", description: "Verification email dispatched via Resend Node Gateway." });
        setMode("login");
    }
  });

  if (user) {
    window.location.href = "/";
    return null;
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-slate-950 font-sans selection:bg-primary/30">
      {/* Left Side: Premium Costloci Branding */}
      <div className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden border-r border-[hsl(240,25%,18%)]" style={{background: 'linear-gradient(135deg, hsl(240,50%,7%) 0%, hsl(240,40%,4%) 100%)' }}>
        {/* Decorative mesh */}
        <div className="absolute inset-0 bg-grid-pattern opacity-100 pointer-events-none" />
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30 shadow-2xl shadow-primary/30 animate-ring-pulse">
              <ShieldCheck className="w-7 h-7 text-primary" />
            </div>
            <div>
              <span className="text-2xl font-black tracking-tighter gradient-text-emerald">Costloci</span>
              <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Enterprise Intelligence Platform</p>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-5xl font-black text-white leading-none tracking-tighter mb-6">
              Where Contracts<br/><span className="gradient-text-emerald italic">Generate ROI</span>
            </h1>
            <p className="text-base text-slate-400 max-w-md leading-relaxed font-medium">
              Enterprise contract intelligence, real-time jurisdictional compliance & AI-powered risk governance. Autonomic. Competitive. Profitable from Day One.
            </p>
          </motion.div>

          {/* Proof Points */}
          <div className="mt-10 grid grid-cols-1 gap-3">
            {[
              { icon: ShieldCheck, color: "text-emerald-500", label: "AI Contract Analysis", metric: "~20x cheaper than GPT-4" },
              { icon: Globe, color: "text-cyan-400", label: "Global Jurisdiction Sync", metric: "KDPA · POPIA · GDPR · CCPA" },
              { icon: Brain, color: "text-primary", label: "Autonomic Risk Engine", metric: "Self-healing compliance drift" },
            ].map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-4 p-3 rounded-xl bg-white/3 border border-white/6 backdrop-blur-sm hover:border-primary/20 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-900/60 flex items-center justify-center shrink-0">
                  <p.icon className={`w-4 h-4 ${p.color}`} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-200">{p.label}</p>
                  <p className="text-[9px] text-slate-500 font-mono">{p.metric}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-4 text-slate-600">
           <span className="text-[9px] font-black uppercase tracking-widest">© 2026 Costloci Technologies Ltd. All rights reserved.</span>
        </div>
      </div>

      {/* Right Side: Auth Forms */}
      <div className="flex items-center justify-center p-6 lg:p-12 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl opacity-50" />
        
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md relative z-10"
        >
          <Tabs value={mode} onValueChange={(v: any) => setMode(v)} className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-2 italic">
                {mode === "login" ? "Executive Sign In" : mode === "register" ? "Agentic Onboarding" : "Identity Recovery"}
              </h2>
              <p className="text-sm text-slate-500 font-bold uppercase tracking-tight">
                {mode === "login" ? "Access your enterprise intelligence dashboard" : mode === "register" ? "Initialize your autonomic governance hub" : "Recover access to your secure portal"}
              </p>
            </div>

            <TabsList className="grid w-full grid-cols-2 bg-slate-900 border border-slate-800 rounded-xl p-1 h-12">
              <TabsTrigger value="login" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-black uppercase text-[10px] italic">Access Portal</TabsTrigger>
              <TabsTrigger value="register" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-black uppercase text-[10px] italic">Initialize Agent</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card className="bg-slate-900 border-slate-800 shadow-2xl rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">Enterprise Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <Input 
                        placeholder="analyst@enterprise.com" 
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="bg-black border-slate-800 focus:border-primary pl-10 h-11 rounded-xl text-slate-200"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center px-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Master Key</label>
                        <button onClick={() => setMode("forgot")} className="text-[10px] text-primary font-black uppercase hover:underline">Forgot?</button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <Input 
                        type="password" 
                        placeholder="••••••••••••" 
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="bg-black border-slate-800 focus:border-primary pl-10 h-11 rounded-xl text-slate-200"
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={() => loginMutation.mutate()}
                    disabled={loginMutation.isPending}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-tighter italic h-12 rounded-xl group overflow-hidden relative"
                  >
                    {loginMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                      <>
                        <span className="relative z-10">Authenticate & Connect</span>
                        <ArrowRight className="w-4 h-4 ml-2 relative z-10 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </Button>
                </CardContent>
                <CardFooter className="bg-slate-950/50 p-4 border-t border-slate-800 flex justify-center">
                    <p className="text-[10px] text-slate-600 font-bold uppercase flex items-center gap-2 tracking-widest">
                       <ShieldCheck className="w-3 h-3" /> RSA-4096 Secure Gateway Active
                    </p>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card className="bg-slate-900 border-slate-800 shadow-2xl rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">
                <CardContent className="pt-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">First Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <Input 
                          placeholder="John" 
                          value={firstName}
                          onChange={e => setFirstName(e.target.value)}
                          className="bg-black border-slate-800 focus:border-primary pl-10 h-11 rounded-xl text-slate-200"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">Last Name</label>
                      <Input 
                        placeholder="Doe" 
                        value={lastName}
                        onChange={e => setLastName(e.target.value)}
                        className="bg-black border-slate-800 focus:border-primary h-11 rounded-xl text-slate-200"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">Corporate Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <Input 
                        placeholder="j.doe@enterprise.com" 
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="bg-black border-slate-800 focus:border-primary pl-10 h-11 rounded-xl text-slate-200"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">Secure Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <Input 
                        type="password" 
                        placeholder="Minimum 12 characters" 
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="bg-black border-slate-800 focus:border-primary pl-10 h-11 rounded-xl text-slate-200"
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={() => registerMutation.mutate()}
                    disabled={registerMutation.isPending}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-tighter italic h-12 rounded-xl"
                  >
                    {registerMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Deploy Enterprise Identity"}
                  </Button>
                </CardContent>
                <CardFooter className="bg-slate-950/50 p-4 border-t border-slate-800 flex flex-col items-center gap-2">
                    <p className="text-[8px] text-slate-500 font-bold uppercase text-center leading-tight">
                        By deploying your identity, you agree to the Costloci Enterprise Service Level Agreement.
                    </p>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="forgot">
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                    <Card className="bg-slate-900 border-slate-800 shadow-2xl rounded-2xl overflow-hidden">
                        <CardHeader>
                            <CardTitle className="text-white uppercase tracking-tighter italic">Master Key Recovery</CardTitle>
                            <CardDescription className="text-slate-500 text-[10px] font-bold uppercase">Enter your email to receive recovery instructions.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">Account Email</label>
                                <Input 
                                    placeholder="your-email@enterprise.com" 
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="bg-black border-slate-800 focus:border-primary h-11 rounded-xl text-slate-200"
                                />
                            </div>
                            <Button 
                                onClick={() => forgotMutation.mutate()}
                                disabled={forgotMutation.isPending}
                                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-black uppercase tracking-tighter italic h-12 rounded-xl"
                            >
                                {forgotMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Dispatch Recovery Link"}
                            </Button>
                        </CardContent>
                        <CardFooter>
                            <button onClick={() => setMode("login")} className="text-[10px] text-slate-500 hover:text-white font-black uppercase mx-auto tracking-widest">Back to Secure Login</button>
                        </CardFooter>
                    </Card>
                </motion.div>
            </TabsContent>
          </Tabs>

          <div className="mt-8 flex flex-col items-center gap-6">
            <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent" />
            <div className="flex items-center gap-4">
                <Button 
                    variant="outline"
                    className="border-slate-800 bg-slate-950/50 hover:bg-slate-900 h-12 px-6 rounded-xl text-slate-400 font-bold text-xs uppercase flex items-center gap-2 group"
                    onClick={() => { window.location.href = "/api/auth/google" }}
                >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continue with SSO Gateway
                </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
