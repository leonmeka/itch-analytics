import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient, type CompleteLoginInput, type CurrentUser } from './client';
import type { ItchGame, ItchProfile } from './types';

export const queryKeys = {
  health: ['health'] as const,
  me: ['me'] as const,
  itchProfile: ['itch-profile'] as const,
  itchGames: ['itch-games'] as const,
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
    queryFn: apiClient.me,
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

export function useCompleteLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CompleteLoginInput) => apiClient.completeLogin(input),
    onSuccess: (result) => {
      if (result.user) {
        queryClient.setQueryData(queryKeys.me, { id: result.user.id, role: 'user' });
      }
      void queryClient.invalidateQueries({ queryKey: queryKeys.itchProfile });
      void queryClient.invalidateQueries({ queryKey: queryKeys.itchGames });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.logout(),
    onSettled: () => {
      queryClient.clear();
    },
  });
}
