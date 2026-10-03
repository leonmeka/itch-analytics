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
    amount: text(),
    source: text(),
    created_at_csv: text(),
    email: text(),
    full_name: text(),
    donation: text(),
    on_sale: text(),
    country_code: text(),
    ip: text(),
    product_price: text(),
    tax_added: text(),
    tip: text(),
    marketplace_fee: text(),
    source_fee: text(),
    payout: text(),
    amount_delivered: text(),
    currency: text(),
    source_id: text(),
    billing_name: text(),
    billing_street_1: text(),
    billing_street_2: text(),
    billing_city: text(),
    billing_state: text(),
    billing_zip: text(),
    billing_country: text(),
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
