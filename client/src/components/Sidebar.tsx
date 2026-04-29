import { DiamondIcon } from "./DiamondIcon";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, FileText, ShieldCheck, AlertTriangle, BookOpen, Users, BarChart, LogOut, Server, ShoppingBag, Settings, Globe, Zap, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";

export function Sidebar() {
  const [location] = useLocation();
  const { logout } = useAuth();
  const { t } = useTranslation();

  const navItems = [
    { label: t("nav.dashboard"), icon: LayoutDashboard, href: "/", group: "core" },
    { label: t("nav.infrastructure"), icon: Server, href: "/infrastructure", group: "core" },
    { label: t("nav.governance_studio"), icon: ShieldCheck, href: "/governance-studio", group: "core" },
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
    { label: t("nav.audit_ledger"), icon: ShieldCheck, href: "/audit", group: "platform" },
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
    <div className="h-screen w-64 flex flex-col fixed left-0 top-0 z-50 bg-slate-950 border-r border-slate-800">

      {/* Brand Header */}
      <div className="p-5 border-b border-slate-900">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 shadow-sm">
            <DiamondIcon className="w-4 h-4 text-primary" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-white uppercase">Costloci</span>
            <p className="text-[9px] text-slate-500 font-medium uppercase tracking-wider">Enterprise Intelligence</p>
          </div>
        </div>
      </div>

      {/* Workspace Selector */}
      <div className="px-4 py-4">
        <WorkspaceSwitcher />
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto scrollbar-none">
        {groups.map(group => {
          const items = navItems.filter(i => i.group === group.key);
          return (
            <div key={group.key} className="mb-6">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-3 mb-2">{group.label}</p>
              <div className="space-y-1">
                {items.map((item) => {
                  const isActive = location === item.href;
                  return (
                    <Link key={item.href} href={item.href}>
                      <div className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150 cursor-pointer group relative",
                        isActive
                          ? "bg-slate-900 text-white shadow-sm ring-1 ring-slate-800"
                          : "text-slate-400 hover:text-slate-100 hover:bg-slate-900/50"
                      )}>
                        <item.icon className={cn(
                          "w-4 h-4 shrink-0 transition-colors",
                          isActive ? "text-primary" : "text-slate-500 group-hover:text-slate-300"
                        )} />
                        <span className="text-sm font-medium truncate">
                          {item.label}
                        </span>
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
      <div className="p-4 border-t border-slate-900 space-y-3">
        <LanguageSwitcher />

        {/* Governance Region */}
        <div className="px-3 py-2 rounded-lg bg-slate-900/40 border border-slate-800/60">
           <div className="flex justify-between items-center">
              <span className="text-[10px] font-medium text-slate-500 uppercase tracking-tight">Governance</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono text-primary/70">
                  {Intl.DateTimeFormat().resolvedOptions().timeZone.includes('Africa') ? 'KDPA / CBK' : 'GDPR / SOC2'}
                </span>
                <div className="w-1 h-1 rounded-full bg-emerald-500" />
              </div>
           </div>
        </div>

        {/* Sign Out */}
        <button
          onClick={() => logout()}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-900 transition-all duration-150 group"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span className="text-sm font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  );
}
