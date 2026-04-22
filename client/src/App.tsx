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
import ExecutiveROI from "@/pages/ExecutiveROI";
import History from "@/pages/History";
import NotificationSettings from "@/pages/NotificationSettings";
import Savings from "@/pages/Savings";
import Benchmarking from "@/pages/Benchmarking";
import RedliningStudio from "@/pages/RedliningStudio";
import AdminDashboard from "@/pages/AdminDashboard";

import React, { Suspense } from "react";
const DPODashboard = React.lazy(() => import("@/pages/DPODashboard"));
const Marketplace = React.lazy(() => import("@/pages/Marketplace"));
const CyberInsurance = React.lazy(() => import("@/pages/CyberInsurance"));
const ContractDetail = React.lazy(() => import("@/pages/ContractDetail"));
const Risks = React.lazy(() => import("@/pages/Risks"));
const Rulesets = React.lazy(() => import("@/pages/Rulesets"));

import AuthPage from "@/pages/AuthPage";
import { AuthCallback } from "@/pages/AuthCallback";
import LandingPage from "@/pages/LandingPage";
import ResetPassword from "@/pages/ResetPassword";
import NotFound from "@/pages/not-found";

function PrivateRouter() {
  return (
    <Suspense fallback={<div className="h-screen w-screen flex items-center justify-center bg-slate-950"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>}>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/dpo-command" component={DPODashboard} />
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
        <Route path="/roi" component={ExecutiveROI} />
        <Route path="/savings" component={Savings} />
        <Route path="/benchmarking" component={Benchmarking} />
        <Route path="/cyber-insurance" component={CyberInsurance} />
        <Route path="/redline-studio" component={RedliningStudio} />
        <Route path="/history" component={History} />
        <Route path="/notifications" component={NotificationSettings} />
        <Route path="/admin" component={AdminDashboard} />
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

import { useLocation } from "wouter";
import { ErrorBoundary } from "@/components/ErrorBoundary";

function AuthWrapper() {
  const { user, isLoading, isError } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  // Unauthenticated: Marketing vs Auth
  if (!user || isError) {
    return (
      <Switch>
        <Route path="/" component={LandingPage} />
        <Route path="/auth" component={AuthPage} />
        <Route path="/auth/callback" component={AuthCallback} />
        <Route path="/reset-password" component={ResetPassword} />
        {/* Redirect unknown routes to Landing on auth-fail */}
        <Route component={() => {
          // If trying to access protected route while unauth, go to /auth
          const path = window.location.pathname;
          if (path !== "/" && path !== "/reset-password" && path !== "/auth") {
             React.useEffect(() => {
               setLocation("/auth");
             }, []);
             return null;
          }
          return <LandingPage />;
        }} />
      </Switch>
    );
  }

  return <PrivateRouter />;
}

import { WorkspaceProvider } from "@/contexts/WorkspaceContext";

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WorkspaceProvider>
            <AnalyticsWrapper />
            <Toaster />
            <AuthWrapper />
          </WorkspaceProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
