import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, Lock, ShieldCheck, ArrowRight } from "lucide-react";
import { getApiUrl } from "@/lib/api-config";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { toast } = useToast();

  const resetMutation = useMutation({
    mutationFn: async () => {
      if (password !== confirmPassword) throw new Error("Passwords do not match");
      if (password.length < 8) throw new Error("Password must be at least 8 characters");

      const hash = window.location.hash;
      const hashParams = hash ? new URLSearchParams(hash.replace("#", "?")) : new URLSearchParams();
      const searchParams = new URLSearchParams(window.location.search);
      const token = hashParams.get("access_token") || searchParams.get("access_token") || sessionStorage.getItem("recovery_token") || "";

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(getApiUrl("/api/auth/reset-password"), {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify({ password })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Reset failed");
      return data;
    },
    onSuccess: () => {
      toast({ title: "Password Reset Successful", description: "Your password has been updated. Redirecting to sign in..." });
      setTimeout(() => { window.location.href = "/auth"; }, 2000);
    },
    onError: (err: any) => {
      toast({ title: "Reset Error", description: err.message, variant: "destructive" });
    }
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6 selection:bg-primary/30">
      <div className="w-full max-w-md relative z-10">
        <Card className="bg-card border-border shadow-2xl rounded-2xl overflow-hidden">
          <CardHeader className="text-center pt-8 pb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 mx-auto mb-4">
              <ShieldCheck className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">Reset Password</CardTitle>
            <CardDescription className="text-muted-foreground font-medium mt-1">Enter your new account password</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-8">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  type="password" 
                  placeholder="Minimum 8 characters" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="bg-background border-border pl-10 h-11 rounded-lg text-foreground"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  type="password" 
                  placeholder="Re-enter password" 
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="bg-background border-border pl-10 h-11 rounded-lg text-foreground"
                />
              </div>
            </div>
            <Button 
              onClick={() => resetMutation.mutate()}
              disabled={resetMutation.isPending || !password || !confirmPassword}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-11 rounded-lg"
            >
              {resetMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Update Password
            </Button>
          </CardContent>
          <CardFooter className="bg-muted/20 p-4 border-t border-border flex justify-center">
            <a href="/auth" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Back to sign in</a>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
