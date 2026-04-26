
import { getApiUrl } from "./api-config";

/**
 * HARDENED API CLIENT
 * 
 * Automatically injects the active workspace context (x-workspace-id) 
 * into every request to ensure multi-tenant RLS stability across 
 * Cloudflare and Vercel environments.
 */
export async function fetchApi(path: string, init?: RequestInit) {
  const workspaceId = localStorage.getItem("costloci_active_workspace_id");
  const headers = new Headers(init?.headers);
  
  if (workspaceId) {
    headers.set("x-workspace-id", workspaceId);
  }
  
  // Default to JSON if body exists and not FormData
  if (!headers.has("Content-Type") && init?.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(getApiUrl(path), {
    ...init,
    headers,
    credentials: "include"
  });
}
