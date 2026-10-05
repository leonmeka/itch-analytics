import { resolve } from 'node:path';
import { config as loadEnvironment } from 'dotenv';
import type { Config } from 'drizzle-kit';
import { defineConfig } from 'drizzle-kit';

loadEnvironment({ path: [resolve(process.cwd(), '.env'), resolve(process.cwd(), '../../.env')] });

if (!process.env.API_DATABASE_URL) {
  throw new Error(
    'API_DATABASE_URL is not set — run with the container env (compose env_file / --env-file), not a baked-in .env',
  );
}

const config: Config = defineConfig({
  dialect: 'postgresql',
  schema: [
    './src/db/schemas/api-keys.sql.ts',
    './src/db/schemas/games.sql.ts',
    './src/db/schemas/oauth-identities.sql.ts',
    './src/db/schemas/payments.sql.ts',
    './src/db/schemas/refresh-tokens.sql.ts',
    './src/db/schemas/users.sql.ts',
  ],
  out: './src/db/migrations',
  dbCredentials: {
    url: process.env.API_DATABASE_URL,
  },
  verbose: true,
  strict: true,
});

export default config;
