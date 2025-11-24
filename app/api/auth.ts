/**
 * Small authentication helper for the mock/local API.
 *
 * Usage:
 * import { login, setApiBaseUrl } from '../api/auth';
 * await setApiBaseUrl('http://127.0.0.1');
 * const tokens = await login('user', 'pass');
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export type LoginResponse = {
  access: string;
  refresh: string;
};

let BASE_URL = 'http://127.0.0.1';
const ACCESS_KEY = '@e-dziennik:access';
const REFRESH_KEY = '@e-dziennik:refresh';

export const setApiBaseUrl = (url: string) => {
  // Remove trailing slash for consistency
  BASE_URL = url.replace(/\/$/, '');
};

/**
 * Send credentials to the server and return access/refresh tokens.
 * Also persists tokens to AsyncStorage.
 */
export const login = async (username: string, password: string): Promise<LoginResponse> => {
  const url = `${BASE_URL}/api/auth/login/`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    let text = await res.text();
    try {
      const json = JSON.parse(text);
      if (json.detail) text = json.detail;
      else text = JSON.stringify(json);
    } catch {
      // keep raw text
    }
    throw new Error(`Login failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  if (!data || typeof data.access !== 'string' || typeof data.refresh !== 'string') {
    throw new Error('Login response has unexpected shape');
  }

  await storeTokens(data.access, data.refresh);
  return { access: data.access, refresh: data.refresh };
};

export const storeTokens = async (access: string, refresh: string) => {
  try {
    await AsyncStorage.multiSet([[ACCESS_KEY, access], [REFRESH_KEY, refresh]]);
  } catch (e) {
    // non-fatal; tokens remain in memory only
    console.warn('Failed to persist tokens', e);
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(ACCESS_KEY);
  } catch (e) {
    return null;
  }
};

export const getRefreshToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(REFRESH_KEY);
  } catch (e) {
    return null;
  }
};

export const clearTokens = async () => {
  try {
    await AsyncStorage.multiRemove([ACCESS_KEY, REFRESH_KEY]);
  } catch (e) {
    console.warn('Failed to clear tokens', e);
  }
};

let refreshPromise: Promise<LoginResponse | null> | null = null;

/**
 * Call the refresh endpoint and persist new tokens.
 * Ensures only one refresh runs at a time.
 */
export const refreshAuth = async (): Promise<LoginResponse | null> => {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refresh = await getRefreshToken();
    if (!refresh) {
      refreshPromise = null;
      return null;
    }

    const url = `${BASE_URL}/api/auth/refresh/`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
      });

      if (!res.ok) {
        // refresh failed -> clear stored tokens
        await clearTokens();
        refreshPromise = null;
        return null;
      }

      const data = await res.json();
      // Some backends return { access } only; others may return both
      if (!data || typeof data.access !== 'string') {
        await clearTokens();
        refreshPromise = null;
        return null;
      }

      const newAccess = data.access;
      const newRefresh = typeof data.refresh === 'string' ? data.refresh : refresh;
      await storeTokens(newAccess, newRefresh);
      refreshPromise = null;
      return { access: newAccess, refresh: newRefresh };
    } catch (e) {
      await clearTokens();
      refreshPromise = null;
      return null;
    }
  })();

  return refreshPromise;
};

/**
 * Wrapper around fetch which attaches Authorization header (Bearer access).
 * On 401 it will attempt to refresh tokens once and retry the request.
 */
export const authenticatedFetch = async (input: RequestInfo, init: RequestInit = {}) => {
  const tryFetch = async (access?: string) => {
    const headers = new Headers(init.headers || {});
    headers.set('Content-Type', headers.get('Content-Type') ?? 'application/json');
    if (access) headers.set('Authorization', `Bearer ${access}`);

    return fetch(input, { ...init, headers });
  };

  const access = await getAccessToken();
  let res = await tryFetch(access ?? undefined);

  if (res.status !== 401) return res;

  // Try to refresh
  const refreshed = await refreshAuth();
  if (!refreshed) {
    // no refresh possible
    return res;
  }

  // retry with new access token
  res = await tryFetch(refreshed.access);
  return res;
};

export default {
  login,
  setApiBaseUrl,
  storeTokens,
  getAccessToken,
  getRefreshToken,
  clearTokens,
  refreshAuth,
  authenticatedFetch,
};
