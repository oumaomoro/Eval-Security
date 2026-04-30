import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ShieldCheck, Lock, Mail, User, ArrowRight, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { DiamondIcon } from "@/components/DiamondIcon";
import { SEO } from "@/components/SEO";
import { apiRequest } from "@/lib/queryClient";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function AuthPage() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchParams] = useState(() => new URLSearchParams(window.location.search));
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (searchParams.get("verified") === "true") {
      toast({
        title: "✅ Email Verified",
        description: "Your account is active. You can now sign in.",
      });
    }
    if (searchParams.get("error") === "verification_failed") {
      toast({
        title: "Verification Failed",
        description: "The link has expired. Please request a new one.",
        variant: "destructive",
      });
    }
  }, [searchParams, toast]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const loginMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/login", { email, password });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");
      if (data.token) {
        await apiRequest("POST", "/api/auth/session", { access_token: data.token });
      }
      return data;
    },
    onSuccess: () => { window.location.href = "/"; },
    onError: (err: any) => {
      toast({ title: "Sign In Failed", description: err.message, variant: "destructive" });
    }
  });

  const registerMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/register", { email, password, firstName, lastName });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Registration failed");
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Account Created! 🎉",
        description: data.requiresVerification
          ? "Check your email to verify your account, then sign in."
          : "Welcome! Signing you in now..."
      });
      if (!data.requiresVerification) {
        setTimeout(() => loginMutation.mutate(), 800);
      } else {
        setMode("login");
      }
    },
    onError: (err: any) => {
      toast({ title: "Registration Failed", description: err.message, variant: "destructive" });
    }
  });

  const forgotMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/forgot-password", { email });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Reset Link Sent", description: "Check your email for password reset instructions." });
      setMode("login");
    }
  });

  const magicLinkMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/magic-link", { email });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Magic Link Sent ✨", description: "Check your email — click the link to sign in instantly." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });

  if (user) { window.location.href = "/"; return null; }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-slate-950 font-sans">
      <SEO title="Sign In | Costloci" description="Sign in to your Costloci account." />

      {/* Left: Branding */}
      <div className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden border-r border-slate-800/60">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary/8 rounded-full blur-[140px] pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-primary/30 flex items-center justify-center shadow-xl shadow-primary/10">
              <DiamondIcon className="w-7 h-7" />
            </div>
            <div>
              <span className="text-2xl font-black tracking-tighter text-white">Costloci</span>
              <p className="text-[10px] text-primary font-semibold uppercase tracking-widest mt-0.5">Contract Intelligence</p>
            </div>
          </div>

          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <h1 className="text-5xl font-black text-white leading-tight tracking-tighter mb-6 max-w-sm">
              Smarter<br />
              <span className="text-primary">Contract<br />Management</span>
            </h1>
            <p className="text-base text-slate-400 max-w-sm leading-relaxed mb-10">
              AI-powered compliance, risk detection, and cost optimization for cybersecurity contracts. Built for East African enterprises.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 gap-4 max-w-sm">
            {[
              { stat: "15–30%", label: "Average savings identified" },
              { stat: "80 hrs", label: "Saved per audit cycle" },
              { stat: "KDPA", label: "Kenya compliance ready" },
              { stat: "AI-first", label: "Instant risk analysis" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/60"
              >
                <p className="text-xl font-black text-primary">{item.stat}</p>
                <p className="text-xs text-slate-500 font-medium mt-1">{item.label}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] text-emerald-500 font-semibold uppercase tracking-widest">Platform Online</span>
        </div>
      </div>

      {/* Right: Forms */}
      <div className="flex items-center justify-center p-6 lg:p-12 relative">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md relative z-10">
          <div className="flex justify-end mb-6">
            <LanguageSwitcher />
          </div>

          {/* Google SSO */}
          <Button
            variant="outline"
            className="w-full border-slate-700 bg-slate-900 hover:bg-slate-800 h-12 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-3 mb-6 transition-colors"
            onClick={() => { window.location.href = "/api/auth/google" }}
          >
            <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
            Continue with Google
          </Button>

          <div className="relative flex items-center mb-6">
            <div className="flex-grow border-t border-slate-800" />
            <span className="mx-4 text-slate-500 text-xs">or use email</span>
            <div className="flex-grow border-t border-slate-800" />
          </div>

          <Tabs value={mode} onValueChange={(v: any) => setMode(v)}>
            <TabsList className="grid w-full grid-cols-2 bg-slate-900 border border-slate-800 rounded-xl p-1 h-11 mb-6">
              <TabsTrigger value="login" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white font-semibold text-sm">Sign In</TabsTrigger>
              <TabsTrigger value="register" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white font-semibold text-sm">Create Account</TabsTrigger>
            </TabsList>

            {/* LOGIN */}
            <TabsContent value="login">
              <Card className="bg-slate-900 border-slate-800 rounded-2xl shadow-2xl">
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400">Email address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <Input type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && loginMutation.mutate()} className="bg-slate-950 border-slate-800 focus:border-primary pl-10 h-11 rounded-xl text-slate-200" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold text-slate-400">Password</label>
                      <button onClick={() => setMode("forgot")} className="text-xs text-primary hover:underline">Forgot password?</button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <Input type={showPassword ? "text" : "password"} placeholder="Your password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && loginMutation.mutate()} className="bg-slate-950 border-slate-800 focus:border-primary pl-10 pr-10 h-11 rounded-xl text-slate-200" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <Button onClick={() => loginMutation.mutate()} disabled={loginMutation.isPending || !email || !password} className="w-full bg-primary hover:bg-primary/90 text-white font-semibold h-11 rounded-xl flex items-center justify-center gap-2">
                    {loginMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Sign In</span><ArrowRight className="w-4 h-4" /></>}
                  </Button>
                  <Button onClick={() => magicLinkMutation.mutate()} disabled={magicLinkMutation.isPending || !email} variant="ghost" className="w-full text-slate-400 hover:text-slate-200 text-sm font-medium h-10">
                    {magicLinkMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Mail className="w-4 h-4 mr-2" />}
                    Send a magic link instead
                  </Button>
                </CardContent>
                <CardFooter className="justify-center pb-5">
                  <p className="text-xs text-slate-600 flex items-center gap-1.5"><ShieldCheck className="w-3 h-3" /> Secured with industry-standard encryption</p>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* REGISTER */}
            <TabsContent value="register">
              <Card className="bg-slate-900 border-slate-800 rounded-2xl shadow-2xl">
                <CardContent className="pt-6 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-400">First name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <Input placeholder="John" value={firstName} onChange={e => setFirstName(e.target.value)} className="bg-slate-950 border-slate-800 focus:border-primary pl-10 h-11 rounded-xl text-slate-200" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-400">Last name</label>
                      <Input placeholder="Doe" value={lastName} onChange={e => setLastName(e.target.value)} className="bg-slate-950 border-slate-800 focus:border-primary h-11 rounded-xl text-slate-200" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400">Work email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <Input type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} className="bg-slate-950 border-slate-800 focus:border-primary pl-10 h-11 rounded-xl text-slate-200" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400">Password</label>
                    <p className="text-[11px] text-slate-600">Min. 10 characters with uppercase, number & symbol</p>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <Input type={showPassword ? "text" : "password"} placeholder="Create a strong password" value={password} onChange={e => setPassword(e.target.value)} className="bg-slate-950 border-slate-800 focus:border-primary pl-10 pr-10 h-11 rounded-xl text-slate-200" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <Button onClick={() => registerMutation.mutate()} disabled={registerMutation.isPending || loginMutation.isPending || !email || !password || !firstName} className="w-full bg-primary hover:bg-primary/90 text-white font-semibold h-11 rounded-xl">
                    {registerMutation.isPending || loginMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create My Account"}
                  </Button>
                </CardContent>
                <CardFooter className="justify-center pb-5">
                  <p className="text-[11px] text-slate-500 text-center">By creating an account you agree to our Terms of Service.</p>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* FORGOT PASSWORD */}
            <TabsContent value="forgot">
              <Card className="bg-slate-900 border-slate-800 rounded-2xl shadow-2xl">
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <h3 className="text-white font-semibold text-lg mb-1">Reset your password</h3>
                    <p className="text-slate-400 text-sm">Enter your email and we'll send you a reset link.</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400">Email address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <Input type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} className="bg-slate-950 border-slate-800 focus:border-primary pl-10 h-11 rounded-xl text-slate-200" />
                    </div>
                  </div>
                  <Button onClick={() => forgotMutation.mutate()} disabled={forgotMutation.isPending || !email} className="w-full bg-primary hover:bg-primary/90 text-white font-semibold h-11 rounded-xl">
                    {forgotMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Reset Link"}
                  </Button>
                  <button onClick={() => setMode("login")} className="w-full text-xs text-slate-500 hover:text-white font-medium py-2">← Back to sign in</button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
