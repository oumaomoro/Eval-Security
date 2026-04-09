/**
 * Centralized API Client for Costloci
 * Automatically handles Authorization headers and base URL.
 * Falls back to the live Supabase session if localStorage token is absent.
 */
import { supabase } from '../contexts/AuthContext';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const getToken = async () => {
  // Primary: custom JWT issued by /auth/login
  let token = localStorage.getItem('costloci_token');
  if (token) return token;

  // Fallback: live Supabase session (handles page refresh, SSO, etc.)
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      // Persist it so the next call is instant
      localStorage.setItem('costloci_token', session.access_token);
      return session.access_token;
    }
  } catch (_) { /* swallow */ }

  return null;
};

const getHeaders = async () => {
  const token = await getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

const request = async (method, endpoint, options = {}) => {
  const url = `${BASE_URL}${endpoint}`;
  let headers = await getHeaders();

  // Merge custom headers
  if (options.headers) {
    headers = { ...headers, ...options.headers };
  }

  let res = await fetch(url, {
    method,
    headers,
    body: options.body,
  });

  // ── 401/403 INTERCEPTOR: AUTO-REFRESH SESSION ──────────────────────
  if (res.status === 401 || res.status === 403) {
    console.warn(`[api] Session expired (${res.status}). Attempting automatic refresh...`);

    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      if (!error && session?.access_token) {
        localStorage.setItem('costloci_token', session.access_token);

        // Retry with new token
        headers['Authorization'] = `Bearer ${session.access_token}`;
        res = await fetch(url, {
          method,
          headers,
          body: options.body,
        });
      }
    } catch (refreshErr) {
      console.error('[api] Refresh failed:', refreshErr);
    }
  }

  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.error || 'Request failed');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
};

export const api = {
  get: (endpoint) => request('GET', endpoint),
  post: (endpoint, body) => request('POST', endpoint, { body: JSON.stringify(body) }),
  patch: (endpoint, body) => request('PATCH', endpoint, { body: JSON.stringify(body) }),
  delete: (endpoint) => request('DELETE', endpoint),

  upload: async (endpoint, formData) => {
    // Special case for FormData (no Content-Type header let fetch set boundary)
    const token = await getToken();
    const options = {
      body: formData,
      headers: {}
    };
    if (token) options.headers['Authorization'] = `Bearer ${token}`;

    const url = `${BASE_URL}${endpoint}`;
    let res = await fetch(url, {
      method: 'POST',
      headers: options.headers,
      body: formData
    });

    // 401/403 Refresh for Uploads
    if (res.status === 401 || res.status === 403) {
      const { data: { session } } = await supabase.auth.refreshSession();
      if (session?.access_token) {
        localStorage.setItem('costloci_token', session.access_token);
        options.headers['Authorization'] = `Bearer ${session.access_token}`;
        res = await fetch(url, {
          method: 'POST',
          headers: options.headers,
          body: formData
        });
      }
    }

    const data = await res.json();
    if (!res.ok) {
      const err = new Error(data.error || 'Upload failed');
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  },
};
