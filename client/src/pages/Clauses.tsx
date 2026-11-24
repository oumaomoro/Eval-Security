import { useState } from "react";
import { Layout } from "@/components/Layout";
import { useClauses, useGenerateClause, useCompareClauses } from "@/hooks/use-clauses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Sparkles, Copy, BookOpen, GitCompare, Scale, Check } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useToast } from "@/hooks/use-toast";
import { SEO } from "@/components/SEO";

export default function Clauses() {
  const { data: clauses, isLoading } = useClauses();

  return (
    <Layout
      header={
        <div className="flex w-full items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Scale className="w-6 h-6 text-primary" /> Clause Library
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Standard contractual clauses and compliance-ready legal templates.
            </p>
          </div>
          <Badge variant="outline" className="text-xs px-3 py-1 font-medium">
            {clauses?.length || 0} Clauses Registered
          </Badge>
        </div>
      }
    >
      <SEO title="Clause Library" description="Browse and draft standardized enterprise contractual clauses." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12 pt-2">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center mb-1">
            <h2 className="text-base font-semibold text-foreground">Standard Templates</h2>
            <span className="text-xs text-muted-foreground">{clauses?.length || 0} available</span>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : clauses?.length === 0 ? (
            <Card className="bg-card border-border p-8">
              <EmptyState 
                icon={BookOpen} 
                title="Library Empty" 
                description="Your clause library currently has no entries. Use the Clause Drafter on the right to generate standard templates."
              />
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {clauses?.map((clause) => (
                <Card key={clause.id} className="bg-card border-border hover:border-primary/40 transition-colors shadow-sm">
                  <CardHeader className="p-6 pb-3">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h3 className="font-semibold text-base text-foreground">{clause.clauseName}</h3>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs uppercase font-medium">
                            {clause.clauseCategory}
                          </Badge>
                          {clause.isMandatory && (
                            <Badge variant="destructive" className="text-xs font-medium">
                              Mandatory
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {clause.jurisdiction || 'Universal'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <ErrorBoundary>
                          <CompareClauseDialog clause={clause} />
                        </ErrorBoundary>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 pt-2 space-y-4">
                    <div className="bg-muted/30 p-4 rounded-lg border border-border text-xs font-mono text-muted-foreground leading-relaxed">
                      {clause.standardLanguage}
                    </div>
                    {clause.applicableStandards && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-medium">Standards:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {Array.isArray(clause.applicableStandards) && clause.applicableStandards.map((s: string) => (
                            <Badge key={s} variant="outline" className="text-[10px] text-muted-foreground">{s}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <ErrorBoundary>
            <ClauseDrafter />
          </ErrorBoundary>
        </div>
      </div>
    </Layout>
  );
}

function CompareClauseDialog({ clause }: { clause: any }) {
  const [open, setOpen] = useState(false);
  const [vendorClause, setVendorClause] = useState("");
  const { mutate: compare, isPending, data: result } = useCompareClauses();

  const handleCompare = () => {
    if (!vendorClause) return;
    compare({ libraryClauseId: clause.id, contractText: vendorClause });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
          <GitCompare className="w-3.5 h-3.5" /> Compare
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Compare Against Standard</DialogTitle>
          <CardDescription>
            Compare a vendor-proposed clause against "{clause.clauseName}"
          </CardDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase text-muted-foreground">Standard Language</label>
            <div className="p-3 bg-muted/40 rounded-md border border-border text-xs font-mono text-muted-foreground">
              {clause.standardLanguage}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase text-muted-foreground">Vendor Proposed Clause</label>
            <Textarea
              value={vendorClause}
              onChange={(e) => setVendorClause(e.target.value)}
              placeholder="Paste vendor clause text to analyze deviations..."
              className="min-h-[120px] bg-background border-border text-sm"
            />
          </div>

          <Button onClick={handleCompare} disabled={isPending || !vendorClause} className="w-full">
            {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <GitCompare className="w-4 h-4 mr-2" />}
            Analyze Deviation
          </Button>

          {result && (
            <div className="space-y-3 pt-3 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Similarity Score:</span>
                <span className="text-sm font-bold font-mono">{result.similarityScore}%</span>
              </div>
              {result.deviationSeverity && (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Deviation Severity:</span>
                  <Badge variant={result.deviationSeverity === "none" ? "secondary" : "destructive"} className="text-xs uppercase">
                    {result.deviationSeverity}
                  </Badge>
                </div>
              )}
              {result.riskImplications && (
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground">Risk Implications:</span>
                  <p className="text-xs text-foreground bg-muted/30 p-2.5 rounded-md border border-border">
                    {result.riskImplications}
                  </p>
                </div>
              )}
              {result.suggestedImprovements && (
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-primary">Suggested Remediation:</span>
                  <p className="text-xs text-foreground bg-primary/5 p-2.5 rounded-md border border-primary/20">
                    {result.suggestedImprovements}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ClauseDrafter() {
  const { toast } = useToast();
  const [category, setCategory] = useState("");
  const [requirements, setRequirements] = useState("");
  const [jurisdiction, setJurisdiction] = useState("KDPA");
  const { mutate: generate, isPending, data: result } = useGenerateClause();

  const handleGenerate = () => {
    generate({ category, requirements, standards: [jurisdiction] });
  };

  return (
    <Card className="bg-card border-border shadow-sm sticky top-24">
      <CardHeader className="p-6 pb-4 border-b border-border">
        <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" /> Draft New Clause
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground mt-0.5">
          Generate compliant standard language
        </CardDescription>
      </CardHeader>

      <CardContent className="p-6 space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase text-muted-foreground">Clause Category</label>
          <Input
            value={category}
            onChange={e => setCategory(e.target.value)}
            placeholder="e.g. Limitation of Liability, Incident Response"
            className="h-10 bg-background border-border text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase text-muted-foreground">Regulatory Standard</label>
          <Select value={jurisdiction} onValueChange={setJurisdiction}>
            <SelectTrigger className="h-10 bg-background border-border text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="KDPA">Kenya (KDPA)</SelectItem>
              <SelectItem value="POPIA">South Africa (POPIA)</SelectItem>
              <SelectItem value="GDPR">European Union (GDPR)</SelectItem>
              <SelectItem value="CBK">Central Bank (CBK Cyber)</SelectItem>
              <SelectItem value="ISO27001">ISO 27001</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase text-muted-foreground">Specific Requirements</label>
          <Textarea
            value={requirements}
            onChange={e => setRequirements(e.target.value)}
            placeholder="Specify key provisions, liability caps, notification timelines..."
            className="bg-background border-border min-h-[100px] text-sm"
          />
        </div>

        <Button
          onClick={handleGenerate}
          disabled={isPending || !category || !requirements}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm h-10"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
          Draft Clause
        </Button>

        {result && (
          <div className="mt-4 pt-4 border-t border-border space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Generated Language:</span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 text-xs"
                onClick={() => {
                  navigator.clipboard.writeText(result.clauseText);
                  toast({ title: "Copied", description: "Clause copied to clipboard" });
                }}
              >
                <Copy className="w-3 h-3 mr-1" /> Copy
              </Button>
            </div>
            <div className="bg-muted/40 p-3 rounded-md border border-border text-xs font-mono text-foreground leading-relaxed whitespace-pre-wrap">
              {result.clauseText}
            </div>
            {result.explanation && (
              <p className="text-xs text-muted-foreground leading-relaxed">
                {result.explanation}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
