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

export const api = {
  get: async (endpoint) => {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      headers: await getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  },

  post: async (endpoint, body) => {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  },

  patch: async (endpoint, body) => {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers: await getHeaders(),
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  },

  delete: async (endpoint) => {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: await getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  },

  // Special method for multipart/form-data (uploads)
  upload: async (endpoint, formData) => {
    const token = await getToken();
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) {
      const err = new Error(data.error || 'Upload failed');
      err.data = data;
      throw err;
    }
    return data;
  },
};
