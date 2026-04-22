/**
 * CSRF Management Utility
 * Handles fetching and caching of the CSRF token to prevent 'invalid csrf token' errors during mutations.
 */

let cachedToken: string | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

/**
 * Fetches matching CSRF token from the backend.
 */
export async function getCsrfToken(): Promise<string | null> {
  const now = Date.now();
  
  // Return cached token if still valid
  if (cachedToken && (now - lastFetchTime < CACHE_TTL)) {
    return cachedToken;
  }

  try {
    const response = await fetch("/api/csrf-token", {
      credentials: "include"
    });
    
    if (!response.ok) {
       console.error("[CSRF] Failed to fetch token. Platform security may block mutations.");
       return null;
    }

    const { token } = await response.json();
    cachedToken = token;
    lastFetchTime = now;
    return token;
  } catch (error) {
    console.error("[CSRF] Network error during token refresh:", error);
    return null;
  }
}

/**
 * Force clear the token (e.g. on logout)
 */
export function clearCsrfToken() {
  cachedToken = null;
  lastFetchTime = 0;
}
