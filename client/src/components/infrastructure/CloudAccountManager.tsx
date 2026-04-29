import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Cloud, Plus, MoreVertical, RefreshCw, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export function CloudAccountManager() {
  const { data: accounts, isLoading } = useQuery<any[]>({
    queryKey: ["/api/infrastructure/accounts"],
  });

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Cloud className="w-4 h-4 text-cyan-400" /> Multi-Cloud Grid
        </CardTitle>
        <Button size="sm" variant="outline" className="h-7 text-[10px] uppercase font-black gap-1 border-slate-700 hover:bg-slate-800">
          <Plus className="w-3 h-3" /> Connect
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2].map(i => <div key={i} className="h-16 bg-slate-800/50 rounded-lg" />)}
          </div>
        ) : accounts?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-2 border-2 border-dashed border-slate-800 rounded-xl">
             <AlertTriangle className="w-8 h-8 text-slate-700" />
             <p className="text-xs text-slate-500">No cloud accounts integrated yet.</p>
          </div>
        ) : (
          accounts?.map((acc) => (
            <div key={acc.id} className="p-3 rounded-lg bg-slate-950 border border-slate-800 group hover:border-cyan-500/50 transition-all">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-slate-900 flex items-center justify-center">
                    <Cloud className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{acc.accountName}</h4>
                    <p className="text-[10px] text-slate-500">{acc.provider.toUpperCase()} • {acc.region}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] font-black border-green-500/30 text-green-400 uppercase">
                  Connected
                </Badge>
              </div>
              
              <div className="flex items-center justify-between pt-2 border-t border-slate-900">
                 <div className="flex gap-2 text-[10px]">
                    <span className="text-slate-500 uppercase font-bold">Policy Audit:</span>
                    <span className="text-slate-300">{acc.iamPolicyCount || 0} IAM Checks</span>
                 </div>
                 <Button size="icon" variant="ghost" className="h-6 w-6 text-slate-600 hover:text-white">
                    <RefreshCw className="w-3 h-3" />
                 </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
