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

 return (
 <div className="min-h-[300px] w-full flex flex-col items-center justify-center p-8 bg-slate-950 text-slate-200 border border-slate-800 rounded-xl space-y-4 my-6">
 <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
 <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
 </svg>
 </div>
 <div className="text-center max-w-md">
 <h3 className="text-lg font-bold text-white mb-1">Component Encountered an Issue</h3>
 <p className="text-xs text-slate-400">
 A temporary runtime condition occurred while rendering this view. You can retry or return to the main dashboard.
 </p>
 </div>

 {this.state.error && (
 <details className="text-left w-full max-w-lg bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-slate-300">
 <summary className="cursor-pointer font-mono text-[11px] text-red-400 select-none">
 {this.state.error.message || "View Technical Error Details"}
 </summary>
 <pre className="mt-2 text-[10px] text-slate-400 overflow-auto max-h-40 font-mono whitespace-pre-wrap">
 {this.state.error.stack || this.state.error.message}
 </pre>
 </details>
 )}

 <div className="flex items-center gap-3 pt-2">
 <button
 onClick={this.handleReset}
 className="text-xs px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium transition-colors"
 >
 Try again
 </button>
 <button
 onClick={() => { window.location.href = "/"; }}
 className="text-xs px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
 >
 Go to Dashboard
 </button>
 <button
 onClick={() => { window.location.reload(); }}
 className="text-xs px-4 py-2 rounded-lg border border-slate-700 hover:bg-slate-900 text-slate-400 transition-colors"
 >
 Reload Page
 </button>
 </div>
 </div>
 );
 }

 return this.props.children;
 }
}
