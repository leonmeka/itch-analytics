import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react';

import { apiClient, type CompleteLoginInput, type CurrentUser, loginURL } from '../api/client';
import { useCompleteLogin, useLogout, useMe } from '../api/queries';

/**
 * Handles the entire client-side auth logic, mirroring the ahegao setup.
 *
 * Flow (itch.io implicit OAuth on mobile):
 *   1. `login()` opens the API's `/auth/login` endpoint in an OS auth
 *      session (`ASWebAuthenticationSession` on iOS); the strategy 302s to
 *      the itch.io authorization URL with a signed `state`.
 *   2. itch.io redirects to the registered callback; that page forwards the
 *      hash contents via this app's `itch-dashboard://oauth?...` deep link,
 *      which closes the auth session and returns the URL to the app.
 *   3. The returned URL feeds `access_token` + `state` into the
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
      // A stale session (e.g. cancelled previously) blocks opening another
      // one; dismissing when none is open is a no-op.
      await WebBrowser.dismissBrowser().catch(() => undefined);

      // /auth/login itself redirects (302) to itch.io with the signed state.
      // The OS auth session (ASWebAuthenticationSession on iOS) hands the
      // final redirect URL — the app's own deep link with the OAuth params —
      // back to this app, no system-browser custom-scheme handoff needed.
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
        // Auth sheet closed without the app receiving the OAuth params
        console.warn(`auth session closed without params (type=${result.type})`);
      }
    } catch (error) {
      console.warn('Failed to start itch OAuth flow', error);
    } finally {
      // The auth hand-off is done either way; without this the signed-in
      // state would never render until a manual refresh re-inits state.
      setRedirecting(false);
    }
  }, [completeLogin]);

  const logout = useCallback(() => {
    setItchToken(null);
    logoutMutation.mutate();
  }, [logoutMutation]);

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
 * itch.io redirects with the params in the URL part (either `?query` or
 * `#hash` — see itch.io's implicit-flow docs), so accept both forms:
 *   itch-dashboard://oauth?access_token=…&state=…
 *   itch-dashboard://oauth#access_token=…&state=…
 */
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
