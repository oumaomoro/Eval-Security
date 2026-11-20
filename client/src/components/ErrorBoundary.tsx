import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: undefined,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      const isDev = import.meta.env.DEV;
      return (
        <div className="p-6 border border-destructive bg-destructive/10 rounded-lg text-destructive space-y-3">
          <p className="font-semibold">Something went wrong.</p>
          {isDev && this.state.error && (
            <pre className="text-xs bg-slate-950 text-red-300 p-3 rounded overflow-auto max-h-48">
              {this.state.error.message}
            </pre>
          )}
          <button
            onClick={this.handleReset}
            className="text-xs px-3 py-1.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
