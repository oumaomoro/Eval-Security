import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught UI Error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6 font-sans">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-2">System Interruption</h2>
              <p className="text-sm text-slate-400 font-bold uppercase tracking-tight">The interface encountend an unexpected error. Please reload the dashboard.</p>
            </div>
            
            {this.state.error && (
              <div className="bg-black/50 p-4 rounded-xl text-left overflow-hidden">
                <p className="text-[10px] font-mono text-red-400 truncate">{this.state.error.message}</p>
              </div>
            )}

            <Button 
              onClick={() => window.location.reload()} 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-tighter h-12 rounded-xl group"
            >
              <RefreshCw className="w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-500" />
              Reload Dashboard
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
