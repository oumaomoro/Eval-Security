import { Sidebar } from "./Sidebar";
import { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { SystemHealth } from "./SystemHealth";

interface LayoutProps {
  children: ReactNode;
  header?: ReactNode;
}

export function Layout({ children, header }: LayoutProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div className="h-screen bg-background flex items-center justify-center text-primary">Loading...</div>;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {user && <Sidebar />}
      <main className={`transition-all duration-300 ${user ? "ml-64" : ""}`}>
        {header && (
          <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/50 px-8 py-4 flex items-center justify-between">
            {header}
            <div className="flex items-center gap-4">
              <SystemHealth />
              {user && (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">Logged in as</span>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold border border-primary/30">
                      {(user as any).firstName?.[0] || (user as any).email?.[0] || "U"}
                    </div>
                    <span className="font-medium">{(user as any).firstName || (user as any).email}</span>
                  </div>
                </div>
              )}
            </div>
          </header>
        )}
        <div className="p-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}
        </div>
      </main>
    </div>
  );
}
