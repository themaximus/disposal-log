const SESSION_KEY = 'session_token';

export const getSessionToken = () => localStorage.getItem(SESSION_KEY);
export const setSessionToken = (token) => localStorage.setItem(SESSION_KEY, token);
export const clearSessionToken = () => localStorage.removeItem(SESSION_KEY);

export class ApiError extends Error {
  constructor(status, message, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

/**
 * fetch() wrapper for the app's own API: attaches the session token,
 * serializes JSON bodies and rejects on non-2xx responses.
 */
export async function apiRequest(url, { method = 'GET', body, headers = {}, ...rest } = {}) {
  const token = getSessionToken();
  const isJsonBody = body !== undefined && !(body instanceof FormData);

  const res = await fetch(url, {
    method,
    credentials: 'same-origin',
    ...rest,
    headers: {
      ...(isJsonBody ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers
    },
    body: isJsonBody ? JSON.stringify(body) : body
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (e) {
    data = text;
  }

  if (!res.ok) {
    const message = (data && data.error) || `HTTP ${res.status}`;
    throw new ApiError(res.status, message, data);
  }
  return data;
}

export const api = {
  get: (url, options) => apiRequest(url, { ...options, method: 'GET' }),
  post: (url, body, options) => apiRequest(url, { ...options, method: 'POST', body }),
  put: (url, body, options) => apiRequest(url, { ...options, method: 'PUT', body }),
  delete: (url, body, options) => apiRequest(url, { ...options, method: 'DELETE', body })
};
