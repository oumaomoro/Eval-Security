import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { getCsrfToken } from "./csrf";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }

  // Phase 24 Anti-Loop: If an API returns HTML, it means redirect/infrastructure failure
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("text/html")) {
    throw new Error("Infrastructure Error: API returned HTML. Check Cloudflare Proxy or Vercel Auth.");
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const apiUrl = isLocal ? '' : (import.meta.env.VITE_API_URL === 'https://api.costloci.com' ? '' : (import.meta.env.VITE_API_URL || ""));
  const fullUrl = url.startsWith("http") ? url : `${apiUrl}${url.startsWith("/") ? url : `/${url}`}`;

  // Fetch CSRF token for mutating requests (Phase 28 Secure Sync)
  let csrfHeader = {};
  if (method !== "GET" && method !== "HEAD") {
    const token = await getCsrfToken();
    if (token) {
      csrfHeader = { "x-csrf-token": token };
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

  try {
    const res = await fetch(fullUrl, {
      method,
      credentials: "include",
      headers: {
        ...(data ? { "Content-Type": "application/json" } : {}),
        "X-Requested-With": "XMLHttpRequest",
        ...csrfHeader
      },
      body: data ? JSON.stringify(data) : undefined,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.status === 401 || res.status === 403) {
        // Optional: Trigger re-auth flow if needed
    }

    await throwIfResNotOk(res);
    return res;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error("Request timed out after 15 seconds");
    }
    throw err;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const apiUrl = isLocal ? '' : (import.meta.env.VITE_API_URL === 'https://api.costloci.com' ? '' : (import.meta.env.VITE_API_URL || ""));
    const path = queryKey.join("/");
    const fullUrl = path.startsWith("http") ? path : `${apiUrl}${path.startsWith("/") ? path : `/${path}`}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const res = await fetch(fullUrl, {
        credentials: "include",
        headers: {
          "X-Requested-With": "XMLHttpRequest"
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.status === 401 || res.status === 403) {
        if (unauthorizedBehavior === "returnNull") return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error("Query timed out after 15 seconds");
      }
      throw err;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes by default
      retry: (failureCount, error: any) => {
        if (failureCount >= 3) return false;
        // Don't retry on 4xx errors except 429
        if (error.message?.startsWith('4') && !error.message?.startsWith('429')) return false;
        return true;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: false, // Standard practice: don't auto-retry mutations to avoid duplicate side effects
    },
  },
});
