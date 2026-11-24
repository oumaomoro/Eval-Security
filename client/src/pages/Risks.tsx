import { Layout } from "@/components/Layout";
import { useRisks } from "@/hooks/use-risks";
import { 
  ShieldAlert, 
  Target, 
  TrendingDown, 
  AlertTriangle, 
  ChevronRight, 
  DollarSign, 
  Activity,
  Layers,
  FileCheck
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { RiskMatrix } from "@/components/RiskMatrix";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SEO } from "@/components/SEO";
import { Loader2 } from "lucide-react";

export default function Risks() {
  const { data: risks, isLoading } = useRisks();

  const totalExposure = risks?.reduce((sum, r) => {
    return sum + (Number(r.financialExposureMax) || 0);
  }, 0) || 0;

  const criticalCount = risks?.filter(r => r.severity === 'critical').length || 0;
  const highCount = risks?.filter(r => r.severity === 'high').length || 0;

  return (
    <Layout
      header={
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-primary" /> Risk Register
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track, assess, and mitigate contractual and cybersecurity risks.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Card className="bg-card border-border px-4 py-2 shadow-sm">
              <span className="text-xs text-muted-foreground block font-medium">Total Financial Exposure</span>
              <span className="text-lg font-bold text-foreground font-mono">
                ${totalExposure.toLocaleString()}
              </span>
            </Card>
          </div>
        </div>
      }
    >
      <SEO title="Risk Register" description="Monitor and mitigate enterprise compliance and cybersecurity contract risks." />
      
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading risk assessments...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-12 pt-2">
          {/* Left Side: Risk Matrix & Severity Summary */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="bg-card border-border shadow-sm">
              <CardHeader className="p-6 pb-3">
                <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" /> Risk Matrix
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Likelihood vs. impact distribution
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-2">
                <div className="p-3 bg-muted/30 rounded-lg border border-border">
                  <ErrorBoundary>
                    <RiskMatrix risks={risks || []} />
                  </ErrorBoundary>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-sm">
              <CardHeader className="p-6 pb-3">
                <CardTitle className="text-base font-semibold text-foreground">
                  Severity Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-2 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                    <span className="text-xs font-semibold text-red-400 uppercase block">Critical</span>
                    <span className="text-2xl font-bold text-red-400 font-mono mt-1 block">{criticalCount}</span>
                  </div>
                  <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <span className="text-xs font-semibold text-amber-400 uppercase block">High</span>
                    <span className="text-2xl font-bold text-amber-400 font-mono mt-1 block">{highCount}</span>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-muted/40 border border-border">
                  <span className="text-xs font-medium text-muted-foreground block">Cumulative Maximum Exposure</span>
                  <span className="text-xl font-bold text-foreground font-mono mt-1 block">
                    ${totalExposure.toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Side: Risk Feed */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" /> Identified Risks
              </h2>
              <Badge variant="outline" className="text-xs">
                {risks?.length || 0} Total Risks
              </Badge>
            </div>
            
            {risks?.length === 0 ? (
              <Card className="bg-card border-border p-8">
                <EmptyState 
                  icon={ShieldAlert} 
                  title="No Risks Detected" 
                  description="All evaluated contracts align with configured compliance and risk thresholds."
                />
              </Card>
            ) : (
              <div className="space-y-4">
                {risks?.map((risk) => (
                  <Card key={risk.id} className="bg-card border-border hover:border-primary/40 transition-colors shadow-sm">
                    <CardContent className="p-6 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className={`p-2.5 rounded-lg border shrink-0 ${
                            risk.severity === 'critical' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                            risk.severity === 'high' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                            'bg-blue-500/10 border-blue-500/20 text-blue-400'
                          }`}>
                            <AlertTriangle className="w-5 h-5" />
                          </div>
                          <div className="space-y-1">
                            <h3 className="font-semibold text-base text-foreground">{risk.riskTitle}</h3>
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="secondary" className="text-xs uppercase">
                                {risk.riskCategory || "General"}
                              </Badge>
                              <Badge variant={risk.severity === "critical" ? "destructive" : "outline"} className="text-xs uppercase">
                                {risk.severity} Severity
                              </Badge>
                              {risk.contractId && (
                                <span className="text-xs text-muted-foreground">Contract #{risk.contractId}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2">
                          <StatusBadge status={risk.mitigationStatus || "identified"} type="risk" />
                          {risk.financialExposureMax && (
                            <span className="text-xs font-mono text-muted-foreground">
                              ${Number(risk.financialExposureMax).toLocaleString()} exposure
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {risk.riskDescription}
                      </p>

                      {risk.mitigationStrategies && (
                        <div className="bg-muted/30 rounded-lg p-3.5 border border-border space-y-1">
                          <span className="text-xs font-semibold text-primary block">Recommended Mitigation Strategy</span>
                          <p className="text-xs text-foreground leading-relaxed">
                            {typeof risk.mitigationStrategies?.[0] === 'string' 
                              ? risk.mitigationStrategies[0] 
                              : (risk.mitigationStrategies?.[0] as any)?.strategy || "Review terms with legal team."}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}
