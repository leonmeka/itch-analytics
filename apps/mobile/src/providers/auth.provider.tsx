import type { UserDto } from '@itch/protocol';
import { useQueryClient } from '@tanstack/react-query';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { type CompleteLoginInput, loginURL } from '../api/client';
import { queryKeys, useCompleteLogin, useLogout, useMe } from '../api/queries';
import { loadSession, saveSession } from '../api/session';
import { deleteItchToken, saveItchToken } from '../utils/sync.storage';

export const OAUTH_RETURN_SCHEME = 'itch-dashboard';
export const OAUTH_RETURN_PATH = 'oauth';

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  isRedirecting: boolean;
  user: UserDto | null;
  login: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [redirecting, setRedirecting] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  const { data: meData, isPending } = useMe();
  const completeLoginMutation = useCompleteLogin();
  const logoutMutation = useLogout();

  const user: UserDto | null = meData ?? null;
  const isLoading = isPending || !sessionReady;
  const isAuthenticated = !redirecting && !isLoading && user !== null;

  useEffect(() => {
    void loadSession().then(() => {
      setSessionReady(true);
    });
  }, []);

  const queryClient = useQueryClient();

  const completeLogin = useCallback(
    async (input: CompleteLoginInput) => {
      const result = await completeLoginMutation.mutateAsync(input);

      await saveSession({
        accessToken: result.access_token,
        refreshToken: result.refresh_token,
      });
      await saveItchToken(input.accessToken);

      queryClient.setQueryData(queryKeys.me, result.user);
      void queryClient.invalidateQueries({ queryKey: queryKeys.oauthIdentity });
    },
    [completeLoginMutation, queryClient],
  );

  const login = useCallback(async () => {
    setRedirecting(true);
    try {
      await WebBrowser.dismissBrowser().catch(() => undefined);

      const result = await WebBrowser.openAuthSessionAsync(
        loginURL,
        Linking.createURL(`/${OAUTH_RETURN_PATH}`),
      );

      if (__DEV__) console.log('auth session returned:', JSON.stringify(result));

      let params = null;

      if (result.type === 'success') {
        params = parseNestedQuery(result.url);
      }

      if (params) {
        completeLogin({ accessToken: params.accessToken, state: params.state });
      } else {
        console.warn(`auth session closed without params (type=${result.type})`);
      }
    } catch (error) {
      console.warn('Failed to start itch OAuth flow', error);
    } finally {
      setRedirecting(false);
    }
  }, [completeLogin]);

  const logout = useCallback(() => {
    void deleteItchToken();
    logoutMutation.mutate();
  }, [logoutMutation]);

  const value = useMemo(
    () => ({
      isAuthenticated,
      isLoading,
      isRedirecting: redirecting,
      user,
      login,
      logout,
    }),
    [isAuthenticated, isLoading, redirecting, user, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};

function parseNestedQuery(deepLink: string): {
  accessToken: string;
  state: string;
} | null {
  const rawQuery = deepLink.split('?')[1] ?? deepLink.split('#')[1] ?? '';
  const params = new URLSearchParams(rawQuery.split('?')[0]);

  const accessToken = params.get('access_token');
  const state = params.get('state');

  if (!accessToken || !state) {
    return null;
  }

  return {
    accessToken,
    state,
  };
}
