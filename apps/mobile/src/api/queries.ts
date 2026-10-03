import type {
  ItchProfileDto,
  PaymentDto,
  PaymentsImportResultDto,
  PaymentsSummaryDto,
} from '@itch/protocol';
import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { CompleteLoginInput } from './client';
import { apiClient } from './client';
import { logout, me } from './session';

export const queryKeys = {
  health: ['health'] as const,
  me: ['me'] as const,
  itchProfile: ['itch-profile'] as const,
  itchGames: ['itch-games'] as const,
  itchRewards: ['itch-rewards'] as const,
  itchCredentials: ['itch-credentials'] as const,
  itchGraphs: ['itch-graphs'] as const,
  payments: ['payments'] as const,
  paymentsSummary: ['payments-summary'] as const,
};

export const PAYMENTS_PAGE_SIZE = 20;

export function useHealth() {
  return useQuery({
    queryKey: queryKeys.health,
    queryFn: apiClient.health,
    retry: false,
  });
}

export function useMe() {
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: me,
    staleTime: 60_000,
    retry: false,
  });
}

export function useItchProfile(userId: string | null, itchAccessToken: string | null) {
  return useQuery({
    queryKey: [...queryKeys.itchProfile, userId] as const,
    queryFn: () =>
      apiClient.itchProfile(userId as string, itchAccessToken as string) as Promise<ItchProfileDto>,
    enabled: userId != null && itchAccessToken != null,
    staleTime: 60_000,
    retry: false,
  });
}

export function usePaymentsSummary(userId: string | null) {
  return useQuery({
    queryKey: queryKeys.paymentsSummary,
    queryFn: () => apiClient.paymentsSummary(userId as string) as Promise<PaymentsSummaryDto>,
    enabled: userId != null,
    staleTime: 60_000,
    retry: false,
  });
}

export function usePayments(userId: string | null) {
  return useInfiniteQuery({
    queryKey: [...queryKeys.payments, userId, PAYMENTS_PAGE_SIZE] as const,
    queryFn: ({ pageParam }) =>
      apiClient.payments(userId as string, PAYMENTS_PAGE_SIZE, pageParam as number) as Promise<
        PaymentDto[]
      >,
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (lastPage.length < PAYMENTS_PAGE_SIZE) return undefined;

      return lastPage.length;
    },
    enabled: userId != null,
    staleTime: 60_000,
    retry: false,
  });
}

export function useImportPayments() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, csv }: { userId: string; csv: string }) =>
      apiClient.importPayments(userId, csv),
    onError: (error) => console.warn('payments import failed', error),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.payments });
    },
  });
}

export function useCompleteLogin() {
  return useMutation({
    mutationFn: (input: CompleteLoginInput) => apiClient.completeLogin(input),
    onError: (error) => console.warn('itch sign-in failed', error),
    // NOTE: no cache invalidation here — the session is persisted by the
    // AuthProvider after the mutation resolves, and only then are the
    // session-dependent queries refreshed (otherwise they race the
    // SecureStore write and probe /auth/me without a token).
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => logout(),
    onSettled: () => {
      queryClient.clear();
    },
  });
}
