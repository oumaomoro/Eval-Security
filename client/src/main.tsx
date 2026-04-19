import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./lib/i18n";

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
  
  // Only intercept internal API calls
  if (url.includes('/api/')) {
    const workspaceId = localStorage.getItem("costloci_active_workspace_id");
    if (workspaceId) {
      const headers = new Headers(config?.headers || {});
      if (!headers.has('x-workspace-id')) {
        headers.set('x-workspace-id', workspaceId);
      }
      
      // Re-construct the config with the new headers
      const newConfig = { ...config, headers };
      return originalFetch(resource, newConfig);
    }
  }
  
  return originalFetch(...args);
};

createRoot(document.getElementById("root")!).render(<App />);
