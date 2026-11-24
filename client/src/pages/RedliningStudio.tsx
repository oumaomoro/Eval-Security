import { useState } from "react";
import { Layout } from "@/components/Layout";
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
  ShieldCheck, 
  Sparkles,
  ArrowRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SEO } from "@/components/SEO";

const CLAUSE_LIBRARY = [
  { id: 1, name: "Liability Cap ($5M)", content: "LIMITATION OF LIABILITY. In no event shall either party's aggregate liability arising out of or related to this Agreement exceed Five Million US Dollars ($5,000,000)." },
  { id: 2, name: "KDPA Processor Standard", content: "DATA PROTECTION. Processor shall implement technical and organizational measures to ensure security appropriate to the risk as per Section 25 of the KDPA 2019." },
  { id: 3, name: "Unlimited Indemnity (Security)", content: "INDEMNIFICATION. Notwithstanding any other provision, Vendor shall provide unlimited indemnification for all losses arising from a Security Incident or Data Breach." }
];

export default function RedliningStudio() {
  const { toast } = useToast();
  const [originalClause, setOriginalClause] = useState("");
  const [standardClause, setStandardClause] = useState("");
  const [instructions, setInstructions] = useState("Negotiate for balanced liability and regulatory protection.");
  const [redlinedResult, setRedlinedResult] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveResult = async () => {
    if (!redlinedResult) return;
    
    setIsSaving(true);
    try {
      const res = await fetch("/api/remediation-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clauseTitle: "Redline: " + standardClause.slice(0, 30) + "...",
          originalText: originalClause,
          suggestedText: redlinedResult,
          severity: "medium"
        })
      });
      
      if (!res.ok) throw new Error("Failed to save redline");
      toast({ title: "Redline Saved", description: "Suggestion added to remediation queue." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRedline = async () => {
    if (!originalClause || !standardClause) {
      toast({
        variant: "destructive",
        title: "Missing Content",
        description: "Please provide both the vendor proposal and target standard clauses.",
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
      if (!res.ok) throw new Error(data.message || "Failed to generate redline");
      
      setRedlinedResult(data.redlinedClause);
      toast({ 
        title: "Analysis Complete", 
        description: "Generated redlined clause based on enterprise standards." 
      });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Analysis Failed", description: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const loadFromLibrary = (content: string) => {
    setStandardClause(content);
    toast({ title: "Template Applied", description: "Loaded standard clause into target." });
  };

  return (
    <Layout
      header={
        <div className="flex w-full items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <GitCompare className="w-6 h-6 text-primary" /> Contract Redlining Studio
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Compare vendor proposals against standard clauses and generate redlined terms.
            </p>
          </div>
        </div>
      }
    >
      <SEO title="Contract Redlining Studio" description="Compare and redline vendor contracts against standard enterprise templates." />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 pb-12 pt-2">
        {/* Input Panel */}
        <div className="xl:col-span-7 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-card border-border shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-2">
                    <RotateCcw className="w-3.5 h-3.5 text-primary" />
                    Vendor Proposal Clause
                  </CardTitle>
                  <Badge variant="outline" className="text-[10px]">Vendor</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Textarea 
                  value={originalClause}
                  onChange={(e) => setOriginalClause(e.target.value)}
                  placeholder="Paste the vendor's clause here..."
                  className="min-h-[180px] bg-background border-border text-foreground resize-none"
                />
              </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    Target Standard Clause
                  </CardTitle>
                  <Badge variant="outline" className="text-[10px]">Standard</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea 
                  value={standardClause}
                  onChange={(e) => setStandardClause(e.target.value)}
                  placeholder="Paste your standard clause or select a template below..."
                  className="min-h-[130px] bg-background border-border text-foreground resize-none"
                />
                <div className="flex flex-wrap gap-2 pt-1">
                  {CLAUSE_LIBRARY.map(lib => (
                    <Button 
                      key={lib.id} 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => loadFromLibrary(lib.content)}
                      className="text-xs h-7 bg-muted hover:bg-muted/80 text-foreground font-medium px-2.5 rounded-md"
                    >
                      + {lib.name}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="flex-1 w-full space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-muted-foreground">
                    Negotiation Objective
                  </label>
                  <Textarea 
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    className="h-14 bg-background border-border text-foreground resize-none text-sm"
                    placeholder="e.g. Strengthen liability cap, add 72-hour breach notice"
                  />
                </div>
                <Button 
                  onClick={handleRedline}
                  disabled={isProcessing}
                  className="w-full md:w-48 bg-primary hover:bg-primary/90 text-primary-foreground h-14 font-semibold text-sm shadow-sm gap-2"
                >
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                  Generate Redline
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Result Panel */}
        <div className="xl:col-span-5">
          <Card className="h-full bg-card border-border shadow-sm flex flex-col min-h-[420px]">
            <CardHeader className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold text-foreground">
                    Recommended Redline
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-0.5">
                    Proposed amendment aligned with target standards
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 px-2.5 border-border" 
                    disabled={!redlinedResult}
                    onClick={() => {
                      navigator.clipboard.writeText(redlinedResult);
                      toast({ title: "Copied", description: "Clause copied to clipboard" });
                    }}
                  >
                    <Copy className="w-3.5 h-3.5 mr-1" /> Copy
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={!redlinedResult || isSaving}
                    onClick={handleSaveResult}
                    className="h-8 px-2.5 border-border"
                  >
                    {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Save className="w-3.5 h-3.5 mr-1" />} Save
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-6 relative overflow-y-auto">
              {isProcessing ? (
                <div className="h-full flex flex-col items-center justify-center gap-3 py-20 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Analyzing clauses and generating redline...</p>
                </div>
              ) : redlinedResult ? (
                <div className="text-foreground whitespace-pre-wrap leading-relaxed text-sm bg-muted/30 p-4 rounded-lg border border-border min-h-[250px] font-mono">
                  {redlinedResult}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
                  <GitCompare className="w-10 h-10 mb-3 opacity-30" />
                  <p className="text-sm font-medium">No redline generated yet</p>
                  <p className="text-xs mt-1">Enter clauses on the left and click Generate Redline.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
