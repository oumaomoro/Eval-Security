import { useEffect } from "react";
import { useLocation } from "wouter";
import { Loader2, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { getApiUrl } from "@/lib/api-config";

export function AuthCallback() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const handleAuth = async () => {
      const hash = window.location.hash;
      const search = window.location.search;

      const hashParams = hash ? new URLSearchParams(hash.replace("#", "?")) : new URLSearchParams();
      const searchParams = new URLSearchParams(search);

      // Check errors in hash or query
      const err = searchParams.get("error") || hashParams.get("error");
      const errCode = searchParams.get("error_code") || hashParams.get("error_code");
      const errDesc = searchParams.get("error_description") || hashParams.get("error_description");

      if (err) {
        console.error("[AuthCallback] Error:", err, errCode, errDesc);
        const codeParam = errCode ? `&error_code=${encodeURIComponent(errCode)}` : "";
        const descParam = errDesc ? `&error_description=${encodeURIComponent(errDesc)}` : "";
        window.location.replace(`/auth?error=${encodeURIComponent(err)}${codeParam}${descParam}`);
        return;
      }

      const type = searchParams.get("type") || hashParams.get("type");

      // ── FLOW 1: Implicit (Hash-based) — Tokens in URL hash ──────────
      const accessToken = hashParams.get("access_token");
      if (accessToken) {
        try {
          const res = await fetch(getApiUrl("/api/auth/session"), {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ access_token: accessToken }),
          });

          if (res.ok) {
            if (type === "recovery") {
              window.location.replace("/reset-password");
              return;
            }
            window.location.replace("/");
            return;
          }
          console.error("[AuthCallback] Session exchange failed:", await res.text());
          window.location.replace("/auth?error=session_failed");
          return;
        } catch (error) {
          console.error("[AuthCallback] Network error on session exchange:", error);
          window.location.replace("/auth?error=network");
          return;
        }
      }

      // ── FLOW 2: PKCE (Code-based) ────────────────────────────
      const code = searchParams.get("code") || hashParams.get("code");
      if (code) {
        try {
          const res = await fetch(getApiUrl(`/api/auth/callback?code=${encodeURIComponent(code)}`), {
            method: "GET",
            credentials: "include",
          });

          if (res.ok || res.redirected) {
            if (type === "recovery") {
              window.location.replace("/reset-password");
              return;
            }
            window.location.replace("/");
            return;
          }
          console.error("[AuthCallback] Code exchange failed:", res.status);
          window.location.replace("/auth?error=code_exchange_failed");
          return;
        } catch (error) {
          console.error("[AuthCallback] Network error on code exchange:", error);
          window.location.replace("/auth?error=network");
          return;
        }
      }

      // If recovery type was specified with tokens/cookies already present
      if (type === "recovery") {
        window.location.replace("/reset-password");
        return;
      }

      // Fallback
      console.warn("[AuthCallback] No recognized auth params. Redirecting to /auth.");
      window.location.replace("/auth");
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
          Verifying Identity
        </h1>
        <p className="text-slate-400 mt-2 text-xs font-bold">Connecting to Secure Session</p>
      </motion.div>
    </div>
  );
}
