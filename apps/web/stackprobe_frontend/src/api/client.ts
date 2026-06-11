const BASE_URL = import.meta.env.VITE_BACKEND_URL;

// this is just defining a funciton type
type SessionExpiredHandler = () => void;

let onSessionExpired: SessionExpiredHandler = () => { };

/**
 * Register a global handler that fires whenever any API call
 * receives a 401 or 403 response. Called once from useAuth.
 */
export function setSessionExpiredHandler(handler: SessionExpiredHandler) {
  onSessionExpired = handler;
}

/**
 * Shared GET request with credentials and session-expiry handling.
 */
export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: 'include',
  });

  if (res.status === 401 || res.status === 403) {
    onSessionExpired();
    throw new Error('Session expired');
  }

  if (!res.ok) {
    throw new Error(await res.text() || 'Request failed');
  }

  return res.json();
}

/**
 * Shared POST request with credentials and session-expiry handling.
 */
export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 || res.status === 403) {
    onSessionExpired();
    throw new Error('Session expired');
  }

  if (!res.ok) {
    throw new Error(await res.text() || 'Request failed');
  }

  return res.json();
}
