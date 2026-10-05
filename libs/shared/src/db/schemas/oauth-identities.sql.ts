import { relations } from 'drizzle-orm';
import { index, type PgColumn, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';

import { usersTable } from './users.sql';

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

    itch_id: text().notNull(),

    username: text(),
    name: text(),
    avatar_url: text(),
  },
  (table) => [
    unique('oauth_identities_itch_id_unique').on(table.itch_id),
    index('oauth_identities_user_id_idx').on(table.user_id),
  ],
);

export const oauthIdentitiesRelations = relations(oauthIdentitiesTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [oauthIdentitiesTable.user_id],
    references: [usersTable.id],
  }),
}));
