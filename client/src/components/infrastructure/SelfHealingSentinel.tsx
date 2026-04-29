import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Hammer, ShieldCheck, ChevronRight, Copy, Check } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";

interface HealingFix {
  originalAsset: string;
  issue: string;
  remediationCode: string;
  explanation: string;
  safetyRating: "safe" | "caution" | "manual_only";
}

export function SelfHealingSentinel({ asset }: { asset: any }) {
  const [fix, setFix] = useState<HealingFix | null>(null);
  const [copied, setCopied] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/infrastructure/remediate", {
        assetName: asset.name,
        assetType: asset.assetType,
        issue: asset.issue || "General misconfiguration"
      });
      return res.json();
    },
    onSuccess: (data) => {
      setFix(data);
      toast({ title: "Fix Generated", description: "The Sentinel has analyzed the risk and drafted a resolution." });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Healing Failed", description: "Could not generate fix at this time." });
    }
  });

  const copyToClipboard = () => {
    if (fix) {
      navigator.clipboard.writeText(fix.remediationCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card className="bg-slate-900 border-slate-800 overflow-hidden relative group">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent pointer-events-none" />
      
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-cyan-500/10 rounded-lg">
              <Sparkles className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <CardTitle className="text-sm">Self-Healing Sentinel</CardTitle>
              <CardDescription className="text-[10px]">Autonomic Risk Remediation</CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="text-[10px] uppercase font-bold text-cyan-400 border-cyan-400/30">
            AI-Powered
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {!fix ? (
          <div className="flex flex-col items-center justify-center py-6 text-center space-y-3">
            <div className="p-3 bg-slate-800 rounded-full">
              <Hammer className="w-6 h-6 text-slate-500" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-300">No active healing session</p>
              <p className="text-[10px] text-slate-500 mt-1">Select an asset vulnerability to begin remediation.</p>
            </div>
            <Button 
              size="sm" 
              className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs h-8"
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Analyzing..." : "Draft Resolution"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Suggested Fix</p>
                <Badge className={`text-[9px] ${
                  fix.safetyRating === 'safe' ? 'bg-green-500/20 text-green-400' : 
                  fix.safetyRating === 'caution' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {fix.safetyRating.replace('_', ' ')}
                </Badge>
              </div>
              
              <pre className="text-[10px] font-mono text-cyan-100 bg-slate-900 p-2 rounded overflow-x-auto border border-slate-800">
                {fix.remediationCode}
              </pre>

              <div className="mt-3 space-y-2">
                <p className="text-[11px] text-slate-300 italic">"{fix.explanation}"</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="h-7 text-[10px] flex-1" onClick={copyToClipboard}>
                    {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                    {copied ? "Copied" : "Copy Code"}
                  </Button>
                  <Button size="sm" className="h-7 text-[10px] flex-1 bg-green-600 hover:bg-green-500 text-white">
                    <ShieldCheck className="w-3 h-3 mr-1" /> Deploy Fix
                  </Button>
                </div>
              </div>
            </div>

            <Button variant="ghost" size="sm" className="w-full text-[10px] text-slate-500 h-7" onClick={() => setFix(null)}>
              Reset Sentinel
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
