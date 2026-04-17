import { QueryClient, QueryFunction } from "@tanstack/react-query";

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

  const res = await fetch(fullUrl, {
    method,
    credentials: "include",
    headers: {
      ...(data ? { "Content-Type": "application/json" } : {}),
      "X-Requested-With": "XMLHttpRequest"
    },
    body: data ? JSON.stringify(data) : undefined,
  });

  if (res.status === 401 || res.status === 403) {
      // Optional: Trigger re-auth flow if needed
  }

  await throwIfResNotOk(res);
  return res;
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

    const res = await fetch(fullUrl, {
      credentials: "include",
      headers: {
        "X-Requested-With": "XMLHttpRequest"
      },
    });

    if (res.status === 401 || res.status === 403) {
      if (unauthorizedBehavior === "returnNull") return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
