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

      // ── FLOW 1: Implicit (Hash-based) — Magic Links & legacy SSO ──────────
      // Supabase returns access_token in the URL hash: #access_token=xxx
      if (hash && hash.includes("access_token=")) {
        const params = new URLSearchParams(hash.replace("#", "?"));
        const accessToken = params.get("access_token");

        if (accessToken) {
          try {
            // Exchange raw JWT for a secure HttpOnly server cookie.
            // No CSRF token needed — /api/auth/* routes are exempt.
            const res = await fetch("/api/auth/session", {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ access_token: accessToken }),
            });

            if (res.ok) {
              window.location.replace("/");
              return;
            }
            console.error("[AuthCallback] Session exchange failed:", await res.text());
            setLocation("/auth?error=session_failed");
            return;
          } catch (error) {
            console.error("[AuthCallback] Network error on session exchange:", error);
            setLocation("/auth?error=network");
            return;
          }
        }
      }

      // ── FLOW 2: PKCE (Code-based) — Safety net ────────────────────────────
      // With Google OAuth now routing directly to /api/auth/callback (backend),
      // this branch handles magic links or other flows that send a code here.
      const searchParams = new URLSearchParams(search);
      const code = searchParams.get("code");

      if (code) {
        try {
          const res = await fetch(`/api/auth/callback?code=${encodeURIComponent(code)}`, {
            method: "GET",
            credentials: "include",
          });

          // The backend responds with a redirect — fetch follows it automatically.
          // If we reach here without an error, auth succeeded.
          if (res.ok || res.redirected) {
            window.location.replace("/");
            return;
          }
          console.error("[AuthCallback] Code exchange failed:", res.status);
          setLocation("/auth?error=code_exchange_failed");
          return;
        } catch (error) {
          console.error("[AuthCallback] Network error on code exchange:", error);
          setLocation("/auth?error=network");
          return;
        }
      }

      // ── ERROR CASES ────────────────────────────────────────────────────────
      const err = searchParams.get("error");
      if (err) {
        console.error("[AuthCallback] SSO Error:", searchParams.get("error_description"));
        setLocation(`/auth?error=${encodeURIComponent(err)}`);
        return;
      }

      // Nothing recognisable — send back to login
      console.warn("[AuthCallback] No auth parameters found. Redirecting to /auth.");
      setLocation("/auth");
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
        <h1 className="text-xl font-black text-white uppercase tracking-tighter">
          Establishing Secure Gateway
        </h1>
        <p className="text-slate-400 mt-2 text-xs font-bold">Verifying Enterprise Identity</p>
      </motion.div>
    </div>
  );
}
