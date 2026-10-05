import type {
  AuthTokenResponseDto,
  GameDto,
  GamesImportResultDto,
  OauthIdentityDto,
  PaymentDto,
  PaymentsFilterDto,
  PaymentsGraphsDto,
  PaymentsImportResultDto,
  PaymentsSummaryDto,
  UserProfileDto,
  UserWithRevenueDto,
  ViewsGraphsDto,
  ViewsImportResultDto,
} from '@itch/protocol';
import { env } from '../env';
import { fetchBase } from './fetch-base';
import { authedFetch } from './session';

export type CompleteLoginInput = {
  accessToken: string;
  state: string;
};

export type CurrentUser = { id: string; role: 'user' | 'admin' } | null;

export type CompleteLoginResult = {
  redirect_url: string;
  user: { id: string; role: 'user' | 'admin' };
  access_token: string;
  refresh_token: string;
};

export const API_URL_BASE = env.EXPO_PUBLIC_API_URL;

export const loginURL = `${API_URL_BASE}/auth/login`;

const searchParams = (params: Record<string, string | number | undefined>): string => {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value != null && value !== '') query.set(key, String(value));
  }
  return query.toString();
};

export const apiClient = {
  health: () => fetchBase<{ status: string }>(API_URL_BASE, '/health'),
  completeLogin: (input: CompleteLoginInput) =>
    fetchBase<AuthTokenResponseDto>(API_URL_BASE, '/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token: input.accessToken, state: input.state }),
    }),
  oauthIdentity: (userId: string) =>
    authedFetch<OauthIdentityDto | null>(`/users/${userId}/oauth-identity`),
  importPayments: (userId: string, csv: string) =>
    authedFetch<PaymentsImportResultDto>(`/users/${userId}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csv }),
    }),
  paymentsGraph: (userId: string, filters: Partial<PaymentsFilterDto>) =>
    authedFetch<PaymentsGraphsDto>(`/users/${userId}/payments/graph?${searchParams(filters)}`),
  paymentsSummary: (userId: string, filters: Partial<PaymentsFilterDto>) =>
    authedFetch<PaymentsSummaryDto>(`/users/${userId}/payments/summary?${searchParams(filters)}`),
  payments: (userId: string, limit: number, offset: number, filters: Partial<PaymentsFilterDto>) =>
    authedFetch<PaymentDto[]>(
      `/users/${userId}/payments?${searchParams({ limit, offset, ...filters })}`,
    ),
  payment: (userId: string, paymentId: string) =>
    authedFetch<PaymentDto>(`/users/${userId}/payments/${paymentId}`),
  games: (userId: string, limit: number, offset: number) =>
    authedFetch<GameDto[]>(`/users/${userId}/games?${searchParams({ limit, offset })}`),
  importGames: (userId: string, payload: Record<string, unknown>) =>
    authedFetch<GamesImportResultDto>(`/users/${userId}/games`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
  importViews: (userId: string, payload: Record<string, unknown>) =>
    authedFetch<ViewsImportResultDto>(`/users/${userId}/views`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
  viewsGraph: (userId: string) => authedFetch<ViewsGraphsDto>(`/users/${userId}/views/graph`),
  creators: (limit: number, offset: number) =>
    authedFetch<UserWithRevenueDto[]>(`/users?${searchParams({ limit, offset })}`),
  creator: (userId: string) => authedFetch<UserProfileDto | null>(`/users/${userId}/profile`),
};
