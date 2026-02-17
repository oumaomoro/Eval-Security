import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

import Dashboard from "@/pages/Dashboard";
import Contracts from "@/pages/Contracts";
import ContractDetail from "@/pages/ContractDetail";
import Compliance from "@/pages/Compliance";
import Risks from "@/pages/Risks";
import Clauses from "@/pages/Clauses";
import NotFound from "@/pages/not-found";

function PrivateRouter() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/contracts" component={Contracts} />
      <Route path="/contracts/:id" component={ContractDetail} />
      <Route path="/compliance" component={Compliance} />
      <Route path="/risks" component={Risks} />
      <Route path="/clauses" component={Clauses} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthWrapper() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background p-6 text-center">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          CyberOptimize
        </h1>
        <p className="text-muted-foreground mb-8 max-w-md">
          Advanced SaaS contract intelligence and compliance platform.
        </p>
        <a 
          href="/api/login"
          className="px-8 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:opacity-90 transition-opacity"
        >
          Sign In with Replit
        </a>
      </div>
    );
  }

  return <PrivateRouter />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AuthWrapper />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
