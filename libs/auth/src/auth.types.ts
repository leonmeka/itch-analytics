import type { JwtSignOptions } from '@nestjs/jwt';
import type { Request } from 'express';

import type { User } from '@/libs/shared';

export interface AuthenticatedRequest extends Request {
  user: User;
}

export interface RefreshCookieConfig {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  path: string;
}

/**
 * itch.io is the only auth provider. The itch "OAuth" application is the
 * implicit flow: no code exchange, no client secret — the access token
 * comes back in the callback URL hash.
 */
export interface AuthConfig {
  jwtSecret: string;
  jwtExpiresIn: JwtSignOptions['expiresIn'];
  refreshTokenExpiresIn: JwtSignOptions['expiresIn'];
  oauthSuccessRedirectUrl: string;

  /* itch.io OAuth app */
  itchClientID: string;
  itchCallbackURL: string;
  itchScope: string[];
  itchAuthorizationURL: string;
  itchUserinfoURL: string;

  cookie: RefreshCookieConfig;
}
