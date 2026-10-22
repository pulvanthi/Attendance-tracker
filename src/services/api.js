// In development Vite proxies /api to localhost:8000. For a deployed site (e.g. Vercel) set
// VITE_API_URL to the public backend address, e.g. https://my-backend.onrender.com
const API_BASE = `${(import.meta.env.VITE_API_URL || '').replace(/\/+$/, '')}/api`;
const TOKEN_KEY = 'trackpulse_token';
const USER_KEY = 'trackpulse_user';

/** The session lives in localStorage when "Remember me" was ticked, otherwise in sessionStorage. */
export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
}

export function clearStoredSession() {
  [localStorage, sessionStorage].forEach((store) => {
    store.removeItem(TOKEN_KEY);
    store.removeItem(USER_KEY);
  });
}

/**
 * Common fetch client with automatic JWT bearer token injection.
 */
export async function apiRequest(endpoint, options = {}) {
  const token = getStoredToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      // Token expired or invalid
      clearStoredSession();
      window.dispatchEvent(new Event('auth_state_changed'));
    }

    if (!response.ok) {
      let errorDetail = 'An unexpected error occurred';
      const responseBody = await response.text();

      // The dev-server proxy answers 5xx with an empty body when the backend is down
      if (!responseBody && response.status >= 500) {
        throw new Error('Cannot reach the server. Make sure the backend is running on port 8000.');
      }

      if (responseBody) {
        try {
          const errorData = JSON.parse(responseBody);
          const detail = errorData.detail ?? errorData.message;
          errorDetail = Array.isArray(detail)
            ? detail.map((d) => d.msg || JSON.stringify(d)).join('; ')
            : detail || errorDetail;
        } catch {
          errorDetail = responseBody;
        }
      }
      throw new Error(errorDetail || `HTTP ${response.status}`);
    }

    // A successful DELETE commonly returns 204 and has no body to parse.
    if (response.status === 204) {
      return {};
    }

    // Return JSON if present, else empty object
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    return {};
  } catch (error) {
    console.error(`API Error on [${options.method || 'GET'} ${endpoint}]:`, error);
    throw error;
  }
}

/**
 * Download a file from an authenticated endpoint (a plain <a href> cannot send the JWT header).
 */
export async function apiDownload(endpoint, filename) {
  const token = getStoredToken();
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) {
    throw new Error(response.status === 401 ? 'Please sign in again' : `Download failed (HTTP ${response.status})`);
  }
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
