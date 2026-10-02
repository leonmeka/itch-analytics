import { env } from '../env';
import { fetchBase } from './fetch-base';
import type { ItchGame, ItchProfile } from './types';

/** Completes the itch.io implicit OAuth flow started in the system browser. */
export type CompleteLoginInput = {
  /** Access token extracted from the callback URL hash. */
  accessToken: string;
  /** Signed state returned together with the access token. */
  state: string;
};

/** GET /auth/me response (null when signed out). */
export type CurrentUser = { id: string; role: 'user' | 'admin' } | null;

const API_URL = env.EXPO_PUBLIC_API_URL;

/** GET /auth/login is itself the redirect endpoint (302 to itch.io); open it in the system browser. */
export const loginURL = `${API_URL}/auth/login`;

export const apiClient = {
  health: () => fetchBase<{ status: string }>(API_URL, '/health'),
  completeLogin: (input: CompleteLoginInput) =>
    fetchBase<{ redirect_url: string; user: { id: string } }>(API_URL, '/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token: input.accessToken, state: input.state }),
    }),
  me: () => fetchBase<CurrentUser>(API_URL, '/auth/me'),
  itchProfile: (itchAccessToken: string) =>
    fetchBase<ItchProfile | null>(API_URL, '/itch/me', {
      headers: { Authorization: `Bearer ${itchAccessToken}` },
    }),
  itchGames: (itchAccessToken: string) =>
    fetchBase<ItchGame[]>(API_URL, '/itch/games', {
      headers: { Authorization: `Bearer ${itchAccessToken}` },
    }),
  logout: () => fetchBase<void>(API_URL, '/auth/logout', { method: 'POST' }),
};
