import type { JwtSignOptions } from '@nestjs/jwt';
import type { Request } from 'express';

import type { User } from '@/libs/shared';

export interface AuthenticatedRequest extends Request {
  user: User;
  itchAccessToken?: string | null;
}

export interface AuthConfig {
  jwtSecret: string;
  jwtExpiresIn: JwtSignOptions['expiresIn'];
  refreshTokenExpiresIn: JwtSignOptions['expiresIn'];
  oauthSuccessRedirectUrl: string;

  itchClientID: string;
  itchCallbackURL: string;
  itchScope: string[];
  itchAuthorizationURL: string;
  itchUserinfoURL: string;
}
