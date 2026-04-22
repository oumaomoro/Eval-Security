/**
 * Phase 27 Hardening: API URL Configuration
 * Ensures that all frontend requests use the absolute production API URL when deployed,
 * preventing 'failed to fetch' errors caused by relative path mismatches on cross-domain hosts.
 */

// Sovereign Connectivity: Use relative paths by default to avoid CORS preflight blocks.
const VITE_API_URL = import.meta.env.VITE_API_URL || "";

/**
 * Prepends the API URL to a path if it's not already absolute.
 * @param path The API endpoint path (e.g., '/api/dashboard/stats')
 */
export function getApiUrl(path: string): string {
  if (path.startsWith('http')) return path;
  
  // Clean leading slash for consistency
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  // If VITE_API_URL already ends with '/api' and path starts with '/api', prevent duplication
  if (VITE_API_URL.endsWith('/api') && cleanPath.startsWith('/api/')) {
    return `${VITE_API_URL}${cleanPath.substring(4)}`;
  }
  
  return `${VITE_API_URL}${cleanPath}`;
}

export const API_BASE_URL = VITE_API_URL;
