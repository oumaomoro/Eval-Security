import { DiamondIcon } from "./DiamondIcon";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, FileText, ShieldCheck, AlertTriangle, BookOpen, Users, BarChart, LogOut, Server, Fingerprint, ShoppingBag, Settings, Globe, Zap } from "lucide-react";
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

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/", group: "core" },
  { label: "Contracts", icon: FileText, href: "/contracts", group: "core" },
  { label: "DPO & Compliance", icon: ShieldCheck, href: "/compliance", group: "core" },
  { label: "Risk Register", icon: AlertTriangle, href: "/risks", group: "core" },
  { label: "Clause Library", icon: BookOpen, href: "/clauses", group: "intelligence" },
  { label: "Vendor Governance", icon: Users, href: "/vendors", group: "intelligence" },
  { label: "Compliance Policies", icon: ShieldCheck, href: "/policies", group: "intelligence" },
  { label: "Regulatory Reports", icon: BarChart, href: "/reports", group: "intelligence" },
  { label: "Billing & Usage", icon: Zap, href: "/billing", group: "platform" },
  { label: "System Health", icon: Server, href: "/system", group: "platform" },
  { label: "Audit Ledger", icon: Fingerprint, href: "/audit", group: "platform" },
  { label: "Governance Marketplace", icon: ShoppingBag, href: "/marketplace", group: "platform" },
  { label: "Workspace & Team", icon: Users, href: "/workspace", group: "platform" },
  { label: "Settings", icon: Settings, href: "/settings", group: "platform" },
];

const groups = [
  { key: "core", label: "Core Modules" },
  { key: "intelligence", label: "AI Intelligence" },
  { key: "platform", label: "Platform" },
];

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { workspaces, activeWorkspaceId, switchWorkspace, isLoading: wsLoading } = useWorkspace();

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
            <div className="flex items-center gap-2">
                <h1 className="text-lg font-black bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent leading-none tracking-tighter uppercase italic">
                Costloci
                </h1>
                <Badge variant="outline" className="text-[7px] font-black uppercase tracking-tighter bg-primary/10 border-primary/20 text-primary py-0 px-1.5 h-3.5 leading-none italic shadow-lg shadow-primary/10">
                    {user?.subscriptionTier || 'ENTERPRISE'}
                </Badge>
            </div>
            <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] mt-1.5 flex items-center gap-1.5 italic">
                <div className="w-1 h-1 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                Sovereign Intelligence
            </p>
          </div>
        </div>
      </div>
      {/* Workspace Switcher */}
      <div className="px-5 py-4 border-b border-[hsl(240,25%,18%)]">
        <label className="text-[9px] font-black uppercase tracking-widest text-slate-600 mb-2 block px-1">
          Active Workspace
        </label>
        <Select
          value={activeWorkspaceId?.toString()}
          onValueChange={(val) => switchWorkspace(parseInt(val))}
          disabled={wsLoading}
        >
          <SelectTrigger className="w-full bg-slate-900/40 border-slate-800/60 hover:border-primary/40 transition-colors h-10 rounded-xl text-slate-200">
            <SelectValue placeholder="Select Workspace" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 rounded-xl overflow-hidden shadow-2xl">
            {workspaces.map((ws) => (
              <SelectItem 
                key={ws.id} 
                value={ws.id.toString()}
                className="focus:bg-primary/10 transition-colors cursor-pointer"
              >
                <div className="flex flex-col">
                  <span className="text-xs font-bold">{ws.name}</span>
                  <span className="text-[9px] text-slate-500 uppercase font-black">{ws.plan} Tier</span>
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
