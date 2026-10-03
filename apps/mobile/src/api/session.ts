import type { UserDto } from '@itch/protocol';
import * as SecureStore from 'expo-secure-store';
import { API_URL_BASE } from './client';
import { ApiError, fetchBase } from './fetch-base';

const SESSION_KEY = 'itch.session.v1';

export type StoredSession = {
  accessToken: string;
  refreshToken: string;
};

export async function loadSession(): Promise<StoredSession | null> {
  try {
    const raw = await SecureStore.getItemAsync(SESSION_KEY);

    return raw ? (JSON.parse(raw) as StoredSession) : null;
  } catch {
    return null;
  }
}

export async function saveSession(session: StoredSession): Promise<void> {
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
}

export async function clearSession(): Promise<void> {
  await SecureStore.deleteItemAsync(SESSION_KEY);
}

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
    };

    await saveSession(next);
    return next;
  } catch {
    return null;
  }
}

export async function authedFetch<TResponse>(
  path: string,
  init: RequestInit = {},
): Promise<TResponse> {
  const session = await loadSession();

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(init.headers as Record<string, string> | undefined),
  };

  if (session?.accessToken) headers.Authorization = `Bearer ${session.accessToken}`;

  const doFetch = (bearer: string | undefined) =>
    fetch(`${API_URL_BASE}${path}`, {
      ...init,
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

export async function me(): Promise<UserDto | null> {
  const session = await loadSession();

  if (!session) return null;

  return authedFetch<UserDto | null>('/auth/me');
}

export async function logout(): Promise<void> {
  try {
    await authedFetch<void>('/auth/logout', { method: 'POST' });
  } catch {}

  await clearSession();
}
