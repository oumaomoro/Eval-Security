import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Zap, Copy, Save, Loader2, GitCompare, RotateCcw, BrainCircuit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

export default function RedliningStudio() {
  const { toast } = useToast();
  const [originalClause, setOriginalClause] = useState("");
  const [standardClause, setStandardClause] = useState("");
  const [instructions, setInstructions] = useState("Negotiate for better liability protection for the client.");
  const [redlinedResult, setRedlinedResult] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleRedline = async () => {
    if (!originalClause || !standardClause) {
      toast({
        variant: "destructive",
        title: "Missing Content",
        description: "Please provide both the original and standard clauses.",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch("/api/insurance/redline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ originalClause, standardLanguage: standardClause, instructions }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setRedlinedResult(data.redlinedClause);
      toast({ title: "Analysis Complete", description: "AI Redlining successfully generated." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "AI Error", description: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex bg-slate-950 min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <header className="mb-10">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-4"
          >
            <BrainCircuit className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-black text-primary uppercase tracking-widest">Autonomous Legal Agent</span>
          </motion.div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">
            AI Redline <span className="text-primary">Studio</span>
          </h1>
          <p className="text-slate-400 mt-1 font-medium tracking-tight">
            Force-negotiate contract clauses. Automatically align vendor proposals with your internal DPA or Insurance standards.
          </p>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Input Panel */}
          <div className="space-y-6">
            <Card className="bg-slate-900/50 border-slate-800/60 shadow-2xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-black uppercase text-slate-300 flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-primary" />
                  Original Clause (Vendor Input)
                </CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase text-slate-500">Paste the text from the contract document here</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea 
                  value={originalClause}
                  onChange={(e) => setOriginalClause(e.target.value)}
                  placeholder="e.g. Vendor shall not be liable for any data breach exceeding $1,000..."
                  className="min-h-[150px] bg-slate-950/50 border-slate-800 focus:border-primary/50 text-slate-200"
                />
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800/60 shadow-2xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-black uppercase text-slate-300 flex items-center gap-2">
                  <ShieldCheckIcon className="w-4 h-4 text-emerald-500" />
                  Standard Clause (Target Language)
                </CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase text-slate-500">Your preferred or mandatory legal language</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea 
                  value={standardClause}
                  onChange={(e) => setStandardClause(e.target.value)}
                  placeholder="e.g. Liability for data breaches shall be unlimited or capped at $5M..."
                  className="min-h-[150px] bg-slate-950/50 border-slate-800 focus:border-primary/50 text-slate-200"
                />
              </CardContent>
            </Card>

            <div className="flex flex-col gap-4">
               <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 mb-2 block tracking-widest">Negotiation Instructions</label>
                  <Textarea 
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    className="h-20 bg-slate-900 border-slate-800 text-slate-300"
                  />
               </div>
               <Button 
                 onClick={handleRedline}
                 disabled={isProcessing}
                 className="w-full bg-primary hover:bg-primary/90 text-slate-950 h-14 rounded-2xl font-black uppercase tracking-tighter text-base shadow-xl shadow-primary/20 gap-3"
               >
                 {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5 fill-current" />}
                 Execute AI Redlining
               </Button>
            </div>
          </div>

          {/* Result Panel */}
          <div className="relative">
            {!redlinedResult && !isProcessing && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/40 backdrop-blur-[2px] rounded-3xl border border-dashed border-slate-800/60">
                <GitCompare className="w-12 h-12 text-slate-800 mb-4" />
                <p className="text-slate-600 font-bold uppercase tracking-widest text-[10px]">Awaiting Processing</p>
              </div>
            )}

            <Card className="h-full bg-slate-900 border-primary/20 shadow-[0_0_50px_rgba(6,182,212,0.1)] flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800 pb-4">
                <div>
                   <CardTitle className="text-white text-lg font-black uppercase italic tracking-tight">Negotiated Result</CardTitle>
                   <CardDescription className="text-[10px] font-bold text-primary uppercase tracking-widest">Optimized for Corporate Protection</CardDescription>
                </div>
                <div className="flex gap-2">
                   <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-slate-800" onClick={() => {
                     navigator.clipboard.writeText(redlinedResult);
                     toast({ title: "Copied", description: "Clause copied to clipboard" });
                   }}>
                     <Copy className="w-3.5 h-3.5" />
                   </Button>
                   <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-slate-800">
                     <Save className="w-3.5 h-3.5" />
                   </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-6 relative">
                 {isProcessing ? (
                   <div className="h-full flex flex-col items-center justify-center gap-4">
                     <Loader2 className="w-12 h-12 animate-spin text-primary" />
                     <p className="text-primary text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Consulting AI Knowledge Base...</p>
                   </div>
                 ) : (
                   <div className="prose prose-invert max-w-none">
                     <div className="text-slate-300 whitespace-pre-wrap leading-relaxed font-medium">
                       {redlinedResult}
                     </div>
                   </div>
                 )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

function ShieldCheckIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
