import { relations } from 'drizzle-orm';
import {
  index,
  type PgColumn,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { usersTable } from './users.sql';

export const refreshTokensTable = pgTable(
  'refresh_tokens',
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

    jti: text().notNull(),
    expires_at: timestamp().notNull(),
  },
  (table) => [
    index('refresh_tokens_user_id_idx').on(table.user_id),
    uniqueIndex('refresh_tokens_jti_idx').on(table.jti),
  ],
);

export const refreshTokensRelations = relations(refreshTokensTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [refreshTokensTable.user_id],
    references: [usersTable.id],
  }),
}));
