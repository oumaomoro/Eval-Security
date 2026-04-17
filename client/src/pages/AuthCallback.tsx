import { useEffect } from "react";
import { useLocation } from "wouter";
import { Loader2, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

export function AuthCallback() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const handleAuth = async () => {
      const hash = window.location.hash;
      const search = window.location.search;

      // Detect token from Hash (Implicit Flow)
      if (hash && hash.includes("access_token=")) {
        const params = new URLSearchParams(hash.replace("#", "?"));
        const accessToken = params.get("access_token");
        
        if (accessToken) {
          try {
            // Exchange token for secure HttpOnly session cookie
            const res = await fetch("/api/auth/session", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ access_token: accessToken }),
            });
            
            if (res.ok) {
              window.location.href = "/";
              return;
            } else {
              console.error("Session exchange failed", await res.text());
              setLocation("/auth?error=session_failed");
              return;
            }
          } catch (error) {
            console.error("Session exchange error", error);
            setLocation("/auth?error=network");
            return;
          }
        }
      }

      // Check for errors
      const searchParams = new URLSearchParams(search);
      const err = searchParams.get("error");
      if (err) {
         console.error("SSO Error:", searchParams.get("error_description"));
         setLocation("/auth?error=sso");
         return;
      }

      // Fallback
      setTimeout(() => {
         setLocation("/auth");
      }, 3000);
    };

    handleAuth();
  }, [setLocation]);

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-950 font-sans">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center"
      >
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
          <div className="w-16 h-16 bg-slate-900 border border-primary/30 rounded-2xl flex items-center justify-center relative z-10">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
        </div>
        <Loader2 className="w-6 h-6 animate-spin text-slate-500 mb-4" />
        <h1 className="text-xl font-black text-white uppercase tracking-tighter">Establishing Secure Gateway</h1>
        <p className="text-slate-400 mt-2 text-xs font-bold uppercase tracking-widest">Verifying Enterprise Identity</p>
      </motion.div>
    </div>
  );
}
