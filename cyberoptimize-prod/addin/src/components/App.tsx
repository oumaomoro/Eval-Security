import React, { useState } from "react";
import axios from "axios";
import { getDocumentText, insertComment } from "../utils/document";
import {
  ShieldAlert, CheckCircle, ShieldCheck, Settings,
  Zap, MessageSquarePlus, Activity, Key, Eye, EyeOff, X
} from "lucide-react";

const API_BASE =
  process.env.NODE_ENV === "production"
    ? "https://api.costloci.com"
    : "http://localhost:5000";

export function App({ isOffice }: { isOffice: boolean }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // ── API Key management ─────────────────────────────────────────────────────
  // NOTE (Phase 27): The API key is stored in localStorage for persistence
  // across MS Word sessions. A full key-generation UI in WorkspaceSettings is
  // planned for a future phase. Users can currently obtain their key from an
  // admin or from the Workspace Settings panel when that feature ships.
  const [apiKey, setApiKey] = useState<string>(
    () => localStorage.getItem("costloci_addin_api_key") || ""
  );
  const [showSettings, setShowSettings] = useState(false);
  const [keyInput, setKeyInput] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);

  const saveApiKey = () => {
    const trimmed = keyInput.trim();
    setApiKey(trimmed);
    localStorage.setItem("costloci_addin_api_key", trimmed);
    setShowSettings(false);
  };

  const clearApiKey = () => {
    setApiKey("");
    setKeyInput("");
    localStorage.removeItem("costloci_addin_api_key");
  };

  // ── Analysis ───────────────────────────────────────────────────────────────
  const analyzeDocument = async () => {
    if (!apiKey) {
      setShowSettings(true);
      setError("Please enter your Costloci API key to proceed.");
      return;
    }

    try {
      setAnalyzing(true);
      setError(null);
      setResults(null);

      const rawText = isOffice
        ? await getDocumentText()
        : "Simulated Word Document Content — KDPA data residency clause missing. Liability cap absent. Auto-renewal detected.";

      const response = await axios.post(
        `${API_BASE}/api/integrations/word/analyze`,
        { textBlock: rawText },
        { headers: { Authorization: `Bearer ${apiKey}` } }
      );

      setResults(response.data);
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        (err.response?.status === 401
          ? "Invalid or expired API key. Please update it in Settings."
          : err.message || "Analysis failed.");
      setError(msg);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleInsertComment = async (finding: any) => {
    try {
      if (!isOffice) {
        alert("Simulated: Suggestion inserted into document.");
        return;
      }
      await insertComment(
        finding.requirement,
        `[Costloci AI]: ${finding.description}`
      );
    } catch (err) {
      console.error("Failed to insert comment", err);
    }
  };

  const handlePublishClause = async (finding: any) => {
    if (!apiKey) return;
    try {
      await axios.post(
        `${API_BASE}/api/integrations/word/publish`,
        {
          clauseName: finding.requirement,
          clauseCategory: "Compliance",
          standardLanguage: finding.description,
          riskLevelIfMissing: finding.severity,
        },
        { headers: { Authorization: `Bearer ${apiKey}` } }
      );
      alert("✅ Clause synced to your Costloci Library.");
    } catch (err) {
      console.error("Publish failed", err);
      alert("❌ Failed to sync clause.");
    }
  };

  // ── Settings Panel ─────────────────────────────────────────────────────────
  if (showSettings) {
    return (
      <div className="min-h-screen bg-[#020617] text-slate-200 p-5 flex flex-col gap-5 font-sans">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            <h1 className="text-base font-black tracking-tight text-white uppercase italic">
              API Key Setup
            </h1>
          </div>
          <button
            onClick={() => setShowSettings(false)}
            className="text-slate-500 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-[11px] text-slate-400 leading-relaxed">
          Paste your Costloci API key below. You can find or generate this key
          in your{" "}
          <span className="text-primary font-bold">Workspace Settings</span> on
          the Costloci web platform.
        </p>

        <div className="relative">
          <input
            type={showKey ? "text" : "password"}
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            placeholder="sk-costloci-••••••••••••••••"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 pr-10 text-[12px] text-slate-200 placeholder-slate-600 outline-none focus:border-primary/60 transition-colors font-mono"
          />
          <button
            onClick={() => setShowKey((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
          >
            {showKey ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={saveApiKey}
            disabled={!keyInput.trim()}
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-widest italic disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Save & Connect
          </button>
          {apiKey && (
            <button
              onClick={clearApiKey}
              className="w-full text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:text-red-400 transition-colors py-1"
            >
              Clear stored key
            </button>
          )}
        </div>

        {error && (
          <div className="p-3 bg-red-950/20 border border-red-900/40 text-red-400 rounded-xl text-[11px] font-medium">
            {error}
          </div>
        )}
      </div>
    );
  }

  // ── Main Panel ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 p-4 flex flex-col gap-5 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-primary/10 rounded-lg border border-primary/30">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-lg font-black tracking-tight text-white uppercase italic">
            Costloci Hub
          </h1>
        </div>
        <button
          onClick={() => { setShowSettings(true); setKeyInput(apiKey); }}
          className={`${apiKey ? "text-emerald-500" : "text-amber-500"} hover:text-primary transition-colors`}
          title={apiKey ? "API key configured" : "Configure API key"}
        >
          {apiKey ? (
            <Key className="h-4 w-4" />
          ) : (
            <Settings className="h-4 w-4 animate-pulse" />
          )}
        </button>
      </div>

      {/* Mode banners */}
      {!isOffice && (
        <div className="bg-amber-950/20 text-amber-500 p-3 rounded-xl text-[10px] font-bold border border-amber-900/30 flex items-center gap-2">
          <Zap className="h-3 w-3" />
          SIMULATION MODE: Running outside MS Word context.
        </div>
      )}

      {!apiKey && (
        <div className="bg-slate-900/60 border border-slate-700 p-3 rounded-xl text-[11px] text-slate-400 flex items-start gap-2">
          <Key className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
          <span>
            No API key configured.{" "}
            <button
              onClick={() => { setShowSettings(true); setKeyInput(""); }}
              className="text-primary font-bold underline"
            >
              Set up now →
            </button>
          </span>
        </div>
      )}

      {/* Analyze button */}
      <div className="flex flex-col gap-3">
        <button
          onClick={analyzeDocument}
          disabled={analyzing}
          className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-xs uppercase tracking-widest italic"
        >
          {analyzing ? (
            <>
              <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Sovereign Scan...
            </>
          ) : (
            "Analyze Active Document"
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-950/20 border border-red-900/40 text-red-400 rounded-xl text-[11px] font-medium leading-relaxed">
          {error}
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Executive Scorecard */}
          <div className="bg-slate-900/50 rounded-2xl p-5 border border-slate-800 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Activity className="h-12 w-12" />
            </div>
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4 flex items-center gap-2">
              <CheckCircle className="h-3.5 w-3.5 text-primary" /> Executive
              Scorecard
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/50">
                <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">
                  Risk Index
                </p>
                <p
                  className={`text-xl font-black ${
                    results.riskScore > 60 ? "text-red-500" : "text-primary"
                  }`}
                >
                  {results.riskScore}%
                </p>
              </div>
              <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/50">
                <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">
                  Status
                </p>
                <p className="text-[11px] font-black text-white uppercase italic">
                  {results.complianceStatus || "Verified"}
                </p>
              </div>
            </div>
          </div>

          {/* Leverage Points */}
          {results.leveragePoints?.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2 px-1">
                <Zap className="h-3.5 w-3.5 text-amber-500" /> Leverage Points
              </h3>
              <div className="flex flex-col gap-2">
                {results.leveragePoints.map((point: string, idx: number) => (
                  <div
                    key={idx}
                    className="bg-amber-950/10 border border-amber-900/20 p-3 rounded-xl flex gap-3 items-start"
                  >
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0 shadow-lg shadow-amber-500/50" />
                    <p className="text-[11px] text-amber-200/80 leading-relaxed font-medium">
                      {point}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Compliance Gaps */}
          {results.findings?.length > 0 && (
            <div className="space-y-3 mb-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2 px-1">
                <ShieldAlert className="h-3.5 w-3.5 text-red-500" /> Identified
                Gaps
              </h3>
              {results.findings.map((finding: any, idx: number) => (
                <div
                  key={idx}
                  className="group bg-slate-900/30 border border-slate-800 p-4 rounded-xl hover:border-red-900/40 transition-all"
                >
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-[11px] font-bold text-white leading-tight pr-4">
                      {finding.requirement}
                    </p>
                    <span
                      className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border ${
                        finding.severity === "critical"
                          ? "bg-red-500/10 border-red-500/30 text-red-500"
                          : finding.severity === "high"
                          ? "bg-orange-500/10 border-orange-500/30 text-orange-400"
                          : "bg-amber-500/10 border-amber-500/30 text-amber-500"
                      }`}
                    >
                      {finding.severity}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mb-4 leading-relaxed">
                    {finding.description}
                  </p>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleInsertComment(finding)}
                      className="flex items-center gap-2 text-[9px] font-black uppercase text-primary hover:text-white transition-colors tracking-widest"
                    >
                      <MessageSquarePlus className="h-3.5 w-3.5" /> Insert
                    </button>
                    <button
                      onClick={() => handlePublishClause(finding)}
                      className="flex items-center gap-2 text-[9px] font-black uppercase text-slate-500 hover:text-white transition-colors tracking-widest"
                    >
                      <Activity className="h-3.5 w-3.5" /> Sync Library
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
