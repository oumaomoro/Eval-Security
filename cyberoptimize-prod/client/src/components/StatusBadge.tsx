import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  type?: "risk" | "contract" | "audit";
  className?: string;
}

export function StatusBadge({ status, type = "contract", className }: StatusBadgeProps) {
  const getStyles = () => {
    const s = status.toLowerCase();
    
    if (type === "risk") {
      if (s === "critical") return "bg-red-500/20 text-red-500 border-red-500/30";
      if (s === "high") return "bg-orange-500/20 text-orange-500 border-orange-500/30";
      if (s === "medium") return "bg-yellow-500/20 text-yellow-500 border-yellow-500/30";
      return "bg-green-500/20 text-green-500 border-green-500/30";
    }

    if (type === "contract") {
      if (s === "active") return "bg-emerald-500/20 text-emerald-500 border-emerald-500/30";
      if (s === "expired") return "bg-destructive/20 text-destructive border-destructive/30";
      if (s === "reviewing") return "bg-blue-500/20 text-blue-500 border-blue-500/30";
      return "bg-slate-500/20 text-slate-500 border-slate-500/30";
    }

    // Default/Audit
    if (s === "passed" || s === "completed") return "bg-emerald-500/20 text-emerald-500 border-emerald-500/30";
    if (s === "failed") return "bg-destructive/20 text-destructive border-destructive/30";
    return "bg-amber-500/20 text-amber-500 border-amber-500/30";
  };

  return (
    <span className={cn(
      "px-2.5 py-0.5 rounded-full text-xs font-medium border uppercase tracking-wider",
      getStyles(),
      className
    )}>
      {status.replace(/_/g, " ")}
    </span>
  );
}
