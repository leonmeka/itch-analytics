import { relations } from 'drizzle-orm';
import {
  index,
  integer,
  type PgColumn,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { usersTable } from './users.sql';

export const paymentsTable = pgTable(
  'payments',
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

    object_name: text(),
    source: text(),
    country_code: text(),
    donation: text(),
    on_sale: text(),
    product_price_cents: integer(),
    tax_added_cents: integer(),
    tip_cents: integer(),
    marketplace_fee_cents: integer(),
    source_fee_cents: integer(),
    payout: text(),
    amount_delivered_cents: integer(),
    currency: text(),
    source_id: text(),
    customer_key: text(),
    purchased_at: timestamp(),
    amount_cents: integer(),
  },
  (table) => [
    uniqueIndex('payments_user_external_unique').on(table.user_id, table.external_id),
    index('payments_user_idx').on(table.user_id),
  ],
);

export const paymentsRelations = relations(paymentsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [paymentsTable.user_id],
    references: [usersTable.id],
  }),
}));
