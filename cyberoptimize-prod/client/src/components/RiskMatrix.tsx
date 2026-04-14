import { useMemo } from "react";
import { motion } from "framer-motion";
import { Risk } from "@shared/schema";

interface RiskMatrixProps {
  risks: Risk[];
}

export function RiskMatrix({ risks }: RiskMatrixProps) {
  // 5x5 Matrix: Impact (Y) vs Likelihood (X)
  // Axes: very_low, low, medium, high, very_high
  
  const matrixData = useMemo(() => {
    const grid: Record<string, Record<string, Risk[]>> = {};
    const levels = ["very_low", "low", "medium", "high", "very_high"];
    
    levels.forEach(impact => {
      grid[impact] = {};
      levels.forEach(likelihood => {
        grid[impact][likelihood] = [];
      });
    });

    risks.forEach(risk => {
      if (grid[risk.impact] && grid[risk.impact][risk.likelihood]) {
        grid[risk.impact][risk.likelihood].push(risk);
      }
    });

    return grid;
  }, [risks]);

  const levels = ["very_low", "low", "medium", "high", "very_high"];
  const labels = ["V. Low", "Low", "Med", "High", "V. High"];

  const getCellColor = (impactIdx: number, likelihoodIdx: number) => {
    const score = (impactIdx + 1) * (likelihoodIdx + 1);
    if (score >= 20) return "bg-red-500/20 border-red-500/50"; // Critical
    if (score >= 12) return "bg-orange-500/20 border-orange-500/50"; // High
    if (score >= 6) return "bg-yellow-500/20 border-yellow-500/50"; // Medium
    return "bg-green-500/20 border-green-500/50"; // Low
  };

  return (
    <div className="bg-card p-6 rounded-2xl border border-border">
      <h3 className="text-lg font-bold mb-6">Risk Heatmap</h3>
      <div className="relative">
        {/* Y-Axis Label */}
        <div className="absolute -left-8 top-1/2 -translate-y-1/2 -rotate-90 text-xs font-bold text-muted-foreground uppercase tracking-widest">
          Impact
        </div>
        
        <div className="grid grid-cols-5 gap-1 mb-2">
          {levels.slice().reverse().map((impact, yInv) => {
            const y = 4 - yInv; // 4,3,2,1,0
            return levels.map((likelihood, x) => {
              const cellRisks = matrixData[impact][likelihood] || [];
              const count = cellRisks.length;
              
              return (
                <motion.div
                  key={`${impact}-${likelihood}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: (x + yInv) * 0.05 }}
                  className={`
                    aspect-square rounded-lg border flex items-center justify-center relative group cursor-pointer
                    ${getCellColor(y, x)}
                    hover:brightness-125 transition-all
                  `}
                >
                  {count > 0 && (
                    <span className="font-bold text-lg">{count}</span>
                  )}
                  {count > 0 && (
                    <div className="absolute opacity-0 group-hover:opacity-100 bottom-full mb-2 bg-popover text-popover-foreground text-xs p-2 rounded shadow-xl border border-border w-48 z-10 pointer-events-none">
                      <div className="font-bold mb-1">{labels[y]} Impact / {labels[x]} Likelihood</div>
                      <ul className="list-disc pl-3">
                        {cellRisks.slice(0, 3).map(r => (
                          <li key={r.id} className="truncate">{r.riskTitle}</li>
                        ))}
                        {count > 3 && <li>+ {count - 3} more</li>}
                      </ul>
                    </div>
                  )}
                </motion.div>
              );
            });
          })}
        </div>

        {/* X-Axis Labels */}
        <div className="grid grid-cols-5 gap-1 text-center">
          {labels.map(l => (
            <div key={l} className="text-xs font-mono text-muted-foreground uppercase">{l}</div>
          ))}
        </div>
        
        {/* X-Axis Main Label */}
        <div className="text-center mt-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
          Likelihood
        </div>
      </div>
    </div>
  );
}
