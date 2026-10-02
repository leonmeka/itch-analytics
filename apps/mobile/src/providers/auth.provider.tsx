import * as Linking from 'expo-linking';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { apiClient, type CompleteLoginInput, type CurrentUser, loginURL } from '../api/client';
import { useCompleteLogin, useLogout, useMe } from '../api/queries';

/**
 * Handles the entire client-side auth logic, mirroring the ahegao setup.
 *
 * Flow (itch.io implicit OAuth on mobile):
 *   1. `login()` opens the API's `/auth/login` endpoint in the system
 *      browser; the strategy 302s to the itch.io authorization URL with
 *      a signed `state`.
 *   2. itch.io redirects to the registered callback; that page forwards
 *      the hash contents to this app via the `itch-dashboard://oauth?...`
 *      deep link.
 *   3. The deep-link handler feeds `access_token` + `state` into the
 *      `POST /auth/token` mutation, which sets the app-side auth cookies
 *      and provisions the session.
 *
 * The itch access token is kept in memory only — it is never persisted
 * server-side or in storage.
 */

export const OAUTH_RETURN_SCHEME = 'itch-dashboard';
export const OAUTH_RETURN_PATH = 'oauth';

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  isRedirecting: boolean;
  user: CurrentUser;
  /** itch.io access token (in-memory only, full-profile scope). */
  itchToken: string | null;
  login: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [redirecting, setRedirecting] = useState(false);
  const [itchToken, setItchToken] = useState<string | null>(null);

  const { data: meData, isPending } = useMe();
  const completeLoginMutation = useCompleteLogin();
  const logoutMutation = useLogout();

  const user: CurrentUser = meData ?? null;
  const isLoading = isPending;
  const isAuthenticated = !redirecting && !isLoading && user !== null;

  const completeLogin = useCallback(
    (input: CompleteLoginInput) => {
      setItchToken(input.accessToken);
      completeLoginMutation.mutate(input);
    },
    [completeLoginMutation],
  );

  const login = useCallback(async () => {
    setRedirecting(true);
    try {
      // /auth/login itself redirects (302) to itch.io with the signed state.
      await Linking.openURL(loginURL);
    } catch (error) {
      console.warn('Failed to start itch OAuth flow', error);
      setRedirecting(false);
    }
  }, []);

  const logout = useCallback(() => {
    setItchToken(null);
    logoutMutation.mutate();
  }, [logoutMutation]);

  useEffect(() => {
    const handleUrl = (url: string | null) => {
      if (!url) return;

      const parsed = Linking.parse(url);

      if (!parsed.path?.includes(OAUTH_RETURN_PATH)) return;

      const params = parseNestedQuery(url);

      if (!params) return;

      setRedirecting(false);
      completeLogin({ accessToken: params.accessToken, state: params.state });
    };

    void Linking.getInitialURL().then((url) => handleUrl(url));

    const subscription = Linking.addEventListener('url', (event) => handleUrl(event.url));

    return () => {
      subscription.remove();
    };
  }, [completeLogin]);

  const value = useMemo(
    () => ({
      isAuthenticated,
      isLoading,
      isRedirecting: redirecting,
      user,
      itchToken,
      login,
      logout,
    }),
    [isAuthenticated, isLoading, redirecting, user, itchToken, login, logout],
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

/**
 * The itch callback page forwards the OAuth hash via a deep link that keeps
 * the params in query-string form:
 *   itch-dashboard://oauth?access_token=…&state=…
 */
function parseNestedQuery(deepLink: string): {
  accessToken: string;
  state: string;
} | null {
  const rawQuery = deepLink.split('?')[1] ?? '';
  const params = new URLSearchParams(rawQuery.split('#')[0]);

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
