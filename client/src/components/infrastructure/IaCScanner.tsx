import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Shield, Search, AlertTriangle, CheckCircle } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export function IaCScanner() {
  const [content, setContent] = useState("");
  const { toast } = useToast();

  const scanMutation = useMutation({
    mutationFn: async (payload: { content: string }) => {
      const res = await apiRequest("POST", "/api/infrastructure/scan-iac", payload);
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Scan Complete",
        description: `Found ${data.findings?.length || 0} potential issues in your template.`
      });
    }
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "destructive";
      case "high": return "destructive";
      case "medium": return "secondary";
      default: return "outline";
    }
  };

  return (
    <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-cyan-400">
          <Shield className="h-5 w-5" />
          IaC Security Sentinel
        </CardTitle>
        <CardDescription>
          Paste your Terraform or CloudFormation template to analyze security posture before deployment.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="resource 'aws_s3_bucket' 'example' { ... }"
          className="min-h-[200px] border-slate-700 bg-slate-950 text-slate-300 font-mono text-sm"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        
        <Button 
          className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500"
          onClick={() => scanMutation.mutate({ content })}
          disabled={!content || scanMutation.isPending}
        >
          {scanMutation.isPending ? (
            <Search className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Search className="mr-2 h-4 w-4" />
          )}
          Analyze Infrastructure Pattern
        </Button>

        {scanMutation.data?.findings && (
          <div className="mt-6 space-y-3">
            <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Analysis Results</h4>
            {scanMutation.data.findings.length === 0 ? (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-900/20 border border-green-800/50 text-green-400">
                <CheckCircle className="h-5 w-5" />
                <span className="text-sm">No critical misconfigurations detected in this template.</span>
              </div>
            ) : (
              scanMutation.data.findings.map((finding: any, idx: number) => (
                <div key={idx} className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-cyan-500">{finding.resource}</span>
                    <Badge variant={getSeverityColor(finding.severity)} className="capitalize">
                      {finding.severity}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-200 font-medium">{finding.issue}</p>
                  <p className="text-xs text-slate-400 italic">Recommendation: {finding.recommendation}</p>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
