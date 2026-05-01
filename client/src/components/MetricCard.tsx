import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subValue?: string;
  trend?: string;
  trendColor?: string;
  variants?: any;
}

export const MetricCard = React.memo(({ icon, label, value, subValue, trend, trendColor, variants }: MetricCardProps) => {
  return (
    <motion.div variants={variants}>
      <Card className="nutanix-card overflow-hidden relative group border-white/5">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
          <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
            {label}
          </CardTitle>
          <div className="p-1.5 rounded-lg bg-slate-900 border border-white/5 group-hover:scale-110 transition-transform duration-300">
            {icon}
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-black text-white italic tracking-tighter">
            {value}
          </div>
          <div className="flex items-center mt-1 space-x-2">
            {trend && (
              <p className={cn("text-[10px] font-black uppercase italic", trendColor || "text-emerald-400")}>
                {trend}
              </p>
            )}
            {subValue && (
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest truncate">
                {subValue}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});

MetricCard.displayName = "MetricCard";
