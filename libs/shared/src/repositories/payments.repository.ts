import { Inject, Injectable } from '@nestjs/common';
import { and, eq, isNotNull, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { DATABASE_KEY } from '../db/db.constants';
import { schema, TSchema } from '../db/db.inference';
import type { PaymentRevenueDayRow, PaymentRevenueRow } from '../types/payments.types';
import { BaseRepository } from './base.repository';

@Injectable()
export class PaymentsRepository extends BaseRepository<
  TSchema,
  typeof schema.paymentsTable,
  'paymentsTable'
> {
  constructor(@Inject(DATABASE_KEY) database: NodePgDatabase<TSchema>) {
    super(database, schema.paymentsTable, 'paymentsTable');
  }

  async getRevenueByCurrency(userId: string): Promise<PaymentRevenueRow[]> {
    return this.database
      .select({
        currency: sql<string>`coalesce(${schema.paymentsTable.currency}, 'USD')`,
        amount_cents: sql<number>`coalesce(sum(${schema.paymentsTable.amount_cents}), 0)::int`,
      })
      .from(schema.paymentsTable)
      .where(eq(schema.paymentsTable.user_id, userId))
      .groupBy(schema.paymentsTable.currency);
  }

  /** All-time cumulative revenue per day (running total, SQL window fn). */
  async getRevenueSeries(userId: string): Promise<PaymentRevenueDayRow[]> {
    return this.database
      .select({
        date: sql<string>`to_char(date_trunc('day', ${schema.paymentsTable.purchased_at}), 'YYYY-MM-DD')`,
        amount_cents: sql<number>`coalesce(sum(sum(${schema.paymentsTable.amount_cents})) OVER (ORDER BY min(${schema.paymentsTable.purchased_at})), 0)::int`,
      })
      .from(schema.paymentsTable)
      .where(
        and(eq(schema.paymentsTable.user_id, userId), isNotNull(schema.paymentsTable.purchased_at)),
      )
      .groupBy(sql`1`)
      .orderBy(sql`1`);
  }
}
