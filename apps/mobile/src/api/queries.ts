import type {
  OauthIdentityDto,
  PaymentDto,
  PaymentsFilterDto,
  PaymentsGraphsDto,
  PaymentsSummaryDto,
} from '@itch/protocol';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { loadLastSynced, saveLastSynced } from '../utils/sync.storage';
import type { CompleteLoginInput } from './client';
import { apiClient } from './client';
import { logout, me } from './session';

export const queryKeys = {
  health: ['health'] as const,
  me: ['me'] as const,
  oauthIdentity: ['oauth-identity'] as const,
  payments: ['payments'] as const,
  paymentsSummary: ['payments-summary'] as const,
  paymentsGraph: ['payments-graph'] as const,
  lastSynced: ['last-synced'] as const,
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

export function useOauthIdentity(userId: string | null) {
  return useQuery({
    queryKey: [...queryKeys.oauthIdentity, userId] as const,
    queryFn: () => apiClient.oauthIdentity(userId as string) as Promise<OauthIdentityDto>,
    enabled: userId != null,
    staleTime: 60_000,
    retry: false,
  });
}

export function usePaymentsGraph(userId: string | null, filters: Partial<PaymentsFilterDto> = {}) {
  return useQuery({
    queryKey: [...queryKeys.paymentsGraph, userId, filters],
    queryFn: () => apiClient.paymentsGraph(userId as string, filters) as Promise<PaymentsGraphsDto>,
    enabled: userId != null,
    staleTime: 60_000,
    retry: false,
  });
}

export function usePaymentsSummary(
  userId: string | null,
  filters: Partial<PaymentsFilterDto> = {},
) {
  return useQuery({
    queryKey: [...queryKeys.paymentsSummary, userId, filters],
    queryFn: () =>
      apiClient.paymentsSummary(userId as string, filters) as Promise<PaymentsSummaryDto>,
    enabled: userId != null,
    staleTime: 60_000,
    retry: false,
  });
}

export function usePayments(userId: string | null, filters: Partial<PaymentsFilterDto> = {}) {
  return useInfiniteQuery({
    queryKey: [...queryKeys.payments, userId, PAYMENTS_PAGE_SIZE, filters] as const,
    queryFn: ({ pageParam }) =>
      apiClient.payments(
        userId as string,
        PAYMENTS_PAGE_SIZE,
        pageParam as number,
        filters,
      ) as Promise<PaymentDto[]>,
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.length < PAYMENTS_PAGE_SIZE) return undefined;

      return pages.reduce((offset, page) => offset + page.length, 0);
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
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.payments }),
        queryClient.invalidateQueries({ queryKey: queryKeys.paymentsSummary }),
        queryClient.invalidateQueries({ queryKey: queryKeys.paymentsGraph }),
      ]);
    },
  });
}

export function useLastSynced() {
  return useQuery({
    queryKey: queryKeys.lastSynced,
    queryFn: loadLastSynced,
    staleTime: Infinity,
    retry: false,
  });
}

export function useMarkSynced() {
  const queryClient = useQueryClient();

  return async () => {
    const syncedAt = new Date();
    await saveLastSynced(syncedAt);
    queryClient.setQueryData(queryKeys.lastSynced, syncedAt.toISOString());
  };
}

export function useCompleteLogin() {
  return useMutation({
    mutationFn: (input: CompleteLoginInput) => apiClient.completeLogin(input),
    onError: (error) => console.warn('itch sign-in failed', error),
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
