import { useRoute, Link } from "wouter";
import { Layout } from "@/components/Layout";
import { useContract, useAnalyzeContract } from "@/hooks/use-contracts";
import { useRisks } from "@/hooks/use-risks";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Bot, ShieldCheck, AlertTriangle, FileText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/StatusBadge";
import { motion } from "framer-motion";

export default function ContractDetail() {
  const [match, params] = useRoute("/contracts/:id");
  const id = parseInt(params?.id || "0");
  const { data: contract, isLoading } = useContract(id);
  const { data: risks } = useRisks({ contractId: String(id) });
  const { mutate: analyze, isPending: isAnalyzing } = useAnalyzeContract();

  if (isLoading) return <Layout><div>Loading...</div></Layout>;
  if (!contract) return <Layout><div>Contract not found</div></Layout>;

  return (
    <Layout>
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
          <div className="text-right">
            <div className="text-sm text-muted-foreground uppercase tracking-wide font-semibold">Annual Value</div>
            <div className="text-3xl font-mono font-bold text-primary">${contract.annualCost?.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-card border border-border p-1 rounded-xl h-auto w-full justify-start">
          <TabsTrigger value="overview" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-lg px-4 py-2 gap-2">
            <FileText className="w-4 h-4" /> Overview
          </TabsTrigger>
          <TabsTrigger value="analysis" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-lg px-4 py-2 gap-2">
            <Bot className="w-4 h-4" /> AI Analysis
          </TabsTrigger>
          <TabsTrigger value="risks" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-lg px-4 py-2 gap-2">
            <AlertTriangle className="w-4 h-4" /> Risks
            {risks && risks.length > 0 && (
              <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1">{risks.length}</span>
            )}
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
                  {isAnalyzing ? "Analyzing..." : "Run AI Analysis"}
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analysis" className="animate-in fade-in slide-in-from-bottom-2">
          {contract.aiAnalysis ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Analysis Cards */}
              <AnalysisCard title="Key Dates Extracted" data={contract.aiAnalysis.extractedDates} />
              <AnalysisCard title="SLA Metrics" data={contract.aiAnalysis.slaMetrics} />
              <AnalysisCard title="Data Privacy Provisions" data={contract.aiAnalysis.dataPrivacy} />
              <AnalysisCard title="Risk Flags" list={contract.aiAnalysis.riskFlags} />
            </div>
          ) : (
            <div className="text-center py-20 bg-card border border-border rounded-2xl">
              <Bot className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-bold">No Analysis Yet</h3>
              <p className="text-muted-foreground mb-6">Run our AI model to extract key insights.</p>
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
      </Tabs>
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
