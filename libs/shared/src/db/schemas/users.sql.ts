import { relations } from 'drizzle-orm';
import { pgEnum, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';

import { apiKeysTable } from './api-keys.sql';
import { oauthIdentitiesTable } from './oauth-identities.sql';
import { refreshTokensTable } from './refresh-tokens.sql';

export const userRoleEnum = pgEnum('user_role', ['user', 'admin']);

export const usersTable = pgTable('users', {
  id: uuid().primaryKey().defaultRandom().notNull(),
  created_at: timestamp().defaultNow().notNull(),
  updated_at: timestamp()
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),

  role: userRoleEnum().default('user').notNull(),
});

export const usersRelations = relations(usersTable, ({ many, one }) => ({
  api_key: one(apiKeysTable),
  oauth_identities: many(oauthIdentitiesTable),
  refresh_tokens: many(refreshTokensTable),
}));
