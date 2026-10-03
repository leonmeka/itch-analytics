import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { CompleteLoginInput } from './client';
import { apiClient } from './client';
import { logout, me } from './session';
import type {
  ItchClaimedRewards,
  ItchCredentials,
  ItchGame,
  ItchKeyStatus,
  ItchProfile,
  MetricsOverview,
} from './types';

export const queryKeys = {
  health: ['health'] as const,
  me: ['me'] as const,
  itchProfile: ['itch-profile'] as const,
  itchGames: ['itch-games'] as const,
  itchRewards: ['itch-rewards'] as const,
  itchCredentials: ['itch-credentials'] as const,
  itchKeyStatus: ['itch-key-status'] as const,
  itchGraphs: ['itch-graphs'] as const,
};

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

export function useItchProfile(itchAccessToken: string | null) {
  return useQuery({
    queryKey: queryKeys.itchProfile,
    queryFn: () => apiClient.itchProfile(itchAccessToken as string) as Promise<ItchProfile>,
    enabled: itchAccessToken != null,
    staleTime: 60_000,
    retry: false,
  });
}

export function useItchGames(itchAccessToken: string | null) {
  return useQuery({
    queryKey: queryKeys.itchGames,
    queryFn: () => apiClient.itchGames(itchAccessToken as string) as Promise<ItchGame[]>,
    enabled: itchAccessToken != null,
    staleTime: 60_000,
    retry: false,
  });
}

export function useItchClaimedRewards(itchAccessToken: string | null, gameId: string | null) {
  return useQuery({
    queryKey: [...queryKeys.itchRewards, gameId] as const,
    queryFn: () =>
      apiClient.itchClaimedRewards(
        itchAccessToken as string,
        gameId as string,
      ) as Promise<ItchClaimedRewards>,
    enabled: itchAccessToken != null && gameId != null,
    staleTime: 60_000,
    retry: false,
  });
}
export function useItchCredentials(itchAccessToken: string | null) {
  return useQuery({
    queryKey: queryKeys.itchCredentials,
    queryFn: () => apiClient.itchCredentials(itchAccessToken as string) as Promise<ItchCredentials>,
    enabled: itchAccessToken != null,
    staleTime: 60_000,
    retry: false,
  });
}

export function useItchGraphs(itchAccessToken: string | null) {
  return useQuery({
    queryKey: queryKeys.itchGraphs,
    queryFn: () => apiClient.itchGraphs(itchAccessToken as string) as Promise<MetricsOverview>,
    enabled: itchAccessToken != null,
    staleTime: 60_000,
    retry: false,
  });
}
export function useItchKeyStatus(itchAccessToken: string | null) {
  return useQuery({
    queryKey: queryKeys.itchKeyStatus,
    queryFn: () => apiClient.itchKeyStatus() as Promise<ItchKeyStatus>,
    enabled: itchAccessToken != null,
    staleTime: 60_000,
    retry: false,
  });
}

export function useSaveItchKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (apiKey: string) => apiClient.setItchKey(apiKey),
    onError: (error) => console.warn('failed to save itch API key', error),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.itchKeyStatus });
      void queryClient.invalidateQueries({ queryKey: queryKeys.itchGames });
    },
  });
}

export function useRemoveItchKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.removeItchKey(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.itchKeyStatus });
      void queryClient.invalidateQueries({ queryKey: queryKeys.itchGames });
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
