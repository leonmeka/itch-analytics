import * as SecureStore from 'expo-secure-store';

import { API_URL_BASE } from './client';
import { ApiError, fetchBase } from './fetch-base';

const SESSION_KEY = 'itch.session.v1';

export type StoredSession = {
  accessToken: string;
  refreshToken: string;
  itchToken: string | null;
};

let cached: StoredSession | null = null;
let loaded = false;

/** Device-only persistence (SecureStore): the RN cookie jar does not survive
 * app restarts, so the token pair lives here instead. */
export async function loadSession(): Promise<StoredSession | null> {
  if (loaded) return cached;

  try {
    const raw = await SecureStore.getItemAsync(SESSION_KEY);
    cached = raw ? (JSON.parse(raw) as StoredSession) : null;
  } catch {
    cached = null;
  }

  loaded = true;
  return cached;
}

export async function saveSession(session: StoredSession): Promise<void> {
  cached = session;
  loaded = true;
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
}

export async function clearSession(): Promise<void> {
  cached = null;
  loaded = true;
  await SecureStore.deleteItemAsync(SESSION_KEY);
}

/** Rotates the pair via /auth/refresh; returns the new session or null. */
async function refreshSession(refreshToken: string): Promise<StoredSession | null> {
  try {
    const result = await fetchBase<{
      refreshed: boolean;
      access_token?: string;
      refresh_token?: string;
    }>(API_URL_BASE, '/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!result.refreshed || !result.access_token || !result.refresh_token) {
      await clearSession();
      return null;
    }

    const next: StoredSession = {
      accessToken: result.access_token,
      refreshToken: result.refresh_token,
      itchToken: cached?.itchToken ?? null,
    };

    await saveSession(next);
    return next;
  } catch {
    return null;
  }
}

/**
 * Authenticated request: attaches the session Bearer (and optionally the
 * itch.io token under its dedicated header), transparently refreshing the
 * pair once on 401.
 */
export async function authedFetch<TResponse>(
  path: string,
  init: RequestInit & { itchToken?: string } = {},
): Promise<TResponse> {
  const { itchToken, ...rest } = init;
  const session = await loadSession();

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(rest.headers as Record<string, string> | undefined),
  };

  if (session?.accessToken) headers.Authorization = `Bearer ${session.accessToken}`;
  if (itchToken) headers['x-itch-token'] = itchToken;

  const doFetch = (bearer: string | undefined) =>
    fetch(`${API_URL_BASE}${path}`, {
      ...rest,
      headers: bearer ? { ...headers, Authorization: `Bearer ${bearer}` } : headers,
    });

  let response = await doFetch(session?.accessToken);

  if (response.status === 401 && session?.refreshToken) {
    const next = await refreshSession(session.refreshToken);

    if (next) {
      response = await doFetch(next.accessToken);
    }
  }

  if (!response.ok) {
    throw new ApiError(response.status);
  }

  return (await response.json()) as TResponse;
}

/** GET /auth/me against the stored session (null when signed out). */
export async function me(): Promise<{ id: string; role: 'user' | 'admin' } | null> {
  const session = await loadSession();

  if (!session) return null;

  return authedFetch<{ id: string; role: 'user' | 'admin' } | null>('/auth/me');
}

export async function logout(): Promise<void> {
  try {
    await authedFetch<void>('/auth/logout', { method: 'POST' });
  } catch {
    // server-side cleanup is best-effort; the local session dies regardless
  }

  await clearSession();
}
