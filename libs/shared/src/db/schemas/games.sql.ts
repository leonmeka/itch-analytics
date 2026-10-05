import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  type PgColumn,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { usersTable } from './users.sql';

export const gamesTable = pgTable(
  'games',
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

    external_id: text().notNull(),

    url: text().notNull(),
    title: text().notNull(),
    short_text: text(),
    cover_url: text(),
    classification: text(),
    type: text(),
    published: boolean().default(false).notNull(),
    published_at: timestamp(),
    external_created_at: timestamp(),
    min_price: integer(),
    views_count: integer(),
    downloads_count: integer(),
    purchases_count: integer(),
    traits: jsonb().$type<string[]>(),
  },
  (table) => [
    uniqueIndex('games_user_external_unique').on(table.user_id, table.external_id),
    index('games_user_idx').on(table.user_id),
  ],
);

export const gamesRelations = relations(gamesTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [gamesTable.user_id],
    references: [usersTable.id],
  }),
}));
