import { Layout } from "@/components/Layout";
import { useRisks } from "@/hooks/use-risks";
import { RiskMatrix } from "@/components/RiskMatrix";
import { StatusBadge } from "@/components/StatusBadge";
import { ShieldAlert } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { SEO } from "@/components/SEO";

export default function Risks() {
  const { data: risks, isLoading } = useRisks();

  return (
    <Layout header={
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Risk Register</h1>
        <p className="text-xs text-muted-foreground mt-1">Enterprise risk registry and mitigation status.</p>
      </div>
    }>
      <SEO title="Enterprise Risk Registry" description="Monitor and mitigate enterprise compliance and cybersecurity risks with Costloci Intelligence." />
      {isLoading ? <div>Loading...</div> : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Matrix */}
          <div className="lg:col-span-1">
            <RiskMatrix risks={risks || []} />
            <div className="mt-6 bg-card border border-border p-6 rounded-2xl">
              <h3 className="font-bold mb-4">Risk Summary</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Critical Risks</span>
                  <span className="text-lg font-bold text-red-500">{risks?.filter(r => r.severity === 'critical').length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">High Risks</span>
                  <span className="text-lg font-bold text-orange-500">{risks?.filter(r => r.severity === 'high').length}</span>
                </div>
                <div className="h-px bg-border my-2" />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-foreground font-medium">Total Exposure</span>
                  <span className="text-lg font-mono font-bold">$1.2M</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: List */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-bold">Active Risks</h2>
            {risks?.length === 0 ? (
              <div className="pt-12">
                <EmptyState 
                  icon={ShieldAlert} 
                  title="Zero Active Risks" 
                  description="Your enterprise compliance posture is currently optimal. No critical vulnerabilities or compliance gaps detected across your managed contracts."
                />
              </div>
            ) : (
              risks?.map((risk) => (
                <div key={risk.id} className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        risk.severity === 'critical' ? 'bg-red-500/20 text-red-500' :
                        risk.severity === 'high' ? 'bg-orange-500/20 text-orange-500' :
                        'bg-yellow-500/20 text-yellow-500'
                      }`}>
                        <ShieldAlert className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{risk.riskTitle}</h3>
                        <p className="text-sm text-muted-foreground capitalize">{risk.riskCategory} Risk</p>
                      </div>
                    </div>
                    <StatusBadge status={risk.mitigationStatus} type="risk" />
                  </div>
                  
                  <p className="text-muted-foreground mb-4">{risk.riskDescription}</p>
                  
                  {risk.mitigationStrategies && risk.mitigationStrategies.length > 0 && (
                    <div className="bg-background/50 rounded-xl p-4 border border-border">
                      <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2">Mitigation Strategy</h4>
                      <p className="text-sm">{risk.mitigationStrategies[0]}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}
