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
      <Card className="bg-slate-900/40 border-slate-800/60 backdrop-blur-xl shadow-xl overflow-hidden relative group hover:border-blue-500/40 transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-400">
            {label}
          </CardTitle>
          <div className="p-2 rounded-lg bg-slate-800/50 group-hover:scale-110 transition-transform duration-300">
            {icon}
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white tracking-tight">
            {value}
          </div>
          <div className="flex items-center mt-1 space-x-2">
            {trend && (
              <p className={cn("text-xs font-semibold", trendColor || "text-blue-400")}>
                {trend}
              </p>
            )}
            {subValue && (
              <p className="text-xs text-slate-500 truncate">
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
