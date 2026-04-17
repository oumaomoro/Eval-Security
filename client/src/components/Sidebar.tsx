import { DiamondIcon } from "./DiamondIcon";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, FileText, ShieldCheck, AlertTriangle, BookOpen, Users, BarChart, LogOut, Server, Fingerprint, ShoppingBag, Settings, Globe, Zap, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useWorkspace } from "@/hooks/use-workspace";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { workspaces, activeWorkspaceId, switchWorkspace, isLoading: wsLoading } = useWorkspace();
  const { t } = useTranslation();

  const navItems = [
    { label: t("nav.dashboard"), icon: LayoutDashboard, href: "/", group: "core" },
    { label: t("nav.dpo_command"), icon: Globe, href: "/dpo-command", group: "core" },
    { label: t("nav.contracts"), icon: FileText, href: "/contracts", group: "core" },
    { label: t("nav.redline_studio"), icon: Zap, href: "/redline-studio", group: "core" },
    { label: t("nav.risk_register"), icon: AlertTriangle, href: "/risks", group: "core" },
    { label: t("nav.clause_library"), icon: BookOpen, href: "/clauses", group: "intelligence" },
    { label: t("nav.vendor_governance"), icon: Users, href: "/vendors", group: "intelligence" },
    { label: t("nav.compliance_policies"), icon: ShieldCheck, href: "/policies", group: "intelligence" },
    { label: t("nav.cost_optimization"), icon: Zap, href: "/savings", group: "intelligence" },
    { label: t("nav.market_benchmarking"), icon: BarChart, href: "/benchmarking", group: "intelligence" },
    { label: t("nav.executive_roi"), icon: DollarSign, href: "/roi", group: "intelligence" },
    { label: t("nav.regulatory_reports"), icon: BarChart, href: "/reports", group: "intelligence" },
    { label: t("nav.billing_usage"), icon: Zap, href: "/billing", group: "platform" },
    { label: t("nav.system_health"), icon: Server, href: "/system", group: "platform" },
    { label: t("nav.audit_ledger"), icon: Fingerprint, href: "/audit", group: "platform" },
    { label: t("nav.governance_marketplace"), icon: ShoppingBag, href: "/marketplace", group: "platform" },
    { label: t("nav.workspace_team"), icon: Users, href: "/workspace", group: "platform" },
    { label: t("nav.settings"), icon: Settings, href: "/settings", group: "platform" },
  ];

  const groups = [
    { key: "core", label: t("nav.groups.core") },
    { key: "intelligence", label: t("nav.groups.intelligence") },
    { key: "platform", label: t("nav.groups.platform") },
  ];

  return (
    <div className="h-screen w-64 flex flex-col fixed left-0 top-0 z-50 bg-[hsl(240,50%,5%)] border-r border-[hsl(240,25%,18%)]">

      {/* Brand Header */}
      <div className="p-5 border-b border-[hsl(240,25%,18%)] relative overflow-hidden">
        <div className="absolute -right-6 -top-6 w-20 h-20 rounded-full bg-primary/10 blur-2xl pointer-events-none" />
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center border border-emerald-500/30 shadow-lg shadow-emerald-500/10 relative group-hover:scale-110 transition-transform duration-500">
            <DiamondIcon className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xl font-black tracking-tighter text-white uppercase italic">Costloci</span>
            <p className="text-[8px] text-emerald-500 font-black uppercase tracking-[0.2em] leading-tight mt-0.5">Intelligence</p>
          </div>
        </div>
      </div>

      {/* Workspace Selector */}
      <div className="px-4 py-4">
        <Select value={activeWorkspaceId?.toString()} onValueChange={(val) => switchWorkspace(parseInt(val))}>
          <SelectTrigger className="w-full bg-slate-900/40 border-slate-800/60 rounded-xl h-12 text-slate-300 focus:ring-primary/20">
            <SelectValue placeholder="Select Workspace" />
          </SelectTrigger>
          <SelectContent className="bg-slate-950 border-slate-800 text-slate-300">
            {workspaces.map((ws) => (
              <SelectItem key={ws.id} value={ws.id.toString()} className="focus:bg-primary/10 focus:text-primary">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary/40" />
                  <span className="text-xs font-semibold">{ws.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto scrollbar-none">
        {groups.map(group => {
          const items = navItems.filter(i => i.group === group.key);
          return (
            <div key={group.key} className="mb-5">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-600 px-2 mb-2">{group.label}</p>
              <div className="space-y-0.5">
                {items.map((item) => {
                  const isActive = location === item.href;
                  return (
                    <Link key={item.href} href={item.href}>
                      <div className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer group relative overflow-hidden",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-slate-500 hover:text-slate-200 hover:bg-slate-800/60"
                      )}>
                        {isActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-primary" />
                        )}
                        <item.icon className={cn(
                          "w-4 h-4 shrink-0 transition-colors",
                          isActive ? "text-primary" : "text-slate-600 group-hover:text-slate-300"
                        )} />
                        <span className={cn(
                          "text-xs font-semibold truncate",
                          isActive ? "text-primary" : ""
                        )}>
                          {item.label}
                        </span>
                        {isActive && (
                          <motion.div
                            layoutId="active-pill"
                            className="absolute inset-0 bg-primary/5 rounded-xl -z-10"
                            transition={{ type: "spring", stiffness: 380, damping: 30 }}
                          />
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-[hsl(240,25%,18%)] space-y-2">
        <LanguageSwitcher />

        {/* Live Compliance Region */}
        <div className="px-3 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
           <div className="flex items-center gap-2 mb-2">
              <Globe className="w-3.5 h-3.5 text-primary/70" />
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Active Governance Region</span>
           </div>
           <div className="flex justify-between items-center">
              <span className="text-[10px] font-mono text-primary/80">
                {Intl.DateTimeFormat().resolvedOptions().timeZone.includes('Africa') ? 'KDPA / POPIA / CBK' :
                 Intl.DateTimeFormat().resolvedOptions().timeZone.includes('America') ? 'CCPA / SOC2' : 'GDPR / SOC2'}
              </span>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
           </div>
        </div>

        {/* Sign Out */}
        <button
          onClick={() => logout()}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 group"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span className="text-xs font-semibold">Sign Out</span>
        </button>
      </div>
    </div>
  );
}
