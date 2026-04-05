import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

import Dashboard from "@/pages/Dashboard";
import Contracts from "@/pages/Contracts";
import Compliance from "@/pages/Compliance";
import Clauses from "@/pages/Clauses";
import Vendors from "@/pages/Vendors";
import Reports from "@/pages/Reports";
import SystemHealth from "@/pages/SystemHealth";
import AuditLog from "@/pages/AuditLog";
import Billing from "@/pages/Billing";
import Settings from "@/pages/Settings";
import WorkspaceSettings from "@/pages/WorkspaceSettings";
import Marketplace from "@/pages/Marketplace";

import React, { Suspense } from "react";
const ContractDetail = React.lazy(() => import("@/pages/ContractDetail"));
const Risks = React.lazy(() => import("@/pages/Risks"));
const Rulesets = React.lazy(() => import("@/pages/Rulesets"));

import AuthPage from "@/pages/AuthPage";
import ResetPassword from "@/pages/ResetPassword";
import NotFound from "@/pages/not-found";

function PrivateRouter() {
  return (
    <Suspense fallback={<div className="h-screen w-screen flex items-center justify-center bg-slate-950"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>}>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/contracts" component={Contracts} />
        <Route path="/contracts/:id" component={ContractDetail} />
        <Route path="/compliance" component={Compliance} />
        <Route path="/risks" component={Risks} />
        <Route path="/clauses" component={Clauses} />
        <Route path="/vendors" component={Vendors} />
        <Route path="/policies" component={Rulesets} />
        <Route path="/system" component={SystemHealth} />
        <Route path="/audit" component={AuditLog} />
        <Route path="/reports" component={Reports} />
        <Route path="/billing" component={Billing} />
        <Route path="/workspace" component={WorkspaceSettings} />
        <Route path="/settings" component={Settings} />
        <Route path="/marketplace" component={Marketplace} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

import { useAnalytics } from "@/hooks/use-analytics";

function AnalyticsWrapper() {
  useAnalytics();
  return null;
}

function AuthWrapper() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <Switch>
        <Route path="/reset-password" component={ResetPassword} />
        <Route component={AuthPage} />
      </Switch>
    );
  }

  return <PrivateRouter />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AnalyticsWrapper />
        <Toaster />
        <AuthWrapper />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
