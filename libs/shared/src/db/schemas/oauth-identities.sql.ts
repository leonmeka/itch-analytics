import { relations } from 'drizzle-orm';
import {
  index,
  type PgColumn,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

import { OAuthProvider } from '../../types/oauth-identities.types';
import { usersTable } from './users.sql';

const oauthProviderValues = Object.values(OAuthProvider) as [OAuthProvider, ...OAuthProvider[]];

export const oauthProviderEnum = pgEnum('oauth_provider', oauthProviderValues);

export const oauthIdentitiesTable = pgTable(
  'oauth_identities',
  {
    id: uuid().primaryKey().defaultRandom().notNull(),
    created_at: timestamp().defaultNow().notNull(),
    updated_at: timestamp()
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),

    user_id: uuid()
      .notNull()
      .references((): PgColumn => usersTable.id, { onDelete: 'cascade' }),

    provider: oauthProviderEnum().notNull(),
    provider_user_id: text().notNull(),
    email: text(),
    username: text(),
    name: text(),
    avatar_url: text(),
  },
  (table) => [
    unique('oauth_identities_provider_user_id_unique').on(table.provider, table.provider_user_id),
    index('oauth_identities_user_id_idx').on(table.user_id),
  ],
);

export const oauthIdentitiesRelations = relations(oauthIdentitiesTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [oauthIdentitiesTable.user_id],
    references: [usersTable.id],
  }),
}));
