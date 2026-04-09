// _worker.js
var BACKEND_URL = "https://backend-fizggyao3-free-flows-projects.vercel.app";
var worker_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/") || url.pathname === "/logout") {
      const targetUrl = `${BACKEND_URL}${url.pathname}${url.search}`;
      const backendRequest = new Request(targetUrl, {
        method: request.method,
        headers: request.headers,
        body: ["GET", "HEAD"].includes(request.method) ? void 0 : request.body,
        redirect: "follow"
      });
      try {
        const response = await fetch(backendRequest);
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers
        });
      } catch (err) {
        return new Response(
          JSON.stringify({ error: "Backend unreachable", detail: err.message }),
          { status: 502, headers: { "Content-Type": "application/json" } }
        );
      }
    }
    try {
      const assetResponse = await env.ASSETS.fetch(request);
      if (assetResponse.status !== 404) {
        return assetResponse;
      }
    } catch (_) {
    }
    const indexUrl = new URL("/index.html", request.url).toString();
    return env.ASSETS.fetch(new Request(indexUrl, request));
  }
};
export {
  worker_default as default
};
//# sourceMappingURL=bundledWorker-0.8015850351319496.mjs.map
