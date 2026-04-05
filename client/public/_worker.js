/**
 * Cloudflare Pages Advanced Mode Worker
 * Handles API proxying to Vercel backend + SPA static file serving.
 *
 * Why: Cloudflare Pages _redirects cannot proxy to external URLs (only local paths).
 * This worker intercepts all requests and routes them appropriately.
 */

const BACKEND_URL = 'https://backend-fizggyao3-free-flows-projects.vercel.app';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // ── Proxy all /api/* and /logout to the Vercel backend ──────────────────
    if (url.pathname.startsWith('/api/') || url.pathname === '/logout') {
      const targetUrl = `${BACKEND_URL}${url.pathname}${url.search}`;

      const backendRequest = new Request(targetUrl, {
        method: request.method,
        headers: request.headers,
        body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
        redirect: 'follow',
      });

      try {
        const response = await fetch(backendRequest);
        // Pass through with original status — critical for 401 handling
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        });
      } catch (err) {
        return new Response(
          JSON.stringify({ error: 'Backend unreachable', detail: err.message }),
          { status: 502, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // ── Serve static assets ──────────────────────────────────────────────────
    try {
      const assetResponse = await env.ASSETS.fetch(request);
      if (assetResponse.status !== 404) {
        return assetResponse;
      }
    } catch (_) {}

    // ── SPA fallback: serve index.html for all unmatched routes ─────────────
    const indexUrl = new URL('/index.html', request.url).toString();
    return env.ASSETS.fetch(new Request(indexUrl, request));
  },
};
