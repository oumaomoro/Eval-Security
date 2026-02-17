import { Layout } from "@/components/Layout";
import { useComplianceAudits, useRunAudit } from "@/hooks/use-compliance";
import { Button } from "@/components/ui/button";
import { Play, CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function Compliance() {
  const { data: audits, isLoading } = useComplianceAudits();
  const { mutate: runAudit, isPending: isRunning } = useRunAudit();

  const handleRunAudit = () => {
    // Demo: audit all contracts against KDPA and GDPR
    runAudit({ scope: { contractIds: [1, 2], standards: ["KDPA", "GDPR"] } });
  };

  return (
    <Layout header={
      <div className="flex justify-between items-center w-full">
        <h1 className="text-2xl font-bold">Compliance Audits</h1>
        <Button onClick={handleRunAudit} disabled={isRunning} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
          {isRunning ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2" />}
          Run New Audit
        </Button>
      </div>
    }>
      {isLoading ? <div>Loading...</div> : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card border border-border p-6 rounded-2xl flex items-center gap-4">
              <div className="p-3 bg-emerald-500/20 text-emerald-500 rounded-xl"><CheckCircle className="w-6 h-6" /></div>
              <div>
                <div className="text-2xl font-bold">85%</div>
                <div className="text-sm text-muted-foreground">Avg Compliance Score</div>
              </div>
            </div>
            <div className="bg-card border border-border p-6 rounded-2xl flex items-center gap-4">
              <div className="p-3 bg-red-500/20 text-red-500 rounded-xl"><XCircle className="w-6 h-6" /></div>
              <div>
                <div className="text-2xl font-bold">12</div>
                <div className="text-sm text-muted-foreground">Open Violations</div>
              </div>
            </div>
            <div className="bg-card border border-border p-6 rounded-2xl flex items-center gap-4">
              <div className="p-3 bg-blue-500/20 text-blue-500 rounded-xl"><AlertCircle className="w-6 h-6" /></div>
              <div>
                <div className="text-2xl font-bold">4</div>
                <div className="text-sm text-muted-foreground">Pending Reviews</div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-lg">
            <div className="p-6 border-b border-border">
              <h2 className="text-lg font-bold">Audit History</h2>
            </div>
            <div className="divide-y divide-border">
              {audits?.map((audit) => (
                <div key={audit.id} className="p-6 hover:bg-muted/30 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-lg">{audit.auditName}</h3>
                      <p className="text-sm text-muted-foreground">
                        Ran on {audit.createdAt ? format(new Date(audit.createdAt), "PPP p") : "N/A"}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold font-mono text-primary">{audit.overallComplianceScore}%</div>
                      <div className="text-xs text-muted-foreground">Score</div>
                    </div>
                  </div>
                  
                  {/* Standards Breakdown */}
                  {audit.complianceByStandard && (
                    <div className="flex gap-4 mt-4">
                      {Object.entries(audit.complianceByStandard).map(([std, score]) => (
                        <div key={std} className="bg-background px-3 py-1.5 rounded-lg border border-border text-sm flex items-center gap-2">
                          <span className="font-semibold">{std}</span>
                          <span className={`font-mono ${Number(score) < 80 ? 'text-red-500' : 'text-emerald-500'}`}>{score}%</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Findings */}
                  {audit.findings && audit.findings.length > 0 && (
                    <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                      <h4 className="text-xs font-bold uppercase text-red-400 mb-2">Critical Findings</h4>
                      <ul className="space-y-2">
                        {audit.findings.slice(0, 2).map((f, i) => (
                          <li key={i} className="text-sm flex gap-2 items-start">
                            <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                            <span>{f.description}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
