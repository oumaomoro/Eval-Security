import { useState, lazy, Suspense } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  ShieldCheck, 
  Upload, 
  FileText, 
  ArrowRightLeft, 
  AlertTriangle, 
  History,
  Info,
  ChevronRight,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
const ReactDiffViewer = lazy(() => import('react-diff-viewer'));
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ReactDiffViewerSkeleton } from "@/components/ReactDiffViewerSkeleton";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Removed local ErrorBoundary implementation

export default function CyberInsurance() {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedPolicies, setSelectedPolicies] = useState<number[]>([]);
  const [comparisonData, setComparisonData] = useState<any>(null);

  // 1. Fetch Policies
  const { data: policies, isLoading } = useQuery({
    queryKey: ["/api/insurance/policies"],
    queryFn: async () => {
      // Temporary fallback until list endpoint is verified
      const res = await fetch("/api/insurance/list");
      if (!res.ok) return [];
      return res.json();
    }
  });

  // 2. Upload Mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await apiRequest("POST", "/api/insurance/upload", formData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/insurance/policies"] });
      toast({ title: "Policy Uploaded", description: "Intelligence has successfully extracted coverage details." });
      setIsUploading(false);
    },
    onError: (err: any) => {
      toast({ title: "Upload Failed", description: err.message, variant: "destructive" });
      setIsUploading(false);
    }
  });

  // 3. Comparison Mutation
  const compareMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/insurance/compare", {
        policyIdA: selectedPolicies[0],
        policyIdB: selectedPolicies[1]
      });
      return res.json();
    },
    onSuccess: (data) => {
      setComparisonData(data);
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setIsUploading(true);
      uploadMutation.mutate(e.target.files[0]);
    }
  };

  const togglePolicySelection = (id: number) => {
    setSelectedPolicies(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id].slice(-2)
    );
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Cyber Insurance Portfolio
          </h1>
          <p className="text-muted-foreground mt-2">
            Extract coverage limits, analyze claim risk, and identify policy deltas.
          </p>
        </div>
        
        <div className="flex gap-4">
          <Input 
            type="file" 
            id="insurance-upload" 
            className="hidden" 
            onChange={handleFileChange} 
            accept=".pdf,.docx"
          />
          <Label htmlFor="insurance-upload" className="cursor-pointer">
            <Button disabled={isUploading} asChild>
              <span>
                {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                Ingest New Policy
              </span>
            </Button>
          </Label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center">
              <ShieldCheck className="mr-2 h-4 w-4 text-emerald-400" />
              Active Policies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{policies?.length || 0}</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center">
              <AlertTriangle className="mr-2 h-4 w-4 text-amber-400" />
              Aggregate Coverage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$12.5M</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center">
              <History className="mr-2 h-4 w-4 text-blue-400" />
              Next Renewal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">14 Days</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="inventory" className="w-full">
        <TabsList className="grid w-[400px] grid-cols-2 bg-slate-900 border border-slate-800">
          <TabsTrigger value="inventory">Policy Inventory</TabsTrigger>
          <TabsTrigger value="comparison" disabled={selectedPolicies.length < 2}>
            Comparison Hub ({selectedPolicies.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {policies?.map((policy: any) => (
              <Card key={policy.id} className={`group cursor-pointer border-slate-800 transition-all hover:border-blue-500/50 ${selectedPolicies.includes(policy.id) ? 'border-primary bg-primary/5' : 'bg-slate-900/50'}`} onClick={() => togglePolicySelection(policy.id)}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{policy.carrierName}</CardTitle>
                    <CardDescription>Policy #{policy.policyNumber}</CardDescription>
                  </div>
                  <ErrorBoundary>
                    <Badge variant={policy.claimRiskScore > 70 ? "destructive" : "secondary"}>
                      Risk Score: {policy.claimRiskScore}
                    </Badge>
                  </ErrorBoundary>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground uppercase">Agg Limit</span>
                      <p className="text-sm font-medium">{policy.coverageLimits?.annualAggregate || "n/a"}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground uppercase">Retention</span>
                      <p className="text-sm font-medium">{policy.deductibles?.amount || "n/a"}</p>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full">
                          <FileText className="mr-2 h-3 w-3" />
                          Full Intelligence Analysis
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl bg-slate-950 border-slate-800">
                        <DialogHeader>
                          <DialogTitle>Intelligence Policy Extraction: {policy.carrierName}</DialogTitle>
                        </DialogHeader>
                        <div className="grid grid-cols-2 gap-8 py-4">
                          <div className="space-y-4">
                            <h3 className="font-semibold text-blue-400">Coverage Sub-limits</h3>
                            <div className="space-y-2">
                              {Object.entries(policy.coverageLimits || {}).map(([key, val]: any) => (
                                <div key={key} className="flex justify-between text-sm border-b border-slate-800 pb-1">
                                  <span className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                                  <span className="font-medium text-slate-200">{val}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-4">
                            <h3 className="font-semibold text-amber-400">Exclusions & Flags</h3>
                            <ul className="space-y-2">
                              {policy.exclusions?.map((ex: string, i: number) => (
                                <li key={i} className="text-sm flex items-start gap-2">
                                  <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                                  <span className="text-slate-300">{ex}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                        <div className="mt-4 p-4 rounded bg-slate-900 border border-slate-800">
                          <h4 className="flex items-center text-sm font-semibold text-emerald-400 mb-2">
                            <Info className="mr-2 h-4 w-4" /> Intelligence Strategic Insight
                          </h4>
                          <p className="text-sm text-slate-300 italic">{policy.intelligenceAnalysisSummary}</p>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="comparison" className="mt-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold flex items-center">
              <ArrowRightLeft className="mr-2 h-5 w-5 text-primary" />
              Policy Delta Analysis
            </h2>
            <Button onClick={() => compareMutation.mutate()} disabled={compareMutation.isPending}>
              {compareMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Run Comparison Analysis"}
            </Button>
          </div>

          {comparisonData && (
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle>Side-by-Side Coverage Mapping</CardTitle>
              </CardHeader>
              <CardContent>
                 <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: comparisonData.comparisonSummary }} />
                 <div className="mt-8">
                   <h3 className="text-sm font-medium mb-4 text-muted-foreground uppercase">Extraction Comparison</h3>
                   <Suspense fallback={<ReactDiffViewerSkeleton />}>
                     <ReactDiffViewer
                        oldValue={JSON.stringify(comparisonData.policyA.coverageLimits, null, 2)}
                        newValue={JSON.stringify(comparisonData.policyB.coverageLimits, null, 2)}
                        splitView={true}
                        leftTitle={comparisonData.policyA.carrierName}
                        rightTitle={comparisonData.policyB.carrierName}
                        styles={{
                           variables: {
                              dark: {
                                 addedBackground: '#064e3b',
                                 removedBackground: '#7f1d1d',
                              }
                           }
                        }}
                     />
                   </Suspense>
                 </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

