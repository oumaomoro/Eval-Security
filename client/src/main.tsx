import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./lib/i18n";
import { getCsrfToken } from "./lib/csrf";
import { initObservability } from "./lib/observability";

// Global Production Observability
initObservability();

/**
 * Global Multi-Tenant Fetch Interceptor
 * 
 * Automatically injects the 'x-workspace-id' header into all internal API requests.
 * This ensures the backend can correctly scope database queries to the active tenant.
 */
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  const [resource, config] = args;
  const url = resource.toString();
  const method = config?.method?.toUpperCase() || 'GET';
  
  // Only intercept internal API calls
  if (url.includes('/api/')) {
    const headers = new Headers(config?.headers || {});

    // 1. Inject Workspace Context (Multi-tenancy)
    const workspaceId = localStorage.getItem("costloci_active_workspace_id");
    if (workspaceId && !headers.has('x-workspace-id')) {
      headers.set('x-workspace-id', workspaceId);
    }

    // 2. Inject CSRF Protection (Phase 28 Secure Sync)
    if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
      const token = await getCsrfToken();
      if (token && !headers.has('x-csrf-token')) {
        headers.set('x-csrf-token', token);
      }
    }
    
    // Re-construct the config with the new headers
    const newConfig = { ...config, headers };
    return originalFetch(resource, newConfig);
  }
  
  return originalFetch(...args);
};

createRoot(document.getElementById("root")!).render(<App />);
