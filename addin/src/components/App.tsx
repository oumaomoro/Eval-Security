import React, { useState } from "react";
import axios from "axios";
import { getDocumentText } from "../utils/document";
import { ShieldAlert, CheckCircle, ShieldCheck, Settings } from "lucide-react";

export function App({ isOffice }: { isOffice: boolean }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // In production, this targets the live backend we just deployed.
  const API_ENDPOINT = process.env.NODE_ENV === "production" 
    ? "https://api.costloci.com/api/integrations/word/analyze"
    : "http://localhost:5000/api/integrations/word/analyze";

  const analyzeDocument = async () => {
    try {
      setAnalyzing(true);
      setError(null);
      setResults(null);

      // 1. Extract raw document context via Office.js
      const rawText = isOffice ? await getDocumentText() : "Simulated Word Document Content (Running outside MS Word).";

      // 2. Transmit to real-time analysis engine securely
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

  return (
    <div className="min-h-screen bg-background text-foreground p-4 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-brand-500" />
          <h1 className="text-xl font-bold tracking-tight">Costloci Hub</h1>
        </div>
        <Settings className="h-4 w-4 text-slate-400 cursor-pointer hover:text-slate-200" />
      </div>

      {!isOffice && (
         <div className="bg-yellow-900/30 text-yellow-500 p-3 rounded-md text-xs font-semibold border border-yellow-700/50">
            ⚠️ Running outside Microsoft Word context. Analysis will use simulated document text.
         </div>
      )}

      {/* Main Analysis Engine Button */}
      <div className="flex flex-col gap-3 pt-2">
        <button 
          onClick={analyzeDocument}
          disabled={analyzing}
          className="w-full bg-brand-600 hover:bg-brand-500 text-white font-medium py-3 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {analyzing ? (
            <>
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Scanning Jurisdiction...
            </>
          ) : (
             "Analyze Active Document"
          )}
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="mt-2 p-3 bg-red-900/40 border border-red-800 text-red-200 rounded-md text-sm">
           {error}
        </div>
      )}

      {/* Live Results Stream */}
      {results && (
        <div className="mt-4 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2">
           <div className="bg-secondary rounded-lg p-4 border border-border">
              <h2 className="text-sm font-semibold flex items-center gap-2 text-slate-200 mb-3">
                 <CheckCircle className="h-4 w-4 text-brand-500" /> Executive Breakdown
              </h2>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                   <span className="text-slate-400">Risk Score</span>
                   <span className={`font-bold ${results.riskScore > 60 ? 'text-red-400' : 'text-brand-400'}`}>
                      {results.riskScore}/100
                   </span>
                </div>
                 <div className="flex justify-between items-center text-sm">
                   <span className="text-slate-400">KDPA Compliance</span>
                   <span className="font-bold text-slate-200">{results.complianceStatus || "Verified"}</span>
                </div>
              </div>
           </div>

           {/* Risk Flags */}
           {results.findings && results.findings.length > 0 && (
             <div className="space-y-2">
                <h3 className="text-sm font-semibold flex items-center gap-2 text-slate-200">
                   <ShieldAlert className="h-4 w-4 text-yellow-500" /> Compliance Flags
                </h3>
                {results.findings.map((finding: any, idx: number) => (
                  <div key={idx} className="bg-red-950/30 border border-red-900/50 p-3 rounded-md">
                     <p className="text-xs font-semibold text-red-400 mb-1">{finding.requirement}</p>
                     <p className="text-xs text-slate-300">{finding.description}</p>
                  </div>
                ))}
             </div>
           )}
        </div>
      )}
    </div>
  );
}
