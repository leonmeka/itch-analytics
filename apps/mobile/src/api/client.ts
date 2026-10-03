import type {
  AuthTokenResponseDto,
  ItchProfileDto,
  PaymentDto,
  PaymentsImportResultDto,
  PaymentsSummaryDto,
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

export const apiClient = {
  health: () => fetchBase<{ status: string }>(API_URL_BASE, '/health'),
  completeLogin: (input: CompleteLoginInput) =>
    fetchBase<AuthTokenResponseDto>(API_URL_BASE, '/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token: input.accessToken, state: input.state }),
    }),
  itchProfile: (userId: string, itchAccessToken: string) =>
    authedFetch<ItchProfileDto | null>(`/users/${userId}/itch/profile`, {
      itchToken: itchAccessToken,
    }),
  importPayments: (userId: string, csv: string) =>
    authedFetch<PaymentsImportResultDto>(`/users/${userId}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csv }),
    }),
  paymentsSummary: (userId: string) =>
    authedFetch<PaymentsSummaryDto>(`/users/${userId}/payments/summary`),
  payments: (userId: string, limit = 20, offset = 0) =>
    authedFetch<PaymentDto[]>(`/users/${userId}/payments?limit=${limit}&offset=${offset}`),
  payment: (userId: string, paymentId: string) =>
    authedFetch<PaymentDto>(`/users/${userId}/payments/${paymentId}`),
};
