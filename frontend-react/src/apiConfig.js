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

  let lastError = null;
  for (const url of candidateUrls) {
    try {
      const res = await fetch(url, options);
      return res;
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('Network request failed');
}
