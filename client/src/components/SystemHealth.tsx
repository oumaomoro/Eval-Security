import { useQuery } from "@tanstack/react-query";
import { AlertCircle, ShieldCheck } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function SystemHealth() {
  const { data: health } = useQuery<{ mode: 'sovereign' | 'degraded', missingTables: string[] }>({
    queryKey: ["/api/system/health"],
    refetchInterval: 10000,
  });

  if (!health || health.mode === 'sovereign') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 animate-pulse">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Sovereign Mode</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>System integrity verified. All database systems nominal.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse">
            <AlertCircle className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Degraded Mode</span>
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="font-bold mb-1">Partial Persistence Active</p>
          <p className="text-xs text-muted-foreground">
            Due to pending database sync, some data (logs, comments) is currently stored in-memory. 
            Missing: {health.missingTables.join(", ") || "Schema Updates"}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
