import { z } from 'zod';

export const env = z.object({
  NODE_ENV: z.enum(['development', 'production']),
  API_PORT: z.coerce.number().int(),
  API_DATABASE_URL: z.url(),
  API_CORS_ORIGINS: z.string(),
  API_JWT_SECRET: z.string(),
  API_JWT_EXPIRES_IN: z.string(),
  API_REFRESH_TOKEN_EXPIRES_IN: z.string(),
  API_OAUTH_ITCH_CLIENT_ID: z.string(),
  API_OAUTH_ITCH_CALLBACK_URL: z.string(),
  API_OAUTH_AUTH_SUCCESS_REDIRECT_URL: z.url(),
  APP_ENCRYPTION_KEY: z.string(),
});
