import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Circle, ArrowRight, UserPlus, FileUp, Shield, Rocket } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Progress } from "@/components/ui/progress";

interface OnboardingChecklistProps {
  hasClients: boolean;
  hasContracts: boolean;
  hasAudits: boolean;
}

export function OnboardingChecklist({ hasClients, hasContracts, hasAudits }: OnboardingChecklistProps) {
  const steps = [
    {
      id: "client",
      title: "Set Up Your Account",
      description: "Complete your company profile to unlock all features.",
      icon: UserPlus,
      completed: hasClients,
      link: "/workspace"
    },
    {
      id: "contract",
      title: "Upload Your First Contract",
      description: "Upload a contract or insurance policy to run AI analysis.",
      icon: FileUp,
      completed: hasContracts,
      link: "/contracts"
    },
    {
      id: "compliance",
      title: "Run a Compliance Audit",
      description: "Check your contracts against KDPA, GDPR, and other standards.",
      icon: Shield,
      completed: hasAudits,
      link: "/compliance"
    }
  ];

  const completedCount = steps.filter(s => s.completed).length;
  const progress = (completedCount / steps.length) * 100;

  if (completedCount === steps.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <Card className="border-emerald-500/20 bg-emerald-500/[0.02] overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
           <Rocket className="w-32 h-32 rotate-12" />
        </div>
        
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                Get Started
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  Step {completedCount + 1} of 3
                </span>
              </CardTitle>
              <CardDescription className="text-sm font-medium mt-1">
                Complete these steps to get the most out of CyberOptimize.
              </CardDescription>
            </div>
            <div className="text-right">
               <span className="text-2xl font-black text-emerald-500">{Math.round(progress)}%</span>
            </div>
          </div>
          <Progress value={progress} className="h-1.5 mt-4 bg-emerald-500/10" />
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {steps.map((step, i) => (
              <Link href={step.link} key={step.id}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    step.completed 
                      ? "bg-emerald-500/5 border-emerald-500/20 opacity-60" 
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-500/30"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`p-2 rounded-xl ${step.completed ? "bg-emerald-500/20 text-emerald-500" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}>
                      <step.icon className="w-5 h-5" />
                    </div>
                    {step.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-300 dark:text-slate-700" />
                    )}
                  </div>
                  <h4 className={`text-sm font-bold ${step.completed ? "text-emerald-500" : "text-slate-900 dark:text-slate-100"}`}>
                    {step.title}
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                    {step.description}
                  </p>
                  {!step.completed && (
                    <div className="mt-4 flex items-center text-[10px] font-black text-emerald-500 uppercase tracking-widest transition-transform">
                      Get Started <ArrowRight className="w-3 h-3 ml-1" />
                    </div>
                  )}
                </motion.div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
