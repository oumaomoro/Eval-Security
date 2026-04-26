/**
 * Cloudflare Pages Function: API Proxy
 * Proxies all /api/* requests to the Vercel backend.
 * This is required because _redirects cannot proxy to external URLs.
 */

const BACKEND_URL = 'https://api.costloci.com';

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);

  // Build the target URL on the Vercel backend
  // Heal pathological double-api paths if they occur at the edge
  let cleanPath = url.pathname;
  if (cleanPath.startsWith('/api/api/')) {
    cleanPath = cleanPath.replace('/api/api/', '/api/');
  }
  
  const targetUrl = `${BACKEND_URL}${cleanPath}${url.search}`;

  // Forward the request, stripping CF-specific headers that may interfere
  const headers = new Headers(request.headers);
  headers.set('X-Forwarded-Host', url.host);
  headers.set('X-Proxy-Source', 'Cloudflare-Pages-Function');
  
  const backendRequestInit = {
    method: request.method,
    headers,
    redirect: 'follow',
  };

  if (!['GET', 'HEAD'].includes(request.method) && request.body) {
    backendRequestInit.body = request.body;
    backendRequestInit.duplex = 'half'; // Essential for stream bodies in Cloudflare fetch
  }

  const backendRequest = new Request(targetUrl, backendRequestInit);

  try {
    const response = await fetch(backendRequest);

    // Pass through the response with its original status and headers
    const responseHeaders = new Headers(response.headers);
    
    // Add diagnostic headers
    responseHeaders.set('X-Proxy-Target', targetUrl);
    responseHeaders.set('X-Backend-Status', response.status.toString());
    
    // Allow CORS from Cloudflare Pages
    responseHeaders.set('Access-Control-Allow-Origin', url.origin);
    responseHeaders.set('Access-Control-Allow-Credentials', 'true');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (err) {
    return new Response(JSON.stringify({ 
      error: 'Backend unreachable', 
      detail: err.message,
      target: targetUrl,
      timestamp: new Date().toISOString()
    }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
