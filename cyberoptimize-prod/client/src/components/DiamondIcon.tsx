import { cn } from "@/lib/utils";

interface DiamondIconProps {
  className?: string;
  glow?: boolean;
}

export function DiamondIcon({ className, glow = true }: DiamondIconProps) {
  return (
    <div className={cn("relative flex items-center justify-center shrink-0", className)}>
      {/* Outer Glow */}
      {glow && (
        <div className="absolute inset-0 bg-emerald-500/20 blur-[10px] rounded-full animate-pulse pointer-events-none" />
      )}
      
      {/* The Jewel Shape */}
      <div 
        className="w-full h-full bg-gradient-to-br from-emerald-400 via-emerald-600 to-emerald-900 shadow-xl"
        style={{
          clipPath: "polygon(50% 0%, 90% 20%, 100% 50%, 90% 80%, 50% 100%, 10% 80%, 0% 50%, 10% 20%)",
          filter: "drop-shadow(0 0 5px rgba(16,185,129,0.5))"
        }}
      >
        {/* Inner Facets/Gleam */}
        <div 
          className="absolute inset-0 bg-gradient-to-tl from-white/30 to-transparent opacity-60"
          style={{
            clipPath: "polygon(50% 10%, 80% 30%, 50% 90%, 20% 30%)"
          }}
        />
        <div 
          className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-40"
          style={{
            clipPath: "polygon(10% 50%, 50% 10%, 90% 50%, 50% 90%)"
          }}
        />
      </div>
    </div>
  );
}
