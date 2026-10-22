// apiConfig.js - Unified API helper with automatic fallback to prevent network/CORS/IPv6 connection issues

const rawEnvApiUrl = (
  (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL)) ||
  ''
).trim().replace(/\/$/, '');

// Default production backend on Render if not specified at build time
const defaultProdBackend = 'https://orphanage-manage-1.onrender.com';

const isProductionRender = typeof window !== 'undefined' && window.location.hostname.includes('onrender.com');

export const API_BASE = rawEnvApiUrl
  ? `${rawEnvApiUrl}/api`
  : isProductionRender
    ? `${defaultProdBackend}/api`
    : '/api';

export const API_URL = API_BASE;

export async function requestApi(endpoint, options = {}) {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  const candidateUrls = [];

  // 1. Explicitly configured production backend (from VITE_API_URL)
  if (rawEnvApiUrl) {
    candidateUrls.push(`${rawEnvApiUrl}${cleanEndpoint}`);
  }

  // 2. Production Render default backend
  if (isProductionRender && !rawEnvApiUrl) {
    candidateUrls.push(`${defaultProdBackend}${cleanEndpoint}`);
  }

  // 3. Same-origin (e.g. local Vite proxy or unified server)
  candidateUrls.push(cleanEndpoint);

  // 4. Localhost loopback (only on HTTP local environments to avoid HTTPS mixed-content blocks)
  if (typeof window !== 'undefined' && window.location.protocol === 'http:') {
    candidateUrls.push(`http://127.0.0.1:8000${cleanEndpoint}`);
    candidateUrls.push(`http://localhost:8000${cleanEndpoint}`);
  }

  // Automatically attach auth headers if present in localStorage
  const userRole = localStorage.getItem('userRole');
  const userEmail = localStorage.getItem('userEmail');
  const userId = localStorage.getItem('userId');
  const volunteerId = localStorage.getItem('volunteerId');

  const headers = { ...(options.headers || {}) };
  if (userRole && !headers['X-User-Role']) headers['X-User-Role'] = userRole;
  if (userEmail && !headers['X-User-Email']) headers['X-User-Email'] = userEmail;
  if (userId && !headers['X-User-Id']) headers['X-User-Id'] = userId;
  if (volunteerId && !headers['X-Volunteer-Id']) headers['X-Volunteer-Id'] = volunteerId;

  const mergedOptions = { ...options, headers };

  let lastError = null;
  for (const url of candidateUrls) {
    try {
      const res = await fetch(url, mergedOptions);
      if (res.status === 502 || res.status === 504) {
        continue;
      }
      return res;
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('Network request failed');
}
