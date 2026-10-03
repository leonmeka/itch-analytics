import { env } from '../env';
import { fetchBase } from './fetch-base';
import { authedFetch } from './session';
import type {
  ItchClaimedRewards,
  ItchCredentials,
  ItchGame,
  ItchKeyStatus,
  ItchProfile,
  MetricsOverview,
} from './types';

/** Completes the itch.io implicit OAuth flow started in the system browser. */
export type CompleteLoginInput = {
  /** Access token extracted from the callback URL hash. */
  accessToken: string;
  /** Signed state returned together with the access token. */
  state: string;
};

/** GET /auth/me response (null when signed out). */
export type CurrentUser = { id: string; role: 'user' | 'admin' } | null;

/** POST /auth/token response. */
export type CompleteLoginResult = {
  redirect_url: string;
  user: { id: string; role: 'user' | 'admin' };
  access_token: string;
  refresh_token: string;
};

export const API_URL_BASE = env.EXPO_PUBLIC_API_URL;

/** GET /auth/login is itself the redirect endpoint (302 to itch.io); open it in the system browser. */
export const loginURL = `${API_URL_BASE}/auth/login`;

export const apiClient = {
  health: () => fetchBase<{ status: string }>(API_URL_BASE, '/health'),
  completeLogin: (input: CompleteLoginInput) =>
    fetchBase<CompleteLoginResult>(API_URL_BASE, '/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token: input.accessToken, state: input.state }),
    }),
  itchProfile: (itchAccessToken: string) =>
    authedFetch<ItchProfile | null>('/itch/me', { itchToken: itchAccessToken }),
  itchGames: (itchAccessToken: string) =>
    authedFetch<ItchGame[]>('/itch/games', { itchToken: itchAccessToken }),
  itchClaimedRewards: (itchAccessToken: string, gameId: string, page = 1) =>
    authedFetch<ItchClaimedRewards | null>(`/itch/games/${gameId}/rewards?page=${page}`, {
      itchToken: itchAccessToken,
    }),
  itchCredentials: (itchAccessToken: string) =>
    authedFetch<ItchCredentials | null>('/itch/credentials', { itchToken: itchAccessToken }),
  itchGraphs: (itchAccessToken: string) =>
    authedFetch<MetricsOverview | null>('/itch/graphs', { itchToken: itchAccessToken }),
  itchKeyStatus: () => authedFetch<ItchKeyStatus>('/me/itch-key-status'),
  setItchKey: (apiKey: string) =>
    authedFetch<ItchKeyStatus>('/me/itch-key', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: apiKey }),
    }),
  removeItchKey: () => authedFetch<ItchKeyStatus>('/me/itch-key', { method: 'DELETE' }),
};
