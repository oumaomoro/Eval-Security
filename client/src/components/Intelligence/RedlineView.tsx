import { useState } from "react";
import ReactDiffViewer from "react-diff-viewer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, Download, CheckCircle2, XCircle, ShieldCheck, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

interface RedlineViewProps {
  contractId: number;
  originalText: string;
  suggestedText: string;
  onComplete: () => void;
}

export function RedlineView({ contractId, originalText, suggestedText, onComplete }: RedlineViewProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isAccepting, setIsAccepting] = useState(false);

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      // 1. Log the action to the audit ledger
      await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REMEDIATION_ACCEPTED",
          userId: user?.id,
          resourceType: "contract",
          resourceId: String(contractId),
          details: `Accepted AI redline suggestion for contract ${contractId}.`
        })
      });

      // 2. Download as .txt (as requested)
      const blob = new Blob([suggestedText], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `remediation_${contractId}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Redline Accepted",
        description: "Remediation text exported and action audit logged.",
      });
      onComplete();
    } catch (err) {
      toast({
          title: "Audit Log Failed",
          description: "Remediation was accepted but audit trail could not be secured.",
          variant: "destructive"
      });
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
        <div>
          <h3 className="text-xl font-black text-white uppercase tracking-tighter italic">AI Remediation Review</h3>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Active Cognitive Redlining</p>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy} className="bg-slate-900 border-slate-800 text-slate-400 font-black uppercase text-[10px] h-8 px-4 rounded-lg">
                <Copy className="w-3 h-3 mr-2" /> Copy Suggested
            </Button>
            <ShieldCheck className="w-5 h-5 text-emerald-500 opacity-50" />
        </div>
      </div>

      <Card className="bg-slate-950/50 border-slate-800 shadow-2xl rounded-2xl overflow-hidden border-b-4 border-b-primary/20">
        <CardContent className="p-0">
          <div className="bg-slate-900/50 p-6 border-b border-slate-800">
             <ReactDiffViewer
                oldValue={originalText}
                newValue={suggestedText}
                splitView={true}
                useDarkTheme={true}
                styles={{
                    variables: {
                        dark: {
                            diffViewerBackground: 'transparent',
                            addedBackground: 'rgba(16, 185, 129, 0.1)',
                            addedColor: '#10b981',
                            removedBackground: 'rgba(239, 68, 68, 0.1)',
                            removedColor: '#ef4444',
                            wordAddedBackground: 'rgba(16, 185, 129, 0.2)',
                            wordRemovedBackground: 'rgba(239, 68, 68, 0.2)',
                        }
                    },
                    contentText: {
                        fontSize: '11px',
                        fontFamily: 'monospace',
                        fontWeight: 600
                    }
                }}
             />
          </div>
        </CardContent>
        <CardFooter className="bg-slate-950/30 p-6 flex justify-between items-center bg-gradient-to-r from-slate-950/50 to-primary/5">
            <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Decision Hub</span>
                <p className="text-[10px] text-slate-400 font-bold italic uppercase tracking-tight">Enterprise compliance requires manual sign-off</p>
            </div>
            <div className="flex gap-3">
                <Button 
                    variant="ghost" 
                    onClick={onComplete}
                    className="text-slate-500 font-black uppercase tracking-tighter italic h-11 rounded-xl hover:bg-slate-800"
                >
                    <XCircle className="w-4 h-4 mr-2 text-red-500" /> Reject
                </Button>
                <Button 
                    onClick={handleAccept}
                    disabled={isAccepting}
                    className="bg-emerald-500 hover:bg-emerald-600 text-emerald-950 font-black uppercase tracking-tighter italic h-11 px-8 rounded-xl shadow-lg shadow-emerald-500/10"
                >
                    {isAccepting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                    Accept Redline & Export
                </Button>
            </div>
        </CardFooter>
      </Card>
    </div>
  );
}
