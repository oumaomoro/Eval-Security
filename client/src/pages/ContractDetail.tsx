import { useRoute, Link } from "wouter";
import { Layout } from "@/components/Layout";
import { useContract, useAnalyzeContract } from "@/hooks/use-contracts";
import { useRisks } from "@/hooks/use-risks";
import { useAuth } from "@/hooks/use-auth";
import { ComparisonView } from "@/components/Intelligence/ComparisonView";
import { MarketBenchmark } from "@/components/Intelligence/MarketBenchmark";
import CommentSidebar from "@/components/Intelligence/CommentSidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, ArrowLeft, Bot, ShieldCheck, AlertTriangle, FileText, MessageSquare, Send, Brain, Shield, PenTool } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/StatusBadge";
import { RedlineView } from "@/components/Intelligence/RedlineView";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { RedlineSuggestion } from "@/components/RedlineSuggestion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { SignNowModal } from "@/components/SignNowModal";
import { motion } from "framer-motion";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { getApiUrl } from "@/lib/api-config";
import { useContractVersions } from "@/hooks/use-contract-versions";
import { History as HistoryIcon, Clock } from "lucide-react";
import { format } from "date-fns";

export default function ContractDetail() {
  const [match, params] = useRoute("/contracts/:id");
  const id = parseInt(params?.id || "0");
  const { user } = useAuth();
  const { data: contract, isLoading } = useContract(id);
  const { data: risks } = useRisks({ contractId: String(id) });
  const { data: versions } = useContractVersions(id);
  const { mutate: analyze, isPending: isAnalyzing } = useAnalyzeContract();
  const { toast } = useToast();

  // SignNow State
  const [isSignNowModalOpen, setIsSignNowModalOpen] = useState(false);
  const [signNowUrl, setSignNowUrl] = useState<string | null>(null);
  const [isInitiatingSignNow, setIsInitiatingSignNow] = useState(false);
  const [activeRedline, setActiveRedline] = useState<{ 
    riskId: number, 
    original: string, 
    suggested: string, 
    explanation: string,
    confidenceScore?: number,
    riskDelta?: number,
    jurisdictionCitation?: string
  } | null>(null);

  const handleRemediate = async (risk: any) => {
    try {      const res = await fetch(getApiUrl(`/api/contracts/${id}/remediate`), {
        method: "POST",
        credentials: "include",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          riskId: risk.id, 
          originalText: risk.riskDescription
        })
      });
      const data = await res.json();
      setActiveRedline({
        riskId: risk.id,
        original: risk.riskDescription,
        suggested: data.suggestedText,
        explanation: data.explanation || "No explanation provided.",
        confidenceScore: data.confidenceScore,
        riskDelta: data.riskDelta,
        jurisdictionCitation: data.jurisdictionCitation
      });
    } catch (e) {
      toast({ title: "Remediation Failed", variant: "destructive" });
    }
  };



  const handleRequestSignature = async () => {
    try {
      setIsInitiatingSignNow(true);      const res = await fetch(getApiUrl("/api/signnow/embedded"), {
        method: "POST",
        credentials: "include",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ contractId: id, signerEmail: user?.email })
      });
      
      if (!res.ok) throw new Error("Signature gateway unavailable");
      
      const session = await res.json();
      setSignNowUrl(session.signingUrl);
      setIsSignNowModalOpen(true);
      
      toast({
        title: "Signature Session Ready",
        description: "Secure enterprise gateway initialized successfully.",
      });
    } catch (err: any) {
      toast({
        title: "Gateway Error",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setIsInitiatingSignNow(false);
    }
  };

  const { data: suggestions, isLoading: loadingSugs } = useQuery<any[]>({
    queryKey: ["/api/contracts", id, "redlines"],
    queryFn: async () => {
      const res = await fetch(`/api/contracts/${id}/redlines`);
      if (!res.ok) return [];
      return res.json();
    }
  });

  const applyPlaybooksMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/contracts/${id}/apply-playbooks`, { method: "POST" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts", id, "redlines"] });
      toast({ title: "Rules Applied", description: "Playbook rules evaluated successfully." });
    },
    onError: (err: any) => {
      toast({ title: "Failed to apply rules", description: err.message, variant: "destructive" });
    }
  });

  if (isLoading) return <Layout><div>Loading...</div></Layout>;
  if (!contract) return <Layout><div>Contract not found</div></Layout>;

  return (
    <Layout>
      <Dialog open={!!activeRedline} onOpenChange={() => setActiveRedline(null)}>
        <DialogContent className="max-w-7xl bg-slate-950 border-slate-900 rounded-3xl overflow-hidden p-0">
          <div className="p-8">
            <RedlineView 
              contractId={Number(id)}
              riskId={activeRedline?.riskId || 0}
              originalText={activeRedline?.original || ""}
              suggestedText={activeRedline?.suggested || ""}
              explanation={activeRedline?.explanation || ""}
              confidenceScore={activeRedline?.confidenceScore}
              riskDelta={activeRedline?.riskDelta}
              jurisdictionCitation={activeRedline?.jurisdictionCitation}
              onComplete={() => {
                  setActiveRedline(null);
                  queryClient.invalidateQueries({ queryKey: ["/api/risks", { contractId: String(id) }] });
                  queryClient.invalidateQueries({ queryKey: ["/api/contracts", id] });
                  queryClient.invalidateQueries({ queryKey: ["/api/contracts", id, "redlines"] });
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      <div className="mb-6">
        <Link href="/contracts" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Contracts
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">{contract.vendorName}</h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-lg text-muted-foreground">{contract.productService}</span>
              <StatusBadge status={contract.status || "active"} />
            </div>
          </div>
          <div className="text-right flex flex-col items-end gap-3">
            <div>
                <div className="text-[10px] text-muted-foreground font-semibold font-black">Annual Value</div>
                <div className="text-3xl font-mono font-bold text-primary tracking-tighter">${contract.annualCost?.toLocaleString()}</div>
            </div>
            <Button 
                onClick={handleRequestSignature}
                disabled={isInitiatingSignNow || contract.status === 'signed'}
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-tighter text-xs h-10 px-6 rounded-xl border-b-4 border-emerald-700 active:border-b-0 active:translate-y-1 transition-all"
            >
                {isInitiatingSignNow ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
                {isInitiatingSignNow ? "Initializing..." : "Request Signature"}
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="w-full justify-start h-auto p-1 bg-muted/20 border border-border rounded-xl mb-8 flex-wrap">
          <TabsTrigger value="overview" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-card py-2.5 px-5 transition-all duration-300">
            <FileText className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-card py-2.5 px-5 transition-all duration-300">
            <Shield className="w-4 h-4" />
            Intelligence Analysis
          </TabsTrigger>
          <TabsTrigger value="intelligence" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-card py-2.5 px-5 transition-all duration-300">
            <Brain className="w-4 h-4" />
            Intelligence
            <Badge variant="secondary" className="ml-1 text-[10px] bg-cyan-500/20 text-cyan-500 border-cyan-500/20">PRO</Badge>
          </TabsTrigger>
          <TabsTrigger value="redline" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-card py-2.5 px-5 transition-all duration-300">
            <PenTool className="w-4 h-4" />
            Active Redline
            <Badge variant="secondary" className="ml-1 text-[10px] bg-emerald-500/20 text-emerald-500 border-emerald-500/20">βeta</Badge>
          </TabsTrigger>
          <TabsTrigger value="risks" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-card py-2.5 px-5 transition-all duration-300">
            <AlertTriangle className="w-4 h-4" />
            Risk Register
          </TabsTrigger>
          <TabsTrigger value="comments" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-card py-2.5 px-5 transition-all duration-300">
            <MessageSquare className="w-4 h-4" />
            Collaboration
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-card py-2.5 px-5 transition-all duration-300">
            <HistoryIcon className="w-4 h-4" />
            Version History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="animate-in fade-in slide-in-from-bottom-2">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-lg">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Contract Document
              </h3>
              {contract.fileUrl ? (
                <div className="aspect-[4/3] bg-muted/20 rounded-xl flex items-center justify-center border-2 border-dashed border-border">
                  <p className="text-muted-foreground">PDF Preview would render here</p>
                </div>
              ) : (
                <div className="p-12 text-center text-muted-foreground bg-muted/10 rounded-xl">No document uploaded</div>
              )}
            </div>
            <div className="bg-card border border-border rounded-2xl p-6 shadow-lg h-fit">
              <h3 className="font-bold mb-4">Key Details</h3>
              <dl className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Start Date</dt>
                  <dd className="font-mono">{contract.contractStartDate || "N/A"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Renewal Date</dt>
                  <dd className="font-mono">{contract.renewalDate || "N/A"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Term</dt>
                  <dd>{contract.contractTermMonths} Months</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Auto-Renewal</dt>
                  <dd>{contract.autoRenewal ? "Yes" : "No"}</dd>
                </div>
              </dl>

              <div className="mt-8 pt-6 border-t border-border">
                <Button
                  onClick={() => analyze(id)}
                  disabled={isAnalyzing}
                  className="w-full bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20"
                >
                  {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Bot className="w-4 h-4 mr-2" />}
                  {isAnalyzing ? "Analyzing..." : "Run Intelligence Analysis"}
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analysis" className="animate-in fade-in slide-in-from-bottom-2">
          {contract.intelligenceAnalysis ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Analysis Cards */}
              <AnalysisCard title="Key Dates Extracted" data={contract.intelligenceAnalysis.extractedDates} />
              <AnalysisCard title="SLA Metrics" data={contract.intelligenceAnalysis.slaMetrics} />
              <AnalysisCard title="Data Privacy Provisions" data={contract.intelligenceAnalysis.dataPrivacy} />
              <AnalysisCard title="Risk Flags" list={contract.intelligenceAnalysis.riskFlags} />
            </div>
          ) : (
            <div className="text-center py-20 bg-card border border-border rounded-2xl">
              <Bot className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-bold">No Analysis Yet</h3>
              <p className="text-muted-foreground mb-6">Run our Intelligence model to extract key insights.</p>
              <Button onClick={() => analyze(id)} disabled={isAnalyzing}>
                Run Analysis Now
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="risks" className="animate-in fade-in slide-in-from-bottom-2">
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="font-bold mb-6">Identified Risks</h3>
            <div className="space-y-4">
              {risks?.map((risk) => (
                <div key={risk.id} className="p-4 rounded-xl bg-background border border-border flex justify-between items-center group hover:border-primary/50 transition-colors">
                  <div>
                    <h4 className="font-bold text-foreground">{risk.riskTitle}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{risk.riskDescription}</p>
                  </div>
                    <div className="flex items-center gap-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleRemediate(risk)}
                        className="bg-slate-900 border-slate-800 text-primary font-black uppercase text-[10px] h-8 px-4 rounded-lg"
                      >
                        Remediate
                      </Button>
                      <StatusBadge status={risk.severity} type="risk" />
                      <StatusBadge status={risk.mitigationStatus} type="risk" className="opacity-70" />
                    </div>
                  </div>
              ))}
              {(!risks || risks.length === 0) && (
                <p className="text-muted-foreground text-center py-8">No risks identified yet.</p>
              )}
            </div>
          </div>
        </TabsContent>
        <TabsContent value="intelligence" className="animate-in fade-in slide-in-from-bottom-2 space-y-8">
          <MarketBenchmark contractId={id} />
          <ComparisonView contractId={id} />
        </TabsContent>
        <TabsContent value="redline" className="animate-in fade-in slide-in-from-bottom-2 flex flex-col gap-6">
          <Card className="bg-card border border-border rounded-2xl p-6">
            <h3 className="font-bold flex items-center mb-6">
               <ShieldCheck className="w-5 h-5 text-emerald-500 mr-2" />
               Automated Redline Suggestions
            </h3>
            
            {loadingSugs ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : !suggestions || suggestions.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-12">
                <PenTool className="w-12 h-12 text-primary/50 mb-4" />
                <h3 className="text-xl font-bold mb-2">Automated Rules Engine</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                  Playbook rules will trigger Intelligence-assisted redline remediation automatically when compliance deficiencies are found.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => applyPlaybooksMutation.mutate()} 
                  disabled={isAnalyzing || applyPlaybooksMutation.isPending}
                >
                  {applyPlaybooksMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <PenTool className="w-4 h-4 mr-2" />}
                  {applyPlaybooksMutation.isPending ? "Applying..." : "Run Playbook Rules"}
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {suggestions.map((s) => (
                  <RedlineSuggestion key={s.id} suggestion={{...s, contractId: id}} />
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="comments" className="animate-in fade-in slide-in-from-bottom-2 max-w-2xl mx-auto">
          <CommentSidebar contractId={id} />
        </TabsContent>

        <TabsContent value="history" className="animate-in fade-in slide-in-from-bottom-2">
          <Card className="bg-card border border-border rounded-2xl p-6">
            <h3 className="font-bold flex items-center mb-6">
               <HistoryIcon className="w-5 h-5 text-primary mr-2" />
               Contract Version History
            </h3>
            
            <div className="space-y-4">
              {versions?.map((v: any) => (
                <div key={v.id} className="p-4 rounded-xl bg-background border border-border flex justify-between items-center group hover:border-primary/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      v{v.versionNumber}
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground">{v.changesSummary || `Version ${v.versionNumber}`}</h4>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {v.createdAt ? format(new Date(v.createdAt), "MMM d, yyyy HH:mm") : "N/A"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      asChild
                      className="text-primary hover:text-primary hover:bg-primary/10"
                    >
                      <a href={v.fileUrl} target="_blank" rel="noopener noreferrer">
                        <FileText className="w-4 h-4 mr-2" />
                        View Document
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
              {(!versions || versions.length === 0) && (
                <p className="text-muted-foreground text-center py-8">No version history found.</p>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <SignNowModal 
        isOpen={isSignNowModalOpen} 
        onClose={() => setIsSignNowModalOpen(false)} 
        url={signNowUrl} 
      />
    </Layout>
  );
}

function AnalysisCard({ title, data, list }: { title: string, data?: Record<string, string>, list?: string[] }) {
  if (!data && !list) return null;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-card border border-border rounded-2xl p-6 shadow-lg hover:border-primary/30 transition-colors"
    >
      <h3 className="font-bold text-lg mb-4 text-primary">{title}</h3>
      {data && (
        <dl className="space-y-3">
          {Object.entries(data).map(([k, v]) => (
            <div key={k} className="flex justify-between border-b border-border/50 pb-2 last:border-0 last:pb-0">
              <dt className="text-sm text-muted-foreground capitalize">{k.replace(/([A-Z])/g, ' $1').trim()}</dt>
              <dd className="text-sm font-medium text-right max-w-[60%]">{v}</dd>
            </div>
          ))}
        </dl>
      )}
      {list && (
        <ul className="space-y-2">
          {list.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  );
}
