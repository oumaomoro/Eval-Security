import { Layout } from "@/components/Layout";
import { useQuery } from "@tanstack/react-query";
import { 
  DollarSign, 
  TrendingDown, 
  BarChart3,
  Layers,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Building
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import { Loader2 } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { EmptyState } from "@/components/ui/empty-state";

export default function Savings() {
  const { data: savings, isLoading } = useQuery<any[]>({
    queryKey: ["/api/savings"],
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-40 space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading cost optimization data...</p>
        </div>
      </Layout>
    );
  }

  const savingsList = savings || [];
  const totalIdentified = savingsList.reduce((sum, s) => sum + (Number(s.estimatedSavings) || 0), 0);
  const avgSavings = savingsList.length > 0 ? Math.round(totalIdentified / savingsList.length) : 0;

  // Aggregate savings by opportunity type for real chart
  const categoryBreakdown = savingsList.reduce((acc: Record<string, number>, curr) => {
    const type = (curr.type || "general").replace(/_/g, " ");
    acc[type] = (acc[type] || 0) + (Number(curr.estimatedSavings) || 0);
    return acc;
  }, {});

  const chartData = Object.entries(categoryBreakdown).map(([category, amount]) => ({
    category: category.charAt(0).toUpperCase() + category.slice(1),
    savings: amount,
  }));

  return (
    <Layout
      header={
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" /> Cost Optimization
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Automated savings analysis and vendor renegotiation opportunities.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="border-border text-xs px-3 py-1 font-medium">
              {savingsList.length} Opportunities Identified
            </Badge>
          </div>
        </div>
      }
    >
      <SEO title="Cost Optimization" description="Review identified savings and cost reduction opportunities across contracts." />

      <div className="space-y-8 pb-12 pt-2">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-card border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Identified Savings</CardTitle>
              <DollarSign className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground font-mono">
                ${totalIdentified.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Potential annual cost reductions across audited contracts
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Opportunities</CardTitle>
              <BarChart3 className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground font-mono">
                {savingsList.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Contracts with identified pricing or license improvements
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Average Savings / Contract</CardTitle>
              <TrendingDown className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground font-mono">
                ${avgSavings.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Average projected impact per identified opportunity
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Real Savings Chart if data exists */}
        {chartData.length > 0 && (
          <Card className="bg-card border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Savings by Opportunity Type</CardTitle>
              <CardDescription>Breakdown of potential savings categorized by optimization vector</CardDescription>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
                  <XAxis dataKey="category" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v.toLocaleString()}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#090d16", borderColor: "#1e293b", borderRadius: "0.5rem" }}
                    formatter={(val: any) => [`$${Number(val).toLocaleString()}`, "Estimated Savings"]}
                  />
                  <Bar dataKey="savings" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Opportunity List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" /> Identified Savings Opportunities
            </h2>
            <span className="text-xs text-muted-foreground">{savingsList.length} items</span>
          </div>

          {savingsList.length === 0 ? (
            <Card className="bg-card border-border p-8">
              <EmptyState
                icon={TrendingDown}
                title="No Savings Opportunities Identified Yet"
                description="Upload your vendor contracts to allow the automated intelligence engine to benchmark pricing against regional enterprise standards and identify cost reductions."
              />
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {savingsList.map((opp: any) => (
                <Card key={opp.id} className="bg-card border-border hover:border-primary/40 transition-colors shadow-sm">
                  <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs uppercase font-semibold">
                          {(opp.type || "General").replace(/_/g, " ")}
                        </Badge>
                        {opp.contractId && (
                          <span className="text-xs text-muted-foreground">Contract #{opp.contractId}</span>
                        )}
                      </div>
                      <h3 className="text-base font-semibold text-foreground">
                        {opp.description || "Contract optimization opportunity"}
                      </h3>
                      {opp.recommendations && (
                        <p className="text-xs text-muted-foreground max-w-2xl">
                          {opp.recommendations}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-left md:text-right">
                        <span className="text-xs text-muted-foreground block">Estimated Savings</span>
                        <span className="text-xl font-bold text-emerald-400 font-mono">
                          ${(Number(opp.estimatedSavings) || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
