import React, { useState } from "react";
import axios from "axios";
import { getDocumentText, insertComment } from "../utils/document";
import { ShieldAlert, CheckCircle, ShieldCheck, Settings, Zap, MessageSquarePlus, Activity } from "lucide-react";

export function App({ isOffice }: { isOffice: boolean }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const API_ENDPOINT = process.env.NODE_ENV === "production" 
    ? "https://api.costloci.com/api/integrations/word/analyze"
    : "http://localhost:5000/api/integrations/word/analyze";

  const analyzeDocument = async () => {
    try {
      setAnalyzing(true);
      setError(null);
      setResults(null);

      const rawText = isOffice ? await getDocumentText() : "Simulated Word Document Content (Running outside MS Word).";

      const response = await axios.post(
        API_ENDPOINT,
        { textBlock: rawText },
        { headers: { "Authorization": `Bearer dev-addin-api-key-1234` } }
      );

      setResults(response.data);
    } catch (err: any) {
       console.error(err);
       setError(err.response?.data?.message || err.message || "Analysis failed.");
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
      // Attempt to find relevant text and insert comment (or just insert at selection if possible)
      // For now, we use a simple placeholder if specific text mapping isn't returned
      await insertComment(finding.requirement, `[Costloci AI Suggestion]: ${finding.description}`);
    } catch (err) {
      console.error("Failed to insert comment", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 p-4 flex flex-col gap-5 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-primary/10 rounded-lg border border-primary/30">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-lg font-black tracking-tight text-white uppercase italic">Costloci Hub</h1>
        </div>
        <Settings className="h-4 w-4 text-slate-500 cursor-pointer hover:text-primary transition-colors" />
      </div>

      {!isOffice && (
         <div className="bg-amber-950/20 text-amber-500 p-3 rounded-xl text-[10px] font-bold border border-amber-900/30 flex items-center gap-2">
            <Zap className="h-3 w-3" />
            SIMULATION MODE: Running outside MS Word context.
         </div>
      )}

      {/* Main Analysis Engine Button */}
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

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-950/20 border border-red-900/40 text-red-400 rounded-xl text-[11px] font-medium leading-relaxed">
           {error}
        </div>
      )}

      {/* Live Results Stream */}
      {results && (
        <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
           {/* Executive Scorecard */}
           <div className="bg-slate-900/50 rounded-2xl p-5 border border-slate-800 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Activity className="h-12 w-12" />
              </div>
              
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4 flex items-center gap-2">
                 <CheckCircle className="h-3.5 w-3.5 text-primary" /> Executive Scorecard
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/50">
                  <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">Risk Index</p>
                  <p className={`text-xl font-black ${results.riskScore > 60 ? 'text-red-500' : 'text-primary'}`}>
                    {results.riskScore}%
                  </p>
                </div>
                <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/50">
                  <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">Status</p>
                  <p className="text-[11px] font-black text-white uppercase italic">
                    {results.complianceStatus || "Verified"}
                  </p>
                </div>
              </div>
           </div>

           {/* Strategic Leverage Points */}
           {results.leveragePoints && results.leveragePoints.length > 0 && (
              <div className="space-y-3">
                 <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2 px-1">
                    <Zap className="h-3.5 w-3.5 text-amber-500" /> Leverage Points
                 </h3>
                 <div className="flex flex-col gap-2">
                    {results.leveragePoints.map((point: string, idx: number) => (
                      <div key={idx} className="bg-amber-950/10 border border-amber-900/20 p-3 rounded-xl flex gap-3 items-start">
                        <div className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0 shadow-lg shadow-amber-500/50" />
                        <p className="text-[11px] text-amber-200/80 leading-relaxed font-medium">{point}</p>
                      </div>
                    ))}
                 </div>
              </div>
           )}

           {/* Compliance Gaps (Direct Action) */}
           {results.findings && results.findings.length > 0 && (
              <div className="space-y-3 mb-4">
                 <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2 px-1">
                    <ShieldAlert className="h-3.5 w-3.5 text-red-500" /> Identified Gaps
                 </h3>
                 {results.findings.map((finding: any, idx: number) => (
                   <div key={idx} className="group bg-slate-900/30 border border-slate-800 p-4 rounded-xl hover:border-red-900/40 transition-all">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-[11px] font-bold text-white leading-tight pr-4">{finding.requirement}</p>
                        <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border ${
                          finding.severity === 'critical' ? 'bg-red-500/10 border-red-500/30 text-red-500' : 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                        }`}>
                          {finding.severity}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mb-4 leading-relaxed">{finding.description}</p>
                      
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

  async function handlePublishClause(finding: any) {
    try {
      const PUBLISH_ENDPOINT = process.env.NODE_ENV === "production" 
        ? "https://api.costloci.com/api/integrations/word/publish"
        : "http://localhost:5000/api/integrations/word/publish";

      await axios.post(
        PUBLISH_ENDPOINT,
        {
          clauseName: finding.requirement,
          clauseCategory: "Compliance",
          standardLanguage: finding.description,
          riskLevelIfMissing: finding.severity,
        },
        { headers: { "Authorization": `Bearer dev-addin-api-key-1234` } }
      );
      alert("✅ Clause successfully synced to Costloci Library.");
    } catch (err) {
      console.error("Failed to publish clause", err);
      alert("❌ Failed to sync to library.");
    }
  }
}
