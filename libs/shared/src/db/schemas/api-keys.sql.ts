import { relations } from 'drizzle-orm';
import { type PgColumn, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

import { oauthIdentitiesTable } from './oauth-identities.sql';

export const apiKeysTable = pgTable(
  'api_keys',
  {
    id: uuid().primaryKey().defaultRandom().notNull(),
    created_at: timestamp().defaultNow().notNull(),
    updated_at: timestamp()
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),

    oauth_identity_id: uuid()
      .notNull()
      .references((): PgColumn => oauthIdentitiesTable.id, { onDelete: 'cascade' }),

    access_token_encrypted: text().notNull(),
  },
  (table) => [uniqueIndex('api_keys_oauth_identity_unique').on(table.oauth_identity_id)],
);

export const apiKeysRelations = relations(apiKeysTable, ({ one }) => ({
  oauth_identity: one(oauthIdentitiesTable, {
    fields: [apiKeysTable.oauth_identity_id],
    references: [oauthIdentitiesTable.id],
  }),
}));
