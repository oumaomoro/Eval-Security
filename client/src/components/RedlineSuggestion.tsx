import React from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, MessageSquareWarning } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RedlineProps {
  id: string;
  contractId: number;
  clauseTitle: string;
  originalText: string;
  suggestedText: string;
  status: "pending" | "accepted" | "rejected";
  ruleId?: number | null;
}

export function RedlineSuggestion({ suggestion }: { suggestion: RedlineProps }) {
  const { toast } = useToast();

  const acceptMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/redlines/${id}/accept`, { method: "POST" });
      if (!res.ok) throw new Error(await res.text());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts", suggestion.contractId, "redlines"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contracts", suggestion.contractId] });
      toast({ title: "Redline Accepted", description: "The clause has been legally flagged for insertion." });
    }
  });

  if (suggestion.status === "accepted") {
     return (
       <Card className="border-green-500/30 bg-green-950/10 mb-4">
         <CardHeader className="py-3 flex flex-row items-center space-y-0 pb-2">
            <CheckCircle2 className="w-5 h-5 text-green-500 mr-2" />
            <CardTitle className="text-sm text-green-400">Accepted Redline</CardTitle>
         </CardHeader>
         <CardContent className="py-2 text-sm text-slate-300">
           {suggestion.suggestedText}
         </CardContent>
       </Card>
     );
  }

  return (
    <Card className="border-cyan-500/50 bg-slate-900 shadow-[0_0_10px_rgba(6,182,212,0.1)] mb-4 animate-in slide-in-from-right">
      <CardHeader className="py-3 flex flex-row items-start space-between space-y-0 pb-2 border-b border-slate-800">
        <div className="flex items-center text-cyan-400 font-medium text-sm">
          <MessageSquareWarning className="w-4 h-4 mr-2" />
          Playbook Recommendation
        </div>
      </CardHeader>
      
      <CardContent className="pt-4 pb-2 space-y-3">
        {suggestion.originalText && suggestion.originalText !== "[Section Missing or Deficient]" && (
           <div className="bg-red-950/20 border border-red-900/50 rounded p-2 text-xs text-red-200">
             <span className="font-semibold text-red-400 block mb-1 hover:line-through">Original Detected Text:</span>
             {suggestion.originalText}
           </div>
        )}
        
        <div className="bg-cyan-950/20 border border-cyan-900/50 rounded p-3 text-sm text-cyan-50">
           <span className="font-semibold text-cyan-400 block mb-1">Suggested Redline Addition:</span>
           {suggestion.suggestedText}
        </div>
      </CardContent>

      <CardFooter className="pt-2 flex justify-end space-x-2">
        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">Review Later</Button>
        <Button 
           size="sm" 
           className="bg-cyan-600 hover:bg-cyan-700 text-white"
           onClick={() => acceptMutation.mutate(suggestion.id)}
           disabled={acceptMutation.isPending}
        >
          Accept Redline
        </Button>
      </CardFooter>
    </Card>
  );
}
