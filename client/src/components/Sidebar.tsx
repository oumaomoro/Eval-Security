import { Link, useLocation } from "wouter";
import { LayoutDashboard, FileText, ShieldCheck, AlertTriangle, BookOpen, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

export function Sidebar() {
  const [location] = useLocation();
  const { logout } = useAuth();

  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/" },
    { label: "Contracts", icon: FileText, href: "/contracts" },
    { label: "Compliance", icon: ShieldCheck, href: "/compliance" },
    { label: "Risk Register", icon: AlertTriangle, href: "/risks" },
    { label: "Clause Library", icon: BookOpen, href: "/clauses" },
  ];

  return (
    <div className="h-screen w-64 bg-card border-r border-border flex flex-col fixed left-0 top-0 z-50">
      <div className="p-6 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/50">
            <ShieldCheck className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
            CyberOptimize
          </h1>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <div
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer group",
                location === item.href
                  ? "bg-primary/10 text-primary border border-primary/20 shadow-lg shadow-primary/5"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5 transition-colors",
                location === item.href ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
              )} />
              <span className="font-medium">{item.label}</span>
            </div>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-border/50">
        <button 
          onClick={() => logout()}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  );
}
