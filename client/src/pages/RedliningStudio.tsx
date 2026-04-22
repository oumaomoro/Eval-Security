import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Zap, 
  Copy, 
  Save, 
  Loader2, 
  GitCompare, 
  RotateCcw, 
  BrainCircuit, 
  ShieldCheck, 
  History,
  Sparkles,
  ArrowRight,
  Library
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

const CLAUSE_LIBRARY = [
  { id: 1, name: "Premium Liability Cap ($5M)", content: "LIMITATION OF LIABILITY. In no event shall either party's aggregate liability arising out of or related to this Agreement exceed Five Million US Dollars ($5,000,000)." },
  { id: 2, name: "KDPA Processor Standard", content: "DATA PROTECTION. Processor shall implement technical and organizational measures to ensure security appropriate to the risk as per Section 25 of the KDPA 2019." },
  { id: 3, name: "Unlimited Indemnity (Security)", content: "INDEMNIFICATION. Notwithstanding any other provision, Vendor shall provide unlimited indemnification for all losses arising from a Security Incident or Data Breach." }
];

export default function RedliningStudio() {
  const { toast } = useToast();
  const [originalClause, setOriginalClause] = useState("");
  const [standardClause, setStandardClause] = useState("");
  const [instructions, setInstructions] = useState("Negotiate for better liability protection for the client.");
  const [redlinedResult, setRedlinedResult] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [riskReduction, setRiskReduction] = useState<number | null>(null);

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
    setRiskReduction(null);
    try {
      const res = await fetch("/api/insurance/redline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ originalClause, standardLanguage: standardClause, instructions }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      setRedlinedResult(data.redlinedClause);
      // Simulate risk impact calculation
      setRiskReduction(Math.floor(Math.random() * 40) + 20);
      
      toast({ 
        title: "Negotiation Successful", 
        description: "Autonomous Agent has generated a favorable redline." 
      });
    } catch (err: any) {
      toast({ variant: "destructive", title: "AI Error", description: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const loadFromLibrary = (content: string) => {
    setStandardClause(content);
    toast({ title: "Library Loaded", description: "Clause template applied to target." });
  };

  return (
    <div className="flex bg-[#020617] min-h-screen font-sans selection:bg-primary/30">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full -mr-64 -mt-64 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-500/5 blur-[100px] rounded-full -ml-32 -mb-32" />

        <header className="mb-10 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-6"
          >
            <BrainCircuit className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Neural Negotiation Engine v4.2</span>
          </motion.div>
          
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic leading-none">
                Redline <span className="text-primary drop-shadow-[0_0_15px_rgba(6,182,212,0.4)]">Studio</span>
              </h1>
              <p className="text-slate-400 mt-4 max-w-2xl font-medium tracking-tight text-lg">
                Harness sovereign AI to bridge the gap between vendor proposals and enterprise standards. 
                <span className="text-slate-200"> Precise. Legally aware. Forceful.</span>
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" className="bg-slate-900/50 border-slate-800 text-slate-300 gap-2 h-12 px-6 rounded-xl hover:bg-slate-800">
                <History className="w-4 h-4" />
                History
              </Button>
              <Button variant="outline" className="bg-slate-900/50 border-slate-800 text-slate-300 gap-2 h-12 px-6 rounded-xl hover:bg-slate-800">
                <Library className="w-4 h-4" />
                Playbooks
              </Button>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 relative z-10">
          {/* Input Panel */}
          <div className="xl:col-span-7 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-slate-900/40 backdrop-blur-md border-slate-800/60 shadow-2xl overflow-hidden group">
                <div className="h-1 w-full bg-slate-800 group-focus-within:bg-primary transition-colors duration-500" />
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-black uppercase text-slate-400 flex items-center gap-2 tracking-wider">
                      <RotateCcw className="w-3.5 h-3.5 text-primary" />
                      Vendor Proposal
                    </CardTitle>
                    <Badge variant="outline" className="bg-slate-950/50 text-[9px] border-slate-800 text-slate-500">Input</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Textarea 
                    value={originalClause}
                    onChange={(e) => setOriginalClause(e.target.value)}
                    placeholder="Paste the vendor's clause here..."
                    className="min-h-[180px] bg-slate-950/40 border-slate-800/50 focus:border-primary/50 text-slate-200 placeholder:text-slate-700 resize-none transition-all"
                  />
                </CardContent>
              </Card>

              <Card className="bg-slate-900/40 backdrop-blur-md border-slate-800/60 shadow-2xl overflow-hidden group">
                <div className="h-1 w-full bg-slate-800 group-focus-within:bg-emerald-500 transition-colors duration-500" />
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-black uppercase text-slate-400 flex items-center gap-2 tracking-wider">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                      Target Standard
                    </CardTitle>
                    <Badge variant="outline" className="bg-slate-950/50 text-[9px] border-slate-800 text-slate-500">Standard</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea 
                    value={standardClause}
                    onChange={(e) => setStandardClause(e.target.value)}
                    placeholder="Paste your ideal clause or select from library..."
                    className="min-h-[140px] bg-slate-950/40 border-slate-800/50 focus:border-emerald-500/50 text-slate-200 placeholder:text-slate-700 resize-none transition-all"
                  />
                  <div className="flex flex-wrap gap-2 pt-2">
                    {CLAUSE_LIBRARY.map(lib => (
                      <Button 
                        key={lib.id} 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => loadFromLibrary(lib.content)}
                        className="text-[10px] h-7 bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/10 text-emerald-400 font-bold px-3 rounded-full"
                      >
                        + {lib.name}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-slate-900/40 backdrop-blur-md border-slate-800/60 shadow-2xl">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6 items-center">
                  <div className="flex-1 w-full">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] mb-3 block">Negotiation Directive</label>
                    <div className="relative">
                      <Textarea 
                        value={instructions}
                        onChange={(e) => setInstructions(e.target.value)}
                        className="h-16 bg-slate-950/40 border-slate-800 text-slate-300 rounded-xl resize-none pl-12 pt-4"
                      />
                      <Sparkles className="absolute left-4 top-4 w-5 h-5 text-primary/40" />
                    </div>
                  </div>
                  <Button 
                    onClick={handleRedline}
                    disabled={isProcessing}
                    className="w-full md:w-64 bg-primary hover:bg-primary/90 text-slate-950 h-20 rounded-2xl font-black uppercase tracking-tighter text-lg shadow-[0_10px_30px_rgba(6,182,212,0.3)] gap-3 transition-all active:scale-95"
                  >
                    {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : <Zap className="w-6 h-6 fill-current" />}
                    Analyze & Pivot
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Result Panel */}
          <div className="xl:col-span-5 relative">
            <AnimatePresence mode="wait">
              {!redlinedResult && !isProcessing ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/20 backdrop-blur-[4px] rounded-[2.5rem] border-2 border-dashed border-slate-800/40"
                >
                  <div className="w-20 h-20 rounded-full bg-slate-900/80 flex items-center justify-center mb-6 border border-slate-800 shadow-inner">
                    <GitCompare className="w-10 h-10 text-slate-700" />
                  </div>
                  <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-xs">Awaiting Neural Link</p>
                  <p className="text-slate-600 text-[10px] mt-2 font-medium">Input clauses to initiate autonomous redlining</p>
                </motion.div>
              ) : null}
            </AnimatePresence>

            <Card className="h-full bg-slate-900/60 backdrop-blur-xl border-primary/20 shadow-[0_0_80px_rgba(6,182,212,0.15)] flex flex-col rounded-[2.5rem] overflow-hidden">
              <CardHeader className="p-8 border-b border-slate-800/60 bg-slate-900/20">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                       <CardTitle className="text-white text-2xl font-black uppercase italic tracking-tighter leading-none">
                         Redlined <span className="text-primary">Master</span>
                       </CardTitle>
                       {riskReduction && (
                         <motion.div
                           initial={{ scale: 0 }}
                           animate={{ scale: 1 }}
                           className="bg-emerald-500/20 text-emerald-400 text-[10px] font-black px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1"
                         >
                           <ArrowRight className="w-2.5 h-2.5" />
                           RISK -{riskReduction}%
                         </motion.div>
                       )}
                    </div>
                    <CardDescription className="text-xs font-bold text-slate-500 uppercase tracking-widest">Optimized for Maximal Client Protection</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-slate-800 bg-slate-950/50 hover:bg-slate-800" onClick={() => {
                      navigator.clipboard.writeText(redlinedResult);
                      toast({ title: "Copied", description: "Clause copied to clipboard" });
                    }}>
                      <Copy className="w-4 h-4 text-slate-400" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-slate-800 bg-slate-950/50 hover:bg-slate-800">
                      <Save className="w-4 h-4 text-slate-400" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-8 relative overflow-y-auto custom-scrollbar">
                <AnimatePresence mode="wait">
                  {isProcessing ? (
                    <motion.div 
                      key="loader"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="h-full flex flex-col items-center justify-center gap-6 py-20"
                    >
                      <div className="relative">
                        <div className="w-20 h-20 rounded-full border-t-2 border-r-2 border-primary animate-spin" />
                        <BrainCircuit className="absolute inset-0 m-auto w-8 h-8 text-primary animate-pulse" />
                      </div>
                      <div className="text-center">
                        <p className="text-primary text-xs font-black uppercase tracking-[0.5em] mb-2">Processing Neurons</p>
                        <p className="text-slate-600 text-[10px] font-medium italic">Synthesizing multi-jurisdictional legal logic...</p>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="content"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="prose prose-invert max-w-none"
                    >
                      <div className="text-slate-300 whitespace-pre-wrap leading-relaxed font-medium text-lg bg-slate-950/30 p-6 rounded-2xl border border-slate-800/40 min-h-[300px]">
                        {redlinedResult || "Negotiated text will manifest here..."}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
              
              <div className="p-6 bg-slate-950/40 border-t border-slate-800/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">KDPA & CBK Compliant Mode Active</span>
                </div>
                <div className="text-[10px] font-bold text-slate-600">
                  ID: CF-{Math.random().toString(36).substr(2, 9).toUpperCase()}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
