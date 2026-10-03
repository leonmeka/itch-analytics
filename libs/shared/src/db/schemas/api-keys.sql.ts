import { relations } from 'drizzle-orm';
import { type PgColumn, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

import { usersTable } from './users.sql';

export const apiKeysTable = pgTable(
  'api_keys',
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

    key_hash: text().notNull(),
    key_enc: text().notNull(),
  },
  (table) => [
    uniqueIndex('api_keys_user_id_unique').on(table.user_id),
    uniqueIndex('api_keys_key_hash_unique').on(table.key_hash),
  ],
);

export const apiKeysRelations = relations(apiKeysTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [apiKeysTable.user_id],
    references: [usersTable.id],
  }),
}));
