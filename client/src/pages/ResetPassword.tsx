import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, Lock, ShieldCheck, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { toast } = useToast();

  const resetMutation = useMutation({
    mutationFn: async () => {
      if (password !== confirmPassword) throw new Error("Passwords do not match");
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });
      if (!res.ok) throw new Error("Reset failed");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Key Reset Successful", description: "Your enterprise master key has been updated. Redirecting to portal..." });
      setTimeout(() => { window.location.href = "/"; }, 2000);
    },
    onError: (err: any) => {
       toast({ title: "Reset Error", description: err.message, variant: "destructive" });
    }
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6 selection:bg-primary/30">
      <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary via-transparent to-transparent pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="bg-slate-900 border-slate-800 shadow-2xl rounded-3xl overflow-hidden backdrop-blur-md">
            <CardHeader className="text-center pt-8 pb-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 mx-auto mb-6">
                    <ShieldCheck className="w-9 h-9 text-primary" />
                </div>
                <CardTitle className="text-3xl font-black text-white uppercase tracking-tighter italic">Key Rotation</CardTitle>
                <CardDescription className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-2">Initialize your new enterprise access credentials</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 px-8">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">New Master Key</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <Input 
                            type="password" 
                            placeholder="Minimum 12 characters" 
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="bg-black/50 border-slate-800 focus:border-primary pl-10 h-12 rounded-xl text-slate-200"
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Confirm Identity Key</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <Input 
                            type="password" 
                            placeholder="Re-enter password" 
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            className="bg-black/50 border-slate-800 focus:border-primary pl-10 h-12 rounded-xl text-slate-200"
                        />
                    </div>
                </div>
                <Button 
                    onClick={() => resetMutation.mutate()}
                    disabled={resetMutation.isPending}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-tighter italic h-14 rounded-xl group"
                >
                    {resetMutation.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                        <>
                            Deploy New Keys <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </Button>
            </CardContent>
            <CardFooter className="bg-slate-950/50 p-6 border-t border-slate-800">
                <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest text-center mx-auto leading-relaxed">
                    Identity verification is managed via the CyberOptimize Autonomic Gateway.
                </p>
            </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
