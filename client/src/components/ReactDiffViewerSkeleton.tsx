import React from "react";
import { Loader2 } from "lucide-react";

export function ReactDiffViewerSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center p-20 bg-slate-900/50 border border-slate-800 rounded-lg min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
      <p className="text-sm text-slate-400 font-medium tracking-tight">
        Initializing Secure Delta Analysis...
      </p>
    </div>
  );
}
