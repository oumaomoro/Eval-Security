import { useState } from "react";
import ReactDiffViewer from "react-diff-viewer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle, ShieldCheck, Copy, Bot, TrendingDown, Gauge, Landmark } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

interface RedlineViewProps {
  contractId: number;
  riskId: number;
  originalText: string;
  suggestedText: string;
  explanation: string;
  confidenceScore?: number;
  riskDelta?: number;
  jurisdictionCitation?: string;
  onComplete: () => void;
}

export function RedlineView({ 
    contractId, 
    riskId, 
    originalText, 
    suggestedText, 
    explanation, 
    confidenceScore = 98.2, 
    riskDelta = 85,
    jurisdictionCitation = "NDPR / IRA KENYA",
    onComplete 
}: RedlineViewProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isAccepting, setIsAccepting] = useState(false);

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      await fetch(`/api/risks/${riskId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ strategy: "Accepted AI redline suggestion." })
      });

      await fetch("/api/audit-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REMEDIATION_ACCEPTED",
          userId: user?.id,
          resourceType: "contract",
          resourceId: String(contractId),
          details: JSON.stringify({ riskId, contractId, action: "accepted_redline", jurisdiction: jurisdictionCitation })
        })
      });

      const blob = new Blob([suggestedText], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `remediation_${contractId}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({ title: "Redline Accepted", description: "Remediation text exported and action audit logged." });
      onComplete();
    } catch (err) {
      toast({ title: "Audit Log Failed", variant: "destructive" });
    } finally {
      setIsAccepting(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(suggestedText);
    toast({ title: "Copied", description: "Suggested text copied to clipboard." });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic leading-none">Cognitive Remediation</h3>
          <div className="flex gap-2 mt-1">
              <Badge variant="outline" className="text-[8px] font-black border-primary/40 text-primary bg-primary/5 uppercase tracking-widest px-2 py-0.5">
                  <Landmark className="w-2.5 h-2.5 mr-1" /> {jurisdictionCitation}
              </Badge>
          </div>
        </div>
        <div className="flex items-center gap-3">
            <div className="flex gap-4 mr-4">
                <div className="flex flex-col items-end">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Confidence</span>
                    <div className="flex items-center gap-2">
                        <span className="text-xl font-black text-emerald-500 italic tracking-tighter">{confidenceScore}%</span>
                        <div className="w-12 h-1.5 bg-slate-900 rounded-full overflow-hidden p-0.5">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${confidenceScore}%` }} className="h-full bg-emerald-500 rounded-full" />
                        </div>
                    </div>
                </div>
                <div className="flex flex-col items-end border-l border-slate-900 pl-4">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Risk Delta</span>
                    <div className="flex items-center gap-2">
                        <span className="text-xl font-black text-primary italic tracking-tighter">-{riskDelta}%</span>
                        <TrendingDown className="w-4 h-4 text-primary" />
                    </div>
                </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleCopy} className="bg-slate-900 border-slate-800 text-slate-400 font-black uppercase text-[10px] h-9 px-4 rounded-xl hover:bg-slate-800">
                <Copy className="w-3 h-3 mr-2" /> Copy Draft
            </Button>
        </div>
      </div>

      <Card className="bg-slate-950/80 border-slate-900 shadow-2xl rounded-3xl overflow-hidden border-b-8 border-b-primary/10">
        <CardContent className="p-0">
          <div className="bg-slate-900/30 p-8 border-b border-white/5">
             <ReactDiffViewer
                oldValue={originalText}
                newValue={suggestedText}
                splitView={true}
                useDarkTheme={true}
                styles={{
                    variables: {
                        dark: {
                            diffViewerBackground: 'transparent',
                            addedBackground: 'rgba(16, 185, 129, 0.08)',
                            addedColor: '#10b981',
                            removedBackground: 'rgba(239, 68, 68, 0.08)',
                            removedColor: '#ef4444',
                            wordAddedBackground: 'rgba(16, 185, 129, 0.15)',
                            wordRemovedBackground: 'rgba(239, 68, 68, 0.15)',
                        }
                    },
                    contentText: {
                        fontSize: '12px',
                        fontFamily: 'SFMono-Regular, Consolas, monospace',
                        fontWeight: 600,
                        lineHeight: '1.6'
                    }
                }}
             />
          </div>
          {explanation && (
            <div className="p-8 bg-slate-950/20 border-b border-white/5 relative overflow-hidden group">
                <div className="absolute -right-8 -bottom-8 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Bot className="w-48 h-48 text-primary" />
                </div>
                <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Bot className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-[10px] font-black text-primary uppercase tracking-widest">Cognitive Rationale & Jurisdictional Logic</span>
                </div>
                <p className="text-sm text-slate-400 font-bold leading-relaxed italic relative z-10 max-w-4xl">{explanation}</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="bg-slate-900/40 p-8 flex justify-between items-center bg-gradient-to-r from-slate-950/50 to-primary/5">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Self-Healing Active</span>
                    <p className="text-[10px] text-slate-500 font-bold italic uppercase tracking-tight">Applying this fix will mitigate identified high-level risks.</p>
                </div>
            </div>
            <div className="flex gap-4">
                <Button 
                    variant="ghost" 
                    onClick={onComplete}
                    className="text-slate-500 font-black uppercase tracking-tighter italic h-12 rounded-xl hover:bg-slate-900 px-6"
                >
                    <XCircle className="w-4 h-4 mr-2 text-red-500" /> Discard
                </Button>
                <Button 
                    onClick={handleAccept}
                    disabled={isAccepting}
                    className="bg-emerald-500 hover:bg-emerald-600 text-emerald-950 font-black uppercase tracking-tighter italic h-12 px-10 rounded-2xl shadow-2xl shadow-emerald-500/20 active:scale-95 transition-all"
                >
                    {isAccepting ? <Loader2 className="w-5 h-5 animate-spin mr-3" /> : <CheckCircle2 className="w-5 h-5 mr-3" />}
                    Accept & Commit to Ledger
                </Button>
            </div>
        </CardFooter>
      </Card>
    </div>
  );
}
