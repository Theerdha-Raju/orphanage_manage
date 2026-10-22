// apiConfig.js - Unified API helper with automatic fallback to prevent network/CORS/IPv6 connection issues

export const API_BASE = '/api';

export async function requestApi(endpoint, options = {}) {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  // Priority list of base URLs:
  // 1. Same-origin (handled by Vite proxy -> http://127.0.0.1:8000)
  // 2. Direct IPv4 loopback (http://127.0.0.1:8000)
  // 3. Direct localhost (http://localhost:8000)
  const candidateUrls = [
    cleanEndpoint,
    `http://127.0.0.1:8000${cleanEndpoint}`,
    `http://localhost:8000${cleanEndpoint}`
  ];

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
