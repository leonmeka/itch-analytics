import { relations } from 'drizzle-orm';
import {
  date,
  index,
  integer,
  type PgColumn,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { gamesTable } from './games.sql';
import { usersTable } from './users.sql';

export const viewsTable = pgTable(
  'views',
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
    game_id: uuid()
      .notNull()
      .references((): PgColumn => gamesTable.id, { onDelete: 'cascade' }),

    date: date().notNull(),
    count: integer().notNull(),
  },
  (table) => [
    uniqueIndex('views_user_game_date_unique').on(table.user_id, table.game_id, table.date),
    index('views_user_idx').on(table.user_id),
  ],
);

export const viewsRelations = relations(viewsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [viewsTable.user_id],
    references: [usersTable.id],
  }),
  game: one(gamesTable, {
    fields: [viewsTable.game_id],
    references: [gamesTable.id],
  }),
}));
